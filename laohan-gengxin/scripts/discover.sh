#!/bin/bash
# laohan-gengxin 工具发现脚本 v2
# 动态检测依赖包，与 tools.json 做差集，输出未收录的用户级工具
# 用法: bash scripts/discover.sh [references/tools.json路径]

set -euo pipefail

TOOLS_JSON="${1:-$(dirname "$0")/../references/tools.json}"
TMPDIR_SCAN=$(mktemp -d)
trap "rm -rf $TMPDIR_SCAN" EXIT

log() { echo "[$(date '+%H:%M:%S')] $*" >&2; }

# === 第1步: 全量采集 ===
log "采集 npm global..."
npm ls -g --json 2>/dev/null | python3 -c "
import json,sys
try:
    d=json.load(sys.stdin).get('dependencies',{})
    for k,v in d.items(): print(f'npm|{k}|{v[\"version\"]}')
except: pass
" > "$TMPDIR_SCAN/npm.txt"

log "采集 brew formula..."
brew list --formula --versions 2>/dev/null | while read line; do
    name=$(echo "$line" | awk '{print $1}')
    ver=$(echo "$line" | awk '{print $2}')
    echo "brew|$name|$ver"
done > "$TMPDIR_SCAN/brew.txt"

log "采集 brew cask..."
if brew list --cask --versions 2>/dev/null | grep -qv 'Rerun\|Error'; then
    brew list --cask --versions 2>/dev/null | while read line; do
        [ -z "$line" ] && continue
        name=$(echo "$line" | awk '{print $1}')
        ver=$(echo "$line" | awk '{print $2}')
        echo "cask|$name|$ver"
    done > "$TMPDIR_SCAN/cask.txt"
