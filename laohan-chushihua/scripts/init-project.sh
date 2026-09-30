#!/bin/bash
# init-project —— 项目正规基底一键初始化(laohan-chushihua 公开版,自包含)
# 产出: git 仓库(main) + 标准文档集骨架 + .githooks commit 门禁 + 首提交
# 自包含:不依赖 ~/.agents 治理层;若存在则自动增强(全局层指针+治理仓 sync)
# 用法: bash init-project.sh <项目路径> ["项目显示名"]
# 退出码: 0=成功 1=参数/状态不合法
set -u
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TARGET="${1:-}"
NAME="${2:-}"

[ -n "$TARGET" ] || { echo "用法: bash init-project.sh <项目路径> [\"项目显示名\"]"; exit 1; }
[ -x "$SCRIPT_DIR/pre-commit.template" ] || chmod +x "$SCRIPT_DIR/pre-commit.template"

# 治理层存在性(增强功能开关)
GOV_HOME="${GOV_HOME:-$HOME/.agents}"
HAS_GOV=0; [ -f "$GOV_HOME/AGENTS.md" ] && HAS_GOV=1

# 安全检查
if [ -e "$TARGET" ] && [ ! -d "$TARGET" ]; then
  echo "❌ 目标路径不是目录: $TARGET"; exit 1
fi
if [ -d "$TARGET" ] && [ -n "$(ls -A "$TARGET" 2>/dev/null)" ]; then
  echo "❌ 目标目录非空(安全拒绝;只对空/不存在目录初始化): $TARGET"
  echo "   已有项目请用「接入」模式(补缺不覆盖),见 SKILL.md 模式二。"
  exit 1
fi
[ -n "$NAME" ] || NAME="$(basename "$TARGET")"

mkdir -p "$TARGET/docs/handoff" || exit 1
cd "$TARGET" || exit 1
git init -q -b main || exit 1

# git identity 预检
if [ -z "$(git config user.name 2>/dev/null)" ] || [ -z "$(git config user.email 2>/dev/null)" ]; then
  echo "❌ 未配置 git identity——先执行:git config --global user.name/user.email"; exit 1
fi

# 治理层指针(存在时增强)
GOV_PTR=""
if [ "$HAS_GOV" -eq 1 ]; then
  GOV_PTR="\n> **全局层(跨项目)**:工作准则 = \`~/.agents/AGENTS.md\`;开发规则体系 = \`~/.agents/DEV_RULES.md\`(§3.7 文档集/§3.8 checklist)。与本文冲突时,**项目合同优先**。"
fi

cat > README.md <<EOF
# $NAME

> 一句话定位(TODO:这个项目是什么、给谁用)

## 快速上手

TODO(安装/运行命令)

## 关键入口

- STATUS.md — 当前状态与近期流水
- AGENTS.md — 规则真源(含项目特有合同)
- docs/ARCHITECTURE.md — 架构现状/目标
- docs/DECISIONS.md — 长期决策(ADR 式)
EOF

cat > AGENTS.md <<EOF
# $NAME — 工作规则(单一真源)

> 本文件是项目规则真源;CLAUDE.md 等入口文件只做指针。修改只改本文件,禁止镜像。
$GOV_PTR

## 接手顺序

1. 先读 STATUS.md 首条,再读本文「项目特有合同」。

## 项目特有合同(占位——首个开发会话填写后删除本行 TODO)

### 架构边界
- TODO: 技术栈/模块划分/数据真源在哪/什么禁止做

### 验证入口
- TODO: lint / typecheck / test / build 的**真实命令**

### 部署面与发布门禁
- TODO: 有哪些部署面、各自发布流程与回滚方式;无部署面写「纯本地项目」

### 费用边界
- TODO: 哪些动作须事前批准(默认:任何真实付费)

### 根目录纪律
- 根目录只放 README/AGENTS/CLAUDE/STATUS + 构建配置;其余文档进 docs/;交接/会话/提示词类只进 docs/handoff/。
EOF

cat > CLAUDE.md <<'EOF'
# Claude Code 入口(指针)

本项目规则真源 = ./AGENTS.md,开工先读并遵守;规则修改只改 AGENTS.md。
EOF

cat > STATUS.md <<EOF
# STATUS — 近期流水与接手入口

> 新条目置顶插入;超过 20 条由收尾窗口把更早条目原样移入 docs/handoff/ 并在顶部维持归档索引;不得改写或删除他人条目。

**$(date +%F)·项目初始化(init-project.sh,laohan-chushihua)。** 基底建立:标准文档集 + .githooks commit 门禁 + $( [ $HAS_GOV -eq 1 ] && echo "全局层指针" || echo "自包含模式(未检测到治理层)" )。待办:①项目特有合同由首个开发会话填写(AGENTS.md TODO 区);②按需远端 push / LICENSE。
EOF

cat > docs/DECISIONS.md <<'EOF'
# DECISIONS — 长期边界与取代关系

> ADR 式:只记商业规则/安全边界/数据所有权/不可逆选型;普通实现细节不进这里。
> 编号 D-001 起递增;取代旧决策时旧条目标注「Superseded by D-xxx」,同批清理被取代表述。

## D-001(格式示例,首个真实决策出现后可删)

- 状态: Accepted
- 内容: TODO
EOF

cat > docs/ARCHITECTURE.md <<'EOF'
# ARCHITECTURE — 架构(活文档,随实现更新)

> 区分现状与目标;过时内容随实现同批修正,不留新旧并存。

## 现状

TODO(初始化占位)

## 目标

TODO(初始化占位)
EOF

touch docs/handoff/.gitkeep
printf '.DS_Store\nnode_modules/\n' > .gitignore

# commit 门禁
mkdir -p .githooks
cp "$SCRIPT_DIR/pre-commit.template" .githooks/pre-commit
chmod +x .githooks/pre-commit
git config core.hooksPath .githooks

git add -A >/dev/null
git commit -q -m "init: 项目正规基底(init-project.sh,laohan-chushihua;标准文档集+commit 门禁$( [ $HAS_GOV -eq 1 ] && echo "+全局层指针" || echo "" ))" || exit 1

echo "✅ 初始化完成: $TARGET"
echo "   文件: $(git ls-files | wc -l | tr -d ' ') | 门禁: core.hooksPath=.githooks | 首提交: $(git rev-parse --short HEAD)"
echo "── 首个开发会话 TODO ──"
echo "   ① 填 AGENTS.md「项目特有合同」四个 TODO(架构/验证/部署/费用)"
echo "   ② 按需:远端 push;公开仓补 LICENSE/SECURITY"
