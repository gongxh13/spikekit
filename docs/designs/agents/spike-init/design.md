---
topic: spike-init
title: "spike-init — 生成/完善 AGENTS.md + 各开发阶段固定上下文（命令实跑验证过）"
status: validated
created: 2026-05-13
spike_dir: .spike/project-context-skill/
related_code: []
human_summary: ../../humans/spike-init/index.html
---

# spike-init — 生成/完善 AGENTS.md + 各开发阶段固定上下文（命令实跑验证过）

## What this is

spikekit 的第三个 skill：`/spike-init`。对一个新项目或已有项目，调研代码库、**实际跑一遍**「怎么搭环境 / 怎么跑测试 / lint / 类型检查」这些命令，然后产出一对规范的 agent 项目上下文文件 —— `AGENTS.md`（跨工具通用）+ 一个 `@AGENTS.md` import 它的 `CLAUDE.md`（Claude Code 用）。已有这些文件就**完善而非覆盖**。spike 在两个真实公开项目（`tj/commander.js`、`pallets/click`）上验证了「research → verify 实跑 → 写文件」这条流程能落地，且 verify 这一步确实能解掉「模型找不到对的环境、不知道怎么跑测试」的痛点；「improve 不覆盖」的 reconcile 逻辑也用一个造的场景走通了。结论：可以实现（写 `skills/spike-init/SKILL.md`）。

## Goal & context

**背景**：spikekit 是把「figuring out what to build and how」做成 Claude Code skills 的项目，已有 `/spike`（对话对齐 + 真实实验去风险）和 `/spike-wrap`（沉淀成设计文档）。README 里写了「planned: a project-context skill」—— 就是这个。

**它解决什么**：agent 进一个项目干活，最先卡的就是「环境怎么搭、测试怎么跑」。Claude Code 自带的 `/init` 会分析代码库写一份起步的 `CLAUDE.md`，但它是「分析完写下推断的命令」—— 推断可能错（典型：看到 `pyproject.toml` 就 `pip install -e .` + `pytest`，结果系统 Python 版本不对、或者项目其实用 uv/poetry，直接翻车）。**`/spike-init` 的差异点 = 把要推荐的命令先实际跑一遍，只写跑通的，跑通的打 `✅ verified <date>` 标记**，下游 agent 和人类 reviewer 一眼知道可信、不是猜的。

**Scope（v1）**：
- ✅ 在 — 单仓库；「生成」和「完善」两个模式；verify pass 实跑 install + 测试（+ 力所能及的 lint/类型检查）；产出 `AGENTS.md` + `CLAUDE.md` 一对；新/空项目分支（无东西可 verify 就如实降级）。
- ❌ 不在 v1 —— monorepo / workspaces（per-package AGENTS.md、就近优先级）；生成 `.claude/rules/*` 或 `settings.json`/hooks（设计文档里提一句「下一步」即可）；自动保鲜（靠 provenance 注释 + `✅ verified <date>` + 手动 re-run）。

## Alignment conclusions

（spike 期间与用户敲定的；每条独立成立）