else
    for caskfile in ~/Library/Casks/*.rb; do
        [ -f "$caskfile" ] || continue
        name=$(basename "$caskfile" .rb)
        echo "cask|$name|unknown"
    done > "$TMPDIR_SCAN/cask.txt"
fi

log "采集 pip..."
pip3 list --format=json 2>/dev/null | python3 -c "
import json,sys
for item in json.load(sys.stdin):
    print(f'pip|{item[\"name\"].lower()}|{item[\"version\"]}')
" > "$TMPDIR_SCAN/pip.txt"

log "采集 uv tools..."
uv tool list 2>/dev/null | python3 -c "
import sys,re
for line in sys.stdin:
    line=line.strip()
    if line and not line.startswith('-') and not line.startswith(' '):
        m=re.match(r'(\S+)\s+v?(\S+)', line)
        if m: print(f'uv|{m.group(1)}|{m.group(2)}')
" > "$TMPDIR_SCAN/uv.txt"

log "采集 conda..."
conda list --json 2>/dev/null | python3 -c "
import json,sys
for item in json.load(sys.stdin):
    name=item.get('name','').lower()
    ver=item.get('version','')
    if name: print(f'conda|{name}|{ver}')
" > "$TMPDIR_SCAN/conda.txt"

log "采集 local bins..."
for bindir in ~/.local/bin /usr/local/bin ~/.bun/bin; do
    [ -d "$bindir" ] || continue
    for f in "$bindir"/*; do
        [ -f "$f" ] && [ -x "$f" ] && echo "local|$(basename $f)|$(basename $bindir)"
    done
done > "$TMPDIR_SCAN/local.txt"

# 合并所有采集结果
cat "$TMPDIR_SCAN"/*.txt > "$TMPDIR_SCAN/all_raw.txt"
TOTAL_RAW=$(wc -l < "$TMPDIR_SCAN/all_raw.txt" | tr -d ' ')
log "原始采集: $TOTAL_RAW 条"

# === 第2步: 动态构建依赖过滤集 ===
log "动态检测 brew 依赖..."
# brew leaves = 用户主动安装的，其余都是被自动拉入的依赖
comm -23 <(brew list --formula | sort) <(brew leaves | sort) \
    > "$TMPDIR_SCAN/brew_deps_dynamic.txt"

log "动态检测 pip 依赖（Required-by）..."
# 批量检查所有 pip 包的 Required-by 字段
pip3 list --format=json 2>/dev/null | python3 -c "
import json, sys, subprocess

packages = json.load(sys.stdin)
dep_only = set()
for item in packages:
    name = item['name']
    try:
        result = subprocess.run(
            ['pip3', 'show', name],
            capture_output=True, text=True, timeout=5
        )
        for line in result.stdout.splitlines():
            if line.startswith('Required-by:'):
                required_by = line.split(':', 1)[1].strip()
                if required_by:
                    dep_only.add(name.lower())
                break
    except Exception:
        pass

for name in sorted(dep_only):
    print(name)
" > "$TMPDIR_SCAN/pip_deps_dynamic.txt"

PIP_DEP_COUNT=$(wc -l < "$TMPDIR_SCAN/pip_deps_dynamic.txt" | tr -d ' ')
BREW_DEP_COUNT=$(wc -l < "$TMPDIR_SCAN/brew_deps_dynamic.txt" | tr -d ' ')
log "动态检测: brew 依赖=$BREW_DEP_COUNT | pip 依赖=$PIP_DEP_COUNT"

# === 第3步: 过滤依赖 + 差集比对 ===
python3 << PYEOF
import json, os

tmpdir = os.environ.get("TMPDIR_SCAN", "$TMPDIR_SCAN")
tools_json = "$TOOLS_JSON"

# 读 tools.json 已收录
with open(tools_json) as f:
    tools = json.load(f)

recorded = set()
for item in tools:
    n = item["name"].lower().split("(")[0].strip()
    recorded.add(n.replace(" ", "-"))
    if "pkg" in item:
        recorded.add(item["pkg"].lower())

# 已收录工具的 CLI 别名和 pip/conda 包名下划线/连字符差异
recorded.update({
    "claude",       # Claude Code → claude
    "hf",           # huggingface-cli → hf
    "duckduckgo_search",  # duckduckgo-search → duckduckgo_search (pip 下划线)
})

# 读动态检测的依赖集
with open(f"{tmpdir}/brew_deps_dynamic.txt") as f:
    brew_deps = set(line.strip().lower() for line in f if line.strip())

with open(f"{tmpdir}/pip_deps_dynamic.txt") as f:
    pip_deps = set(line.strip().lower() for line in f if line.strip())

# local-bin 附带文件（包管理器/平台附带，非独立工具）
LOCAL_SKIP = {
    "env", "env.fish", "npx", "corepack", "uv", "uvx",
    "docker-compose", "docker-credential-desktop", "docker-credential-osxkeychain",
    "hub-tool", "kubectl", "kubectl.docker",
    "pm2-dev", "pm2-docker", "pm2-runtime",
    "vc", "mcp-chrome-stdio", "tntfs", "uuremote",
    "python3.10",
    # bun 附带
    "bunx",
    # Docker Desktop 附带
    "cagent",
    # openclaw/skills 附带
    "oc-skills", "skillhub",
    # ralph CMS 附带
    "ralph-import", "ralph-migrate", "ralph-monitor", "ralph-setup",
    # huggingface-hub 附带
    "tiny-agents",
}

# brew 运行时依赖（brew leaves 检测不到的：被其他包依赖同时也是运行时）
BREW_RUNTIME_DEPS = {
    "bash", "ffmpeg-full", "node@22", "python@3.12", "python@3.14",
    "zsh-syntax-highlighting",
}

# pip/conda 依赖库（Required-by 为空但实际是库，无 CLI 入口点）
PIP_CONDA_LIBS = {
    # Web/HTTP
    "browserforge", "cssutils", "curl_cffi", "ddgs",
    "lxml_html_clean", "lxml-html-clean", "readability-lxml", "tavily-python",
    # 数据格式
    "markdown", "markdownify", "msgspec", "openpyxl",
    "pyyaml", "pyparsing",
    # 加密/安全
    "cryptography",
    # conda 独有 Python 依赖
    "aiofile", "aiofiles", "aiosqlite",
    "apify-fingerprint-datapoints", "apscheduler",
    "cloudpickle", "exceptiongroup", "et-xmlfile",
    "iniconfig", "pluggy", "py",
    "sortedcontainers", "tomli", "webencodings", "zipp",
    # conda 独有 C/C++ 和系统库（与 pip 重名但版本不同）
    "c-ares", "ca-certificates", "expat",
    "libarchive", "libnghttp2", "ncurses", "pcre2",
    "readline", "simdjson", "sqlite", "xz", "zlib", "zstd",
    # Anthropic SDK（被其他包依赖，用户不直接 CLI 调用）
    "anthropic",
    # PostgreSQL MCP（服务型，不是 CLI 工具）
    "postgres-mcp",
}

# conda C/C++ 库和基础设施（conda 独有，pip 里没有这些）
CONDA_CPP_INFRA = {
    "bzip2", "cpp-expected", "fmt", "icu", "libcxx", "libcurl",
    "libev", "libffi", "libiconv", "libmamba", "libmambapy", "libmpdec",
    "librt", "libsolv", "libssh2", "libxml2", "lz4-c", "nlohmann_json",
    "openssl", "reproc", "reproc-cpp", "spdlog", "tk", "yaml-cpp",
    "zstandard", "audioop-lts", "flatbuffers", "pybind11-abi",
    "python_abi", "python.app",
}

# conda 包管理器自身
CONDA_SELF = {
    "conda", "conda-anaconda-telemetry", "conda-anaconda-tos",
    "conda-content-trust", "conda-libmamba-solver",
    "conda-package-handling", "conda-package-streaming",
    "menuinst", "anaconda-anon-usage", "anaconda-auth",
    "anaconda-cli-base", "archspec",
}

# pip/conda 包管理器自身
PKG_MGR_SELF = {"pip", "wheel", "setuptools", "npm"}

# 读所有原始采集
all_items = []
with open(f"{tmpdir}/all_raw.txt") as f:
    for line in f:
        line = line.strip()
        if not line or "|" not in line:
            continue
        parts = line.split("|", 2)
        if len(parts) == 3:
            all_items.append((parts[0], parts[1], parts[2]))

# 过滤并输出
new_found = []
for source, name, ver in all_items:
    nlower = name.lower()

    # 已收录 → 跳过
    if nlower in recorded:
        continue

    # 包管理器自身 → 跳过
    if nlower in PKG_MGR_SELF:
        continue

    # brew 自动依赖 → 跳过
    if source == "brew" and nlower in brew_deps:
        continue

    # brew 运行时依赖（brew leaves 检测不到的）
    if source == "brew" and nlower in BREW_RUNTIME_DEPS:
        continue

    # pip/conda 依赖库（Required-by 为空但无 CLI 入口的库）
    if nlower in PIP_CONDA_LIBS:
        continue

    # pip: Required-by 不为空 → 纯依赖
    if source == "pip" and nlower in pip_deps:
        continue

    # conda: 复用 pip 依赖集 + conda 独有过滤
    if source == "conda":
        if nlower in pip_deps:
            continue
        if nlower in CONDA_CPP_INFRA:
            continue
        if nlower in CONDA_SELF:
            continue
        # conda 纯库模式：无 CLI 入口的 Python 包
        # 这些是常见的数据科学/后端库，用户不直接调用 CLI
        conda_known_libs = {
            "altair", "authlib", "azure-core", "azure-identity", "azure-storage-blob",
            "backoff", "baostock", "beartype", "bidict", "blinker", "boltons",
            "boto3", "botocore", "brotlicffi", "browser-cookie3",
            "bs4", "bubus", "cachetools", "caio", "cdp-use", "cfgv",
            "colorama", "contourpy", "croniter", "cycler", "cyclopts",
            "defusedxml", "dingtalk-stream", "discord-py", "diskcache",
            "distlib", "dnspython", "docstring-parser", "docutils",
            "email-validator", "emoji", "fake-useragent", "fastapi",
            "fastapi-sso", "fastuuid", "feedfinder2", "feedparser", "flask",
            "fonttools", "frozendict", "geoip2", "gitdb", "gitpython",
            "gmssl", "google-ai-generativelanguage", "google-api-core",
            "google-api-python-client", "google-auth", "google-auth-httplib2",
            "google-auth-oauthlib", "google-genai", "google-generativeai",
            "google-search-results", "googleapis-common-protos",
            "griffelib", "groq", "grpcio", "grpcio-status", "gunicorn",
            "h2", "hf-xet", "hpack", "html5lib", "httplib2", "humanize",
            "hyperframe", "identify", "importlib-metadata",
            "inquirerpy", "instructor", "isodate", "itsdangerous",
            "jaraco.classes", "jaraco.context", "jaraco.functools",
            "jeepney", "jieba3k", "jmespath", "joblib", "json-repair",
            "jsonpatch", "jsonpath", "jsonpointer", "jsonref", "jsonschema-path",
            "keyring", "kiwisolver", "language-tags", "lark-oapi",
            "lazy-object-proxy", "linkify-it-py", "litellm-enterprise",
            "litellm-proxy-extras", "loguru", "magika", "markdown-it-py",
            "markdown2", "markitdown", "markupsafe", "matplotlib", "maxminddb",
            "mdit-py-plugins", "mdurl", "mini-racer", "msal", "msal-extensions",
            "msgpack", "multidict", "multitasking", "mypy-extensions",
            "narwhals", "nest-asyncio", "newspaper3k", "nltk",
            "nodeenv", "oauth-cli-kit", "oauthlib", "ollama", "onnxruntime",
            "openapi-core", "openapi-pydantic", "openapi-schema-validator",
            "openapi-spec-validator", "openpyxl", "opentelemetry-api",
            "outcome", "pandas", "parse", "pathable", "pathspec",
            "pbkdf2", "peewee", "pfzy", "pglast", "pkce", "platformdirs",
            "polars", "polars-runtime-32", "portalocker",
            "posthog", "prompt-toolkit", "propcache", "proto-plus", "protobuf",
            "psutil", "psycopg", "psycopg-binary", "psycopg-pool",
            "py-key-value-aio", "pyaes", "pyasn1", "pyasn1-modules",
            "pycosat", "pycryptodomex", "pydantic", "pydantic-core",
            "pydeck", "pydub", "pynacl", "pyobjc-core", "pyobjc-framework-cocoa",
            "pyotp", "pyparsing", "pypdf", "pyperclip", "pysocks", "pytdx",
            "pytest-asyncio", "pytest-base-url", "pytest-playwright",
            "python-dateutil", "python-docx", "python-dotenv",
            "python-engineio", "python-slugify", "python-socketio",
            "python-socks", "python-telegram-bot", "pytokens", "pytz",
            "qq-botpy", "readchar", "redis", "reportlab",
            "requests", "requests-file", "requests-oauthlib", "retry",
            "rfc3339-validator", "rich", "rich-rst", "rq", "ruamel.yaml",
            "ruamel.yaml.clib", "s3transfer", "schedule", "screeninfo",
            "secretstorage", "semver", "sgmllib3k", "shellingham",
            "simple-websocket", "simplejson", "slack-sdk", "slackify-markdown",
            "smmap", "socksio", "soundfile", "sqlalchemy", "svgwrite",
            "sympy", "tenacity", "text-unidecode", "textual",
            "tinysegmenter", "tldextract", "tokenizers", "toml", "tornado",
            "trio", "trio-websocket", "truststore",
            "ty", "typer", "typer-slim", "types-pyyaml", "types-yt-dlp",
            "typing-extensions", "tzdata", "tzlocal",
            "ua-parser", "ua-parser-builtins", "uc-micro-py", "uncalled-for",
            "uritemplate", "uuid7", "uvloop", "virtualenv",
            "watchfiles", "websocket-client", "werkzeug", "wsproto", "xlrd",
            "yarl", "browser-use-sdk", "annotated-doc", "curl-cffi",
            "jinja2", "lxml", "numpy", "pillow",
        }
        if nlower in conda_known_libs:
            continue

    # local-bin 附带文件 → 跳过
    if source == "local" and nlower in LOCAL_SKIP:
        continue

    new_found.append((source, name, ver))

# 去重
seen = set()
unique = []
for s, n, v in new_found:
    key = f"{s}:{n.lower()}"
    if key not in seen:
        seen.add(key)
        unique.append((s, n, v))

if unique:
    print(f"== 新发现（已安装但未收录）: {len(unique)} 条 ==")
    for source, name, ver in sorted(unique, key=lambda x: (x[0], x[1])):
        print(f"  [{source}] {name} {ver}")
else:
    print("== 无遗漏，tools.json 与系统完全一致 ==")

print(f"\n统计: tools.json={len(tools)} | 原始采集={len(all_items)} | 新发现={len(unique)}")
print(f"动态过滤: brew依赖={len(brew_deps)} | pip依赖={len(pip_deps)} | conda基础设施={len(CONDA_CPP_INFRA)+len(CONDA_SELF)} | conda已知库={len(conda_known_libs)}")
PYEOF

log "发现完成"
