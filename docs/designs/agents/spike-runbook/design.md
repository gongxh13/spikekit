---
title: spike-runbook：调研仓库、实跑命令后写出 AGENTS.md + CLAUDE.md
status: implemented
summary: 与 /init 的区别是命令先实跑、只写跑通的并标 ✅ verified；已有文件则逐条核对完善而非覆盖
related_code:
  - skills/spike-runbook/SKILL.md
---

# spike-runbook：调研仓库、实跑命令后写出 AGENTS.md + CLAUDE.md

`/spike-runbook` 对一个新项目或已有项目调研代码库，**实际跑一遍**「搭环境 / 跑测试 / lint / 类型检查」的命令，
只把跑通的写进仓库根的 `AGENTS.md`，并配一个 `@AGENTS.md` import 它的 `CLAUDE.md`。已有这些文件时完善而非覆盖。
具体流程以 `skills/spike-runbook/SKILL.md` 为准，本文只记定位、取舍和约束。

## 定位：和 `/init` 的区别只在「实跑」

Claude Code 自带的 `/init` 分析代码库后写下**推断**出的命令；推断常错（看到 `pyproject.toml` 就写
`pip install -e .` + `pytest`，结果系统 Python 版本不满足、或项目其实用 uv）。`/spike-runbook` 存在的唯一理由是
**先跑再写**：跑通的命令在小节标题旁标 `✅ verified <日期>`，下游 agent 和 reviewer 一眼知道它不是猜的。
所以 verify 默认就跑、不提供跳过开关，跑之前告诉用户要跑什么。

## 产物：一对文件，写进仓库

- `AGENTS.md`：跨工具约定（Cursor / Codex / Aider 等都读）。
- `CLAUDE.md`：第一行 `@AGENTS.md`，下面可选几行 Claude 专属说明。**Claude Code 只读 `CLAUDE.md`、不直接读 `AGENTS.md`**，
  所以只生成 `AGENTS.md` 等于对 Claude Code 无效。用 import 而不是 symlink（Windows 建 symlink 要特权）。已有内容的
  `CLAUDE.md` 把 import 折进最前面，不覆盖。
- 两者都提交进仓库、团队共享；不写 `~/.claude/`，不碰 `.claude/rules/`、`settings.json`、hooks、auto memory。
- 顶部用 HTML 注释记来源与验证日期：块级 HTML 注释会在注入上下文前被剥掉，不占上下文，又给下次 re-run 留了锚点。
- 保持紧凑：`AGENTS.md` 每个会话全量进上下文，越长遵从度越差；接近约 200 行时提示可拆到 `.claude/rules/`。

## 约束与坑

- **不要从 manifest 直接推 install 命令。** 判断顺序：lockfile → 对应包管理器（`uv.lock`→uv、`poetry.lock`→poetry、
  `pnpm-lock.yaml`→pnpm、`yarn.lock`→yarn、`package-lock.json`→npm……）> CI 配置里实际跑的命令 > README / CONTRIBUTING。
  然后实跑确认。
- **不要用系统解释器硬装。** 系统 Python 常不满足 `requires-python`，`pip install -e .` 会报 `requires a different Python`；
  uv / poetry 会自己选解释器。
- **verify 失败是信息不是终点**：退到下一个候选命令，把死路写进产出的注意事项。需要外部依赖（DB、Redis、secret）才能跑的，
  如实写成前置条件，不声称跑绿。
- **新 / 空项目**没有可验证的东西：如实降级为「记录打算采用的约定、标明尚未验证」。
- **improve 模式逐条核对已有说法**：被事实驳倒的就地改并说明原因；被确认的保留；验证不了但不矛盾的人类知识（发布流程、
  「问某人」）原样保留；引用了不存在的路径 / 脚本的不静默删，先问用户。保留原文件结构、最小化改动、写入前给 diff。
- verify 会在工作树里产生 `node_modules/`、`.venv/` 等；若未被 `.gitignore` 覆盖要提醒用户。

## 未做 / 待定

- monorepo：只写根目录一份，不做按包的 `AGENTS.md` 与就近优先级。
- 保鲜靠手动 re-run；「检测 AGENTS.md 过时」的 hook 未做。
