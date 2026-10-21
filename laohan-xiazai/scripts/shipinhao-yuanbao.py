#!/usr/bin/env python3
"""视频号下载 — 元宝凭证方案（skill 自包含脚本）。

链路：
  1. login   : playwright 打开 yuanbao.tencent.com（需用户微信扫码登录，
               人工动作 AI 无法代替），登录后采集 cookie（hy_user+hy_token）
               + 登录态元宝 API 请求头，0600 原子存
               ~/.local/share/laohan-xiazai/yuanbao-cred.json
  2. download: POST 元宝 get_parse_result → data.playable_url 提取 token/eid
               → POST channels get_feed_info → h264/h265 videoUrl → 下载
               （.part 中间文件 + 大小/类型校验后转正）

用法：
  python3 shipinhao-yuanbao.py login                 # 首次登录采集（弹浏览器扫码）
  python3 shipinhao-yuanbao.py "分享文本或链接"        # 下载（落 ~/Downloads）
  python3 shipinhao-yuanbao.py status                # 凭证状态（本地存在性）

依赖：python3 + playwright(login 用；download 仅标准库)。
  pip3 install playwright && playwright install chromium

注意：接口为逆向元宝/视频号行为，随时可能失效（已知：Step2 合法返回 201）。
"""
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

CRED_PATH = os.path.abspath(os.path.expanduser(
    os.environ.get("SHIPINHAO_CRED", "~/.local/share/laohan-xiazai/yuanbao-cred.json")))
DOWNLOAD_DIR = os.path.expanduser("~/Downloads")
UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36")
YUANBAO_PARSE = "https://yuanbao.tencent.com/api/weixin/get_parse_result"
FEED_API = "https://channels.weixin.qq.com/finder-preview/api/feed/get_feed_info"
LOGIN_URL = "https://yuanbao.tencent.com/"
LOGIN_TIMEOUT_S = 300


def cred_ok(cred) -> bool:
    """严格校验：dict 结构 + cookie 键值对里同时有 hy_user 与 hy_token。"""
    if not isinstance(cred, dict):
        return False
    cookie = cred.get("cookie")
    if not isinstance(cookie, str) or not cookie:
        return False
    pairs = dict(kv.split("=", 1) for kv in cookie.split("; ") if "=" in kv)
    return "hy_user" in pairs and "hy_token" in pairs


def load_cred() -> dict | None:
    try:
        with open(CRED_PATH, encoding="utf-8") as f:
            cred = json.load(f)
        return cred if cred_ok(cred) else None
    except (OSError, ValueError):
        return None