- **产物是一对文件**：`AGENTS.md`（跨工具约定，Cursor/Codex/Aider/VS Code 等都认）+ 仓库根的 `CLAUDE.md`，后者第一行 `@AGENTS.md` import 前者、下面可选追加几行 Claude 专属内容。**不能只生成 `AGENTS.md`** —— Claude Code 不直接读 `AGENTS.md`，只读 `CLAUDE.md`。
- **跟 `/init` 的本质差异 = verify**：`/init` 分析后写下推断的命令；`/spike-init` 把命令实跑一遍验证后才写，并标记 `✅ verified <date>`。这是这个 skill 存在的理由，必须体现在 SKILL.md 的 description 和流程里。
- **写进项目级、提交进版本库、团队共享的文件**（仓库根的 `AGENTS.md`/`CLAUDE.md`），不是用户机器上的 `~/.claude/`。「各开发阶段的固定上下文」是项目级的东西。
- **「完善」模式不覆盖**：已有 `AGENTS.md`/`CLAUDE.md`（或 `.cursorrules` 等）就把里面每条具体说法当成「待验证的假设」，re-run research+verify 后逐条 reconcile（见下），保留原文件结构、最小化 churn、写之前给 diff。
- **验证对象**：拉 2 个公开 sample 项目（一个 Node、一个 Python），clone 进 spike scratch 跑实验。
- **skill 名 = `/spike-init`**：跟 spikekit 家族 `spike` / `spike-wrap` 一致，也呼应 Claude Code 的 `/init`；它的 verify 步骤实跑命令，算是「spike 精神」（用真实实验确认事实）。
- **verify 默认就跑、不问、无逃生口**：直接跑 `npm ci` + `npm test`（或检测到的对应包管理器/测试命令）；跑之前先告诉用户「我要跑 X」，但不提供 `--no-verify`。这是 skill 的核心，不能默认关掉。
- **monorepo v1 不做**：先做单仓库的 root `AGENTS.md`/`CLAUDE.md`；per-package 列为 open question。
- **Success criteria（用户确认）**：在一个真实项目里跑 `/spike-init` 后 ——
  (a) 产出 `AGENTS.md` + 一个 import 它的 `CLAUDE.md`；
  (b) 里面「怎么搭环境 / 怎么跑测试」步骤是被实际跑过验证的；
  (c) 已有 `AGENTS.md` 的项目是被完善而非覆盖；
  (d) 最终检验 = 一个全新 agent 读完能第一次就把环境搭起来、把测试跑起来，不瞎试。

## 背景知识 —— Claude Code 项目上下文怎么组织（查官方文档得到）

实现时需要知道的事实（来自 docs.claude.com / code.claude.com 上 memory、settings 那几页 + agents.md）：

- **Claude Code 只读 `CLAUDE.md`，不直接读 `AGENTS.md`**。官方推荐：仓库已有 `AGENTS.md` 就建 `CLAUDE.md` 用 `@AGENTS.md` import 它（下面可加 Claude 专属指令）；或 `ln -s AGENTS.md CLAUDE.md`（但 Windows 上建 symlink 要管理员权限/开发者模式，所以 **import 更可移植，优先用 import**）。`CLAUDE.md` 可在 `./CLAUDE.md` 或 `./.claude/CLAUDE.md`。
- **`/init`**（Claude Code 自带）会分析代码库生成起步的 `CLAUDE.md`（含 build/test 命令 + 约定），已有则建议改进不覆盖，会读 `AGENTS.md`/`.cursorrules`/`.windsurfrules` 并吸收。`CLAUDE_CODE_NEW_INIT=1` 开启交互式多阶段流程（问要不要建 CLAUDE.md/skills/hooks、用 subagent 探索、补问、给可审阅的提案）。→ `/spike-init` 的卖点必须是「verify」，否则就是重复 `/init`。
- **`CLAUDE.md` 写法约定**：目标单文件 < ~200 行（启动时全量进 context，越长越影响遵从度）；指令要**具体可验证**（"用 2 空格缩进" / "提交前跑 `npm test`" / "API handlers 在 `src/api/handlers/`" —— 而不是 "格式化好" / "测一下" / "保持整洁"）；用 markdown 标题+bullet 分组；矛盾的指令会被随机挑一个，要保持一致。`@path` import 可拆文件做组织，但 imported 文件启动时仍全量加载，**不省 context**。
- **`.claude/rules/*.md`**：大项目把指令拆成多个 topic 文件；可加 `paths:` YAML frontmatter 做 path-scoped（只在 agent 读匹配文件时才进 context）。无 `paths` 的 rule 跟 `.claude/CLAUDE.md` 同优先级、启动加载。→ v1 不生成，但 `AGENTS.md` 眼看要超 ~200 行时在产出里**提一句**「下一步可以拆到 `.claude/rules/`」。
- **记忆层级**（优先级低→高）：user `~/.claude/CLAUDE.md` → project `./CLAUDE.md` 或 `./.claude/CLAUDE.md` → managed policy。还有 `CLAUDE.local.md`（个人、应 gitignore）。
- **`settings.json`**（user/project/local/managed 四层）管的是**技术强制**：permissions、env、hooks、model 等。`CLAUDE.md`/`AGENTS.md` 管的是**给模型看的上下文/指令**（非强制）。「每次 commit 前必跑 lint」这种必须在固定生命周期点执行的，应写 **hook**（在 `settings.json` 里），不是写进 `CLAUDE.md`。→ v1 不碰 settings/hooks。
- **Auto memory**（`~/.claude/projects/<project>/memory/`，Claude 自己写的 learnings）是另一回事，跟这个 skill 不重叠 —— 别动它。
- **HTML 注释**：`CLAUDE.md` 里块级 HTML 注释（`<!-- ... -->`，代码块外）在注入 context 前会被剥掉 —— 所以可以**免费**用顶部 HTML 注释记 provenance（"本文件由 spike-init 于 <date> 生成/验证，下列命令已实跑"）。
- **`agents.md` 跨工具约定**：自由 markdown，无强制字段；常见段 = 项目概览 / build & test 命令 / 代码风格 / 测试说明 / 安全注意；「任何你会告诉新同事的东西都该写这」；monorepo 里子目录可放各自 `AGENTS.md`、就近生效。

