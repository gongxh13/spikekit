---
name: spike-doc
description: >-
  Write documents that interleave prose with images and video — technical articles,
  blog posts, tutorials/how-tos, design docs, READMEs. This is NOT a new writing engine;
  it builds on your normal writing and adds two things: the judgment of where a visual
  genuinely earns its place, and the mechanics of producing that visual with the
  `spike-screenshot` skill (screenshot a real page/element, render data into a clean
  figure, or record a short demo video) and embedding it correctly for the output format.
  Use this whenever the user wants to "write an article/blog/tutorial/doc with
  screenshots", "document this feature with visuals", "make a how-to with step-by-step
  pictures", "写一篇带图的技术文章 / 配图的文档 / 带演示视频的教程", or otherwise produce a
  rich illustrated document rather than a wall of text — even if they don't name the
  format. Pairs with `spike-screenshot` (which produces the visuals). Distinct from
  `spike-wrap`, which specifically consolidates a finished spike into design docs.
---

# spike-doc: write documents rich with images and video

## What this is (and isn't)

You already write well. This skill doesn't replace that — it adds the part models
routinely get wrong when a doc needs visuals: **deciding where a picture or video
actually helps**, and **actually producing and embedding it** instead of leaving a
"[screenshot here]" stub or, worse, describing in prose something a single image would
have shown instantly.

The visuals come from the `spike-screenshot` skill. Your job here is to orchestrate it
in service of a document: write the text, find the spots where a visual carries
information words can't, generate it, embed it cleanly, and verify it renders.

**Language:** these instructions are in English for convenience — write the document
itself in whatever language the user is working in.

## The core loop

Resist the urge to make images while drafting sentences — it fragments both the writing
and the capturing. Separate the passes:

1. **Align on shape.** Confirm doc type (article / tutorial / design doc / README),
   audience, and **output format** — see "Choosing the format" below. This decides how
   every image and video gets embedded, so settle it first.
2. **Outline**, then **write the prose first.** Get the argument, structure, and flow
   right with words alone. A doc whose text only makes sense *with* the images is a
   weak doc; the images should amplify, not patch.
3. **Visual pass.** Re-read the draft and mark each place a visual genuinely earns its
   place (see next section) with an explicit placeholder, e.g.
   `<!-- FIGURE: directory tree of .aet/ -->` or `<!-- VIDEO: upload flow demo -->`.
   Marking first lets you see the visual rhythm of the whole doc before producing
   anything — and avoids both "wall of text" and "every paragraph has a decorative
   screenshot."
4. **Produce each visual** with `spike-screenshot`, working from real data/pages (see
   "Producing visuals").
5. **Embed** each one correctly for the format (see "Embedding").
6. **Verify.** Preview the rendered doc and check every image/video actually shows,
   is legible, and has no broken path. A doc that references an image that 404s or a
   screenshot of the wrong element is worse than no image.

## When a visual earns its place

The test: **would removing it lose information or cost the reader effort?** If not,
it's decoration — leave it out. Three cases where a visual reliably pays for itself:

- **Evidence — a screenshot of something real.** A result page, a PR/issue, a
  dashboard, actual terminal output, a rendered UI. It proves a claim in a way prose
  can't ("evaluated to 84%" vs a screenshot of the run). Most trustworthy content you
  can put in a doc.
- **Structure — a figure rendered from data.** A directory tree, a comparison matrix,
  an architecture/layer diagram, a section outline. When relationships or hierarchy
  are clearer as a picture than as a bulleted list. (This is `spike-screenshot`'s
  "render HTML/CSS then screenshot" workflow — far cleaner than ASCII art.)
- **Motion — a short video/recording.** A flow or interaction that loses its meaning
  as stills: a UI walkthrough, a live demo, a before/after that animates. If the value
  is "watch it happen," a 5–10s clip beats five screenshots.

Anti-patterns: a screenshot of a code block (paste the code as text — it's
selectable and diff-able); a hero image that decorates but informs nothing; a video
of something that's just as clear as one still.

## Producing visuals (via spike-screenshot)

Map each marked placeholder to one of `spike-screenshot`'s three workflows:

- **Evidence → Workflow A** (screenshot a live page or one element). Probe for the
  right selector, then capture just that region — not the whole noisy page.
- **Structure → Workflow B** (write a small purpose-built HTML/CSS figure, screenshot
  the container). Design the figure for *this* data; there's no fixed template.
- **Motion → Workflow C** (record a short auto-scrolling or scripted video).

Two non-negotiables:
- **Gather real data/pages first.** Read the files, run the commands, open the real
  page. A figure or screenshot must reflect reality — never mock data dressed up as a
  real result, never a fabricated screenshot. The whole value of evidence visuals is
  that they're true.
- **Name and place assets predictably.** Put image/video files where the embed step
  needs them (next section). `spike-screenshot` writes to the current directory —
  move the file if the doc lives elsewhere.

## Choosing the format

| Format | Pick it when | Images | Video |
|---|---|---|---|
| **Markdown** | Posting to a blog/公众号, GitHub/repo docs, a README, anything that lives in a Markdown pipeline. | `![alt](./path.png)` — the PNG must sit where the relative path resolves (usually beside the `.md` or in an adjacent `images/`/`assets/` folder). | Link an `.mp4`, or embed a short `.gif` inline (`![demo](./demo.gif)`) — GIF is the only thing that reliably *plays inline* in most Markdown renderers. Note GitHub plays uploaded mp4 but not local `<video>` tags. |
| **Self-contained HTML** | A single file someone opens offline / you hand them directly; rich interactive pages. | base64 data URI, **never** an external `src` — otherwise the file breaks when moved. Use `scripts/embed_inline.py`. | `<video controls>` with a base64 source (also via `embed_inline.py`). Video base64 bloats the file — for anything beyond a few seconds prefer a short GIF, or reconsider self-containment. |

If the user hasn't said, propose based on where the doc will live (blog/repo → Markdown;
"send me one file" / offline → HTML) and confirm.

## Embedding

**Markdown** — keep paths relative and assets beside the doc:

```markdown
![.aet/ 目录结构](./images/project-tree.png)

[▶ 上传流程演示 (mp4)](./videos/upload-demo.mp4)
```

**Self-contained HTML** — inline everything with the helper:

```bash
python scripts/embed_inline.py images/project-tree.png "项目目录结构" --width 720
python scripts/embed_inline.py videos/upload-demo.mp4 "上传流程演示"
```

It prints an `<img …>` or `<video …>` tag with the file baked in as base64; drop that
into the HTML. It warns when an asset is large enough to bloat the page.

Always write real alt text / captions — it's accessibility, it's SEO, and it tells the
reader what to look for in the image.

## Verify before declaring done

Open the rendered result (preview the Markdown, or open the HTML in a browser) and walk
every visual: does it show? is the text in it legible at the display size? is it the
*right* capture (correct element, real data)? For Markdown, confirm no relative path is
broken. For HTML, confirm it still renders when the file is moved (that's the whole
point of base64). Reporting "done" on a doc with a broken or wrong image wastes the
user's review pass — check first.

## Files

- `scripts/embed_inline.py` — turn an image/video file into an inline base64
  `<img>`/`<video>` tag for self-contained HTML docs.