def save_cred_atomic(cred: dict) -> None:
    """0600 原子写：临时文件 + rename，避免宽权限窗口与中断残留。"""
    os.makedirs(os.path.dirname(CRED_PATH), exist_ok=True)
    tmp = CRED_PATH + ".tmp"
    fd = os.open(tmp, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    with os.fdopen(fd, "w", encoding="utf-8") as f:
        json.dump(cred, f, ensure_ascii=False, indent=2)
    os.replace(tmp, CRED_PATH)
    os.chmod(CRED_PATH, 0o600)


def cmd_status() -> int:
    cred = load_cred()
    if cred:
        print(f"✓ 凭证本地有效（结构完整）：{CRED_PATH}（saved_at={cred.get('saved_at', '?')}）")
        print("  注：仅验证本地结构，未向服务器验证；失效会在下载时报 401/403")
        return 0
    print(f"✗ 无有效凭证。运行: python3 {sys.argv[0]} login")
    return 1


def cmd_login() -> int:
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print("缺 playwright。安装：pip3 install playwright && playwright install chromium")
        return 2
    cred = {"headers": {}, "cookie": "", "saved_at": time.strftime("%Y-%m-%d %H:%M:%S")}
    print("=" * 56)
    print("⚠️  需要你操作：即将打开浏览器窗口 → 用微信扫码登录腾讯元宝")
    print("    · 人工扫码动作，AI 无法代替；最长等 5 分钟")
    print("    · 登录后停留 3 秒采集请求头；凭证只存本机（0600），不上传")
    print("=" * 56)
    with sync_playwright() as p:
        try:
            browser = p.chromium.launch(channel="chrome", headless=False)
        except Exception:
            browser = p.chromium.launch(headless=False)
        ctx = browser.new_context(user_agent=UA)
        page = ctx.new_page()
        logged_in = {"ok": False}

        def on_request(req):
            # 只在登录态确立后记录元宝 API 请求头（避免冻结匿名会话头）
            if logged_in["ok"] and "/api/" in req.url and "yuanbao.tencent.com" in req.url:
                for k, v in req.headers.items():
                    if k.lower().startswith(("x-", "t-")):
                        cred["headers"][k] = v

        page.on("request", on_request)
        page.goto(LOGIN_URL)
        deadline = time.time() + LOGIN_TIMEOUT_S
        while time.time() < deadline:
            cookies = {c["name"]: c["value"] for c in ctx.cookies(LOGIN_URL)}
            if "hy_user" in cookies and "hy_token" in cookies:
                logged_in["ok"] = True
                cred["cookie"] = "; ".join(f"{k}={v}" for k, v in cookies.items())
                break
            time.sleep(2)
        if logged_in["ok"]:
            time.sleep(3)  # 等登录态业务请求经过，采集最新请求头
            # 最后再刷一次 cookie（登录后可能更新）
            cookies = {c["name"]: c["value"] for c in ctx.cookies(LOGIN_URL)}
            cred["cookie"] = "; ".join(f"{k}={v}" for k, v in cookies.items())
        browser.close()
    if not cred_ok(cred):
        print("✗ 超时未捕获到登录态（hy_user+hy_token）。重跑 login 再试。")
        return 1
    save_cred_atomic(cred)
    print(f"✓ 凭证已保存：{CRED_PATH}（含 {len(cred['headers'])} 个登录态元宝请求头）")
    return 0


def post_json(url: str, body: dict, headers: dict) -> dict:
    data = json.dumps(body).encode()
    req = urllib.request.Request(url, data=data, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            raw = resp.read().decode()
    except urllib.error.HTTPError as e:
        raise ApiHttpError(e.code) from None
    return json.loads(raw) if raw.strip() else {}


class ApiHttpError(Exception):
    def __init__(self, code: int):
        self.code = code


def extract_share_url(text: str) -> str:
    m = re.search(r"https?://[^\s\"'<>,，。；！？]+", text)  # 剔除中英尾部标点
    if not m:
        print("✗ 未识别到视频号分享链接")
        sys.exit(1)
    url = m.group(0)
    if not re.search(r"weixin\.qq\.com|channels\.weixin", url):
        print(f"✗ 链接域名不像视频号分享（{url[:60]}）")
        sys.exit(1)
    return url


def sanitize_filename(name: str) -> str:
    """按 UTF-8 字节数截断（保留扩展名余量），防 4 字节字符超文件系统限制。"""
    out = re.sub(r"[^\w\-.]+", "_", name).strip("_") or "shipinhao"
    return out.encode("utf-8")[:200].decode("utf-8", errors="ignore")


def cmd_download(share_text: str) -> int:
    cred = load_cred()
    if not cred:
        print("✗ 凭证缺失/过期。运行: python3 %s login" % sys.argv[0])
        return 1
    share_url = extract_share_url(share_text)
    h1 = {
        "Accept": "application/json, text/plain, */*",
        "Content-Type": "application/json",
        "Origin": "https://yuanbao.tencent.com",
        "Referer": "https://yuanbao.tencent.com/",
        "User-Agent": UA,
        "Cookie": cred["cookie"],
        **cred.get("headers", {}),
    }
    try:
        r1 = post_json(YUANBAO_PARSE, {"type": "video_channel_url", "url": share_url, "scene": 1}, h1)
    except ApiHttpError as e:
        if e.code in (401, 403):
            print("✗ 凭证过期（HTTP %d）。重跑 login。" % e.code)
            return 1
        print(f"✗ 元宝接口异常（HTTP {e.code}），接口可能变更")
        return 1
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError):
        print("✗ 元宝接口网络/响应异常，稍后重试或检查接口变更")
        return 1
    playable = (r1.get("data") or {}).get("playable_url")
    if not playable:
        print("✗ 元宝未返回 playable_url（视频可能被删/限流，接口可能变更）")
        return 1
    q = dict(urllib.parse.parse_qsl(urllib.parse.urlparse(playable).query))
    token, eid = q.get("token"), q.get("eid")
    if not (token and eid):
        print("✗ playable_url 缺 token/eid 参数")
        return 1

    _rid = str(int(time.time() * 1000))
    feed_url = FEED_API + "?_rid=" + _rid + "&_pageUrl=" + urllib.parse.quote(
        "https://channels.weixin.qq.com/finder-preview/pages/feed", safe="")
    h2 = {
        "Accept": "application/json, text/plain, */*",
        "Content-Type": "application/json",
        "Origin": "https://channels.weixin.qq.com",
        "Referer": ("https://channels.weixin.qq.com/finder-preview/pages/feed"
                    "?entry_card_type=48&comment_scene=39&appid=0&token="
                    + urllib.parse.quote(token, safe="") + "&entry_scene=0&eid="
                    + urllib.parse.quote(eid, safe="")),
        "User-Agent": UA,
    }
    try:
        r2 = post_json(feed_url, {"baseReq": {"generalToken": token}, "exportId": eid}, h2)
    except (ApiHttpError, urllib.error.URLError, TimeoutError, json.JSONDecodeError):
        print("✗ feed 接口异常（201 是合法状态码，此异常为真失败）")
        return 1
    info = (r2.get("data") or {}).get("feedInfo") or r2.get("data") or {}
    video = ((info.get("h264VideoInfo") or {}).get("videoUrl")
             or (info.get("h265VideoInfo") or {}).get("videoUrl")
             or info.get("videoUrl"))
    if not video:
        print("✗ feed 未返回视频地址（接口可能变更）")
        return 1
    desc = info.get("description") or eid

    os.makedirs(DOWNLOAD_DIR, exist_ok=True)
    base = sanitize_filename(str(desc)) + f"_{eid[-8:]}"
    out = os.path.join(DOWNLOAD_DIR, base + ".mp4")
    part = out + ".part"
    print(f"下载中 → {out}")
    try:
        req = urllib.request.Request(video, headers={"User-Agent": UA})
        with urllib.request.urlopen(req, timeout=300) as resp, open(part, "wb") as f:
            ctype = resp.headers.get("Content-Type", "")
            if "text/html" in ctype.lower():
                print("✗ 返回的是 HTML 页面不是视频（链接被拦截/过期）")
                return 1
            while True:
                chunk = resp.read(1 << 20)
                if not chunk:
                    break
                f.write(chunk)
    except (urllib.error.URLError, TimeoutError) as e:
        print(f"✗ 下载失败（{type(e).__name__}），CDN 链接可能过期，重跑一次")
        if os.path.exists(part):
            os.remove(part)
        return 1
    size = os.path.getsize(part) if os.path.exists(part) else 0
    if size < 10240:  # <10KB 视为异常（正常视频远大于此）
        print(f"✗ 下载内容过小（{size}B），疑似拦截页/坏数据，已丢弃")
        if os.path.exists(part):
            os.remove(part)
        return 1
    if os.path.exists(out):
        print(f"⚠ 已有同名文件，保留旧文件：{out}（本次存 {base}_new.mp4）")
        out = os.path.join(DOWNLOAD_DIR, base + "_new.mp4")
    os.replace(part, out)
    print(f"✓ 完成：{out}（{os.path.getsize(out) / 1048576:.1f} MB）")
    return 0


def main() -> int:
    args = sys.argv[1:]
    if not args or args[0] in ("-h", "--help"):
        print(__doc__)
        return 0
    if args[0] == "login":
        return cmd_login()
    if args[0] == "status":
        return cmd_status()
    return cmd_download(" ".join(args))


if __name__ == "__main__":
    sys.exit(main())