## What we tried — decision log

- **查文档定方向**：原以为产物就是「一份 AGENTS.md」。查 Claude Code memory 文档发现 **CC 不直接读 AGENTS.md** → 改成「`AGENTS.md` + `@AGENTS.md` 的 `CLAUDE.md`」一对。又发现 `/init` 已经做了一半的事 → 必须想清楚差异点 → 落在「verify（实跑命令）」。这两点跟用户确认后写进 Alignment。
- **拉两个真实项目验证 `tj/commander.js`（Node/jest）**：research 信号 = `package-lock.json`（→ npm）+ `package.json` `engines.node>=20` + `.github/workflows/tests.yml`（CI 跑 node 20/22/24，`actions/setup-node` 带 `cache:'npm'`）+ `package.json` 的 `scripts`。verify 实跑：`npm ci`（13s，exit 0）→ `npm test`（脚本是 `jest && npm run check:type:ts`，**1367 passed**，exit 0）。→ 确认「搭环境=`npm ci`；跑测试=`npm test`；lint/format/类型全检=`npm run check`；自动修=`npm run fix`；含 ESM 的全量=`npm run test-all`」全部实跑过。产物样例见 `assets/sample-AGENTS-commander.md`。
- **`pallets/click`（Python/uv+tox）—— 把痛点演示到位**：
  - ❌ **naive 路子翻车**：模仿「看到 `pyproject.toml` 就 `pip install -e .` + `pytest`」→ 用系统 Python（这台机 anaconda 3.9.13）→ `ERROR: Package 'click' requires a different Python: 3.9.13 not in '>=3.10'`；`pytest` 直接「8 errors during collection」。这正是「模型找不到对的环境」的典型现场 —— 如果 `/spike-init` 不实跑、只「分析后写下 `pip install -e .` + `pytest`」，写出来的就是这套错命令。
  - ✅ **对的路子**：research 信号 = `uv.lock` 在（→ uv）+ `pyproject.toml` 里 `[dependency-groups]`/`[tool.tox]`/`[tool.uv]` + `.github/workflows/tests.yaml`（用 `astral-sh/setup-uv` + `uv run --locked --no-default-groups --group dev tox run`）+ 有 `.devcontainer/`。verify 实跑：`uv sync --locked`（21s，自动建 `.venv` 用 Python **3.12.11**）→ `uv run pytest`（**1493 passed / 24 skipped**，exit 0）。→ 确认「搭环境=`uv sync --locked`；跑测试=`uv run pytest`（或 `uv run tox run -e py3.13` 复现 CI 矩阵）；lint/format=`uv run ruff check`/`uv run ruff format`；类型=`uv run tox run -e typing`（mypy+pyright）；stress 测试默认 deselect」。产物样例见 `assets/sample-AGENTS-click.md` + `sample-CLAUDE-click.md`。
  - **教训（→ 写进 skill）**：判断「怎么搭环境」时**不要从「看到 manifest」直接推 install 命令**。优先级：**lockfile → 对应包管理器**（Python: `uv.lock`→uv / `poetry.lock`→poetry / `pdm.lock`→pdm / `Pipfile.lock`→pipenv / 否则 pip+venv；Node: `pnpm-lock.yaml`→pnpm / `yarn.lock`→yarn / `bun.lockb`→bun / `package-lock.json`→npm）> **CI 配置里实际跑的命令** > README/CONTRIBUTING。然后**实跑一遍**确认。
- **「improve 不覆盖」分支**：两个真实项目都没有现成 `AGENTS.md`/`CLAUDE.md`，所以另造场景：往 commander 里塞一份故意写错的 `AGENTS-before.md`（"Node 14+"、"`yarn install`"、"`yarn test`"、引用一个根本不存在的 `scripts/build.sh`、含一句不可验证的 "release process 在 wiki"），走 reconcile：
  - "Node 14+" → 与 `engines.node>=20` 矛盾 → **改成 Node ≥20**；
  - "`yarn install`" / "`yarn test`" → 与「lockfile 是 `package-lock.json`、CI 缓存 npm」矛盾 → **改成 `npm ci` / `npm test`**，并补上命令实际跑什么；
  - 缺 lint/format/类型/ESM-test 段 → **补全**；
  - 引用 `scripts/build.sh`（仓库里根本没有 `scripts/` 目录）→ **不静默删，向用户提出**（可能是删了文件没更文档，也可能是没 check in 的私有东西）；
  - "release process 在 wiki" → 不可验证但不矛盾、且本就不是 agent 该碰的 → **原样保留**；
  - "Use the existing code style. Don't break things." → 太模糊 → **保留人的意图、用 `npm run check`/prettier/eslint 的具体事实增强它**，不删；
  - 保留原文件的标题结构、最小化 churn。
  产出 `AGENTS-after.md`。规则见下「The approach → reconcile」，对照样例见 `assets/improve-example-before.md` / `assets/improve-example-after.md`。

## The approach

`/spike-init` 是一个 Claude Code skill：`skills/spike-init/SKILL.md`（spikekit 仓库内），symlink 进 `~/.claude/skills/`（跟 `spike`/`spike-wrap` 同样的安装方式，README 里加一行）。

**Triggers / description 应覆盖**：「set up AGENTS.md」「给这个项目生成 agent 上下文」「这个 repo 没有 CLAUDE.md，建一个」「AGENTS.md 过时了，修一下」「/spike-init」—— 并在 description 里明确「跟 `/init` 的区别是命令会实跑验证」，方便判断何时用哪个。

**语言**：跟 `spike`/`spike-wrap` 一致 —— SKILL.md 指令用英文写，但跟用户对话、产出的 `AGENTS.md`/`CLAUDE.md` 文字用用户的工作语言。

### 控制流（7 步）

**1. 决定模式：generate 还是 improve**
找 `AGENTS.md`、`CLAUDE.md`、`.claude/CLAUDE.md`，也看 `.cursorrules` / `.windsurfrules` / `.github/copilot-instructions.md`。都没有 → **generate** 模式。有任意一个 → **improve** 模式（读进来，里面每条具体说法当成待验证假设，见第 4 步）。

**2. Research pass（只读、快；可以用 subagent 跑以省主上下文）**
收集能定死「环境 + 工作流」的信号，大致按优先级：
- **从 lockfile 定语言/运行时 & 包管理器**（最高信号）：
  - Node：`pnpm-lock.yaml`→pnpm · `yarn.lock`→yarn · `bun.lockb`→bun · `package-lock.json`→npm
  - Python：`uv.lock`→uv · `poetry.lock`→poetry · `pdm.lock`→pdm · `Pipfile.lock`→pipenv · 否则 `pyproject.toml`/`requirements*.txt`→pip+venv
  - 其它：`Cargo.toml`/`Cargo.lock`→cargo · `go.mod`→go · `Gemfile`/`Gemfile.lock`→bundler · `pom.xml`→maven · `build.gradle(.kts)`→gradle · `composer.lock`→composer · 等
- **版本钉子**：`.nvmrc`/`.node-version`/`package.json` `engines`、`pyproject.toml` `requires-python`/`.python-version`、`rust-toolchain(.toml)` 等
- **CI 配置**（`.github/workflows/*`、`.gitlab-ci.yml`、`.circleci/config.yml` 等）：维护者**实际信任**的 setup + test + lint 命令 —— 常常是单一最好的来源
- **任务/脚本定义**：`package.json` `scripts`、`Makefile`、`justfile`、`tox.ini`/`pyproject.toml [tool.tox]`、`noxfile.py`、`composer.json` `scripts`、`Taskfile.yml`
- **dev container / nix**：`.devcontainer/`、`flake.nix`、`shell.nix`、`.tool-versions`（asdf/mise）
- **已有人写的文档**：`README`、`CONTRIBUTING`、`docs/` —— 找约定和「how to develop」段
- **仓库形状**：顶层目录、源码 vs 测试在哪、是不是 monorepo（workspaces / `packages/*`）

**3. Verify pass（差异化的核心 —— 真的去跑）**
尽量别污染仓库已跟踪的文件（install 产物如 `node_modules/`、`.venv/` 通常已在 `.gitignore`；如果没有，警告用户）。**默认就跑，不提供 `--no-verify`；跑之前先告诉用户「我要跑 X 来验证」。**
1. **搭环境**：跑检测到的包管理器对应的 install 命令（`npm ci` / `pnpm install --frozen-lockfile` / `yarn install --frozen-lockfile` / `uv sync --locked` / `poetry install` / `cargo fetch` / `go mod download` / …）。记 exit code + 输出尾巴。失败 → 退而求其次试下一个候选（如回退到 `npm install`；Python 无 lockfile 时 `python -m venv .venv && pip install -e ".[dev]"`），**并把这条死路记进产出的「known gotchas」或 reconcile 说明**。
2. **跑测试**：跑检测到的测试命令（`npm test` / `uv run pytest` / `pytest` / `cargo test` / `go test ./...` / `tox` / `make test` / …）。确认它**真的执行了套件**（不是 "no tests found"）。记一行结果（如 "1493 passed, 24 skipped"）。
3. **lint / format / 类型检查**：力所能及就也跑一下（`npm run check`、`ruff check`、`mypy`、`tsc --noEmit`、…）。不如测试关键，但确认了更好。
4. **需要外部依赖才能跑的**（DB、Redis、某个 secret）：**不要伪造** —— 在产出里写「测试需要本地 Postgres，见 X」当成已知前置条件，而不是声称跑绿了。
5. **新/空项目**（没测试套件、没真正的 build）：没东西可 verify —— **如实说**。文件就只记**打算采用的**约定（标成「尚未验证」）+ 用户告诉你的东西；这个分支降级成「≈`/init` 做的事 + `AGENTS.md`/`CLAUDE.md` 配对」。可以 offer 帮用户搭一个最小测试 target，但别强推。

**4. Reconcile（仅 improve 模式）**
对已有文件里的每条具体说法：
- **被 verify 出的事实驳倒** → 就地改正，并告诉用户改了什么、为什么（"`yarn test` → `npm test`：lockfile 是 `package-lock.json`"）。
- **被确认** → 保留（可顺手收紧措辞）。
- **不可验证但不矛盾**（release 流程、"问 Bob"、业务规则）→ **原样不动** —— agent 验不了的人类知识仍然有价值。
- **引用了不存在的路径/脚本**（如 `scripts/build.sh` 但没 `scripts/` 目录）→ **不静默删，向用户提出**："文件提到 `scripts/build.sh` 但仓库里没有 `scripts/` 目录 —— 删掉这行？还是这是我看不到的东西？"
- 保留原文件的结构/标题，最小化 churn，让 diff 好审。

**5. 只问 gap**
research + verify 之后，通常该有的都有了。只问（能提建议就提）：验不了的东西（需要哪些 service/secret）、哪儿都没写的约定、scope（monorepo：root 一份还是 per-package？v1 默认 root）、以及任何矛盾点。不要审问 —— 一个短列表、每项预填你的最佳猜测。

**6. 写这一对文件**
- **`AGENTS.md`**（仓库根）。分节大致：*Project layout · Environment setup · Running tests · Lint & format · Type checking · Conventions · Build & misc*。保持紧凑（< ~200 行的指导适用 —— 它通过 import 每次 session 都进 context）。指令要**具体可验证**（"`uv run pytest`" 而不是 "跑测试"）。**verify 过的命令打 `✅ verified <YYYY-MM-DD>` 标记**（放在小节标题旁，如 `## Running tests  ✅ verified 2026-05-13`）。眼看要超 ~200 行就在文件里提一句「下一步可拆 `.claude/rules/`」。
- **`CLAUDE.md`**（仓库根）：第一行 `@AGENTS.md`，下面可选一小段 "Claude Code notes"（如「项目上下文都在 `AGENTS.md`，改那边以保持跨工具同步」「打 `✅ verified` 的命令是实跑过的，优先信它而不是猜」）。如果仓库**已有**有内容的 `CLAUDE.md` —— 把 `@AGENTS.md` import **折进去**（放最前面），不要 clobber 它现有内容。（symlink 是替代方案，但 import 更可移植 —— Windows —— 优先 import。）
- **顶部 HTML 注释记 provenance**：`<!-- Generated by spike-init on <date>. Commands under "Environment setup"/"Running tests"/... were executed and verified on this date. Re-run /spike-init to refresh. -->`（HTML 注释会被 CC 从 context 里剥掉，所以是免费的，还给下次 re-run 一个锚点）。
- v1 **不碰** `.claude/rules/*` 和 `settings.json`/hooks，但如果项目大到 `AGENTS.md` 会超 ~200 行，就在产出里**提一句**拆 `.claude/rules/` 是下一步。

**7. 给用户看 & 确认后才写**
展示拟写的文件（improve 模式还要展示 diff + 改正项列表附原因）。确认后才落盘。完成 —— 一个全新 agent 现在读 `CLAUDE.md`/`AGENTS.md` 就能第一次把项目环境搭起来、把测试跑起来。

### 要碰的文件 / 产物形态

- 新建 `skills/spike-init/SKILL.md`（frontmatter `name: spike-init` + `description:` 强调「实跑验证、产出 AGENTS.md+CLAUDE.md 一对、改而非覆盖」；body 是上面 7 步流程，写法/语气参照现有 `skills/spike/SKILL.md`、`skills/spike-wrap/SKILL.md`）。
- 更新 `README.md`：把「(planned) a project-context skill」那段改成已落地的 `/spike-init`；安装 snippet 加一行 `ln -s "$PWD/skills/spike-init" ~/.claude/skills/spike-init`；Layout 里 `skills/` 下加 `spike-init/`；Status 更新。
- 产出形态参考样例（在本设计的 `assets/`）：`sample-AGENTS-click.md`、`sample-CLAUDE-click.md`、`sample-AGENTS-commander.md`（generate 模式的输出长相）；`improve-example-before.md` → `improve-example-after.md`（improve 模式的 reconcile 长相）。

### 实现时容易踩的点（spike 里学到的）

- **别从 manifest 直接推 install 命令** —— 一定先看 lockfile 和 CI。`pyproject.toml` 存在 ≠ 用 pip；`package.json` 存在 ≠ 用 npm。
- **别用系统解释器硬装** —— Python 项目尤其：系统 Python 版本常常不满足 `requires-python`（spike 这台机是 anaconda 3.9，click 要 ≥3.10）。uv/poetry 这类工具会自己挑/装合适的解释器；`pip install -e .` 直怼系统 Python 会 `requires a different Python` 翻车。把这写进 `AGENTS.md` 的 Environment setup 段（"用 uv，别 bare `pip install`"）。
- **verify 失败不是终点是信息** —— 退而求其次试别的，把死路记下来（这正是「decision trail」对下游最有用的部分）。如果实在跑不绿（缺 service/secret），如实写前置条件，别假装绿。
- **improve 模式：不可验证 ≠ 该删** —— 人写的、agent 验不了的东西（release 流程、业务上下文、"问某人"）保留。只对「被事实驳倒」和「引用不存在的东西」动手，后者还要先问。
- **CLAUDE.md 已存在就折进 import，别覆盖**。
- **保持紧凑** —— `AGENTS.md` 越长遵从度越差且烧 context；该拆就提示拆 `.claude/rules/`。

## Open questions & risks

- **monorepo / workspaces**：v1 只做 root `AGENTS.md`/`CLAUDE.md`。per-package `AGENTS.md`、就近优先级、verify 要不要逐包跑 —— 推迟。
- **verify 需要外部依赖的项目**：测试要 DB/Redis/secret 时，skill 必须能识别「拿不到干净的 run」并把前置条件写成已知要求，而不是声称跑绿。要在 SKILL.md 里把这条说清楚，否则模型会倾向于「装作跑过了」。
- **verify 改动工作树**：`node_modules/`、`.venv/`、可能的 lockfile 漂移 —— 如果这些没在 `.gitignore` 里，skill 应警告用户（或在临时副本里跑？但那样 verify 的就不完全是用户的真实环境了，权衡）。
- **保鲜**：provenance HTML 注释 + `✅ verified <date>` 只是起点，re-run 是手动的。一个「检测 `AGENTS.md` 过时」的 hook 是可能的后续 —— 但 hooks 这轮不做。
- **跟 `/init` / `CLAUDE_CODE_NEW_INIT=1` 的重叠**：把 `/spike-init` 定位成「会实跑验证的那个」，并在 SKILL.md description 里写明，免得用户/模型搞混何时用哪个。
- **`.claude/rules/` 和 settings/hooks**：v1 不生成；如果用户明确想要、或 `AGENTS.md` 超 ~200 行，下一版再说。

## Implementation plan

1. **建 `skills/spike-init/SKILL.md`** —— frontmatter（`name: spike-init`；`description:` 写清触发场景 + 「实跑验证、产 AGENTS.md+CLAUDE.md 一对、改不覆盖、跟 /init 的区别」）；body 按上面「控制流（7 步）」写，语气/结构对齐现有两个 SKILL.md。把「背景知识」里的 Claude Code 事实（CC 不读 AGENTS.md、用 `@AGENTS.md` import、<200 行、`✅ verified` 标记、HTML 注释免费、不碰 auto memory/settings）和「实现时容易踩的点」编进流程文字里。
2. **写「research pass」那节** —— 列出 lockfile→包管理器映射表（Node/Python/Rust/Go/Ruby/Java/PHP…）、版本钉子文件清单、CI/任务定义/devcontainer 的检查清单。
3. **写「verify pass」那节** —— 强调默认就跑、warn-then-run、无 opt-out；列出各栈的 install/test/lint 候选命令；写清「失败就 fallback 并记录」「需要 service/secret 就如实写前置条件」「新/空项目就如实降级」。
4. **写「reconcile（improve 模式）」那节** —— 四类处置（驳倒→改、确认→留、不可验证不矛盾→留、引用不存在→问）+ 保留结构/最小 churn/先给 diff。
5. **写「写这一对文件」那节** —— `AGENTS.md` 分节模板 + `✅ verified <date>` 标记位置 + provenance HTML 注释模板；`CLAUDE.md` 的 `@AGENTS.md` 起头 + 已有则折进去；< 200 行就提示拆 `.claude/rules/`。
6. **写「给用户看 & 确认」那节** —— generate 模式给预览；improve 模式给 diff + 改正项列表附原因；确认后才写。
7. **更新 `README.md`** —— 「(planned) a project-context skill」→ 已落地的 `/spike-init`（含一句话说明它的差异点）；安装 snippet 加 `ln -s "$PWD/skills/spike-init" ~/.claude/skills/spike-init`；Layout 加 `skills/spike-init/`；Status 段更新（三个 skill 都 ready）。
8. **对照样例自检** —— 用 `assets/sample-AGENTS-*.md` / `improve-example-*.md` 核对：照着新写的 SKILL.md 流程跑，产出的形态是不是大致这样（分节、`✅ verified` 标记、CLAUDE.md 配对、improve 的处置）。
9. **（可选，验证文档够不够好）** 拿一个真实的小项目（或重新 clone 一个）让一个全新 agent 照新 SKILL.md 跑一遍 `/spike-init`，看是否满足 success criteria (a)–(d)。
