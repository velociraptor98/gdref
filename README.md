# gdref

A Rosetta stone for developers moving between **Unity 6** and **Godot 4**, plus
a page of Godot recipes for the things every project needs.

No database, no backend. Content lives in the repo, the build produces static
HTML, and search runs client-side against a Pagefind index. Git is the database;
corrections arrive as pull requests.

## Quick start

```sh
npm install
npm run ingest        # fetch the Godot API dump + build the Unity symbol index
npm run build         # lint content, astro build, then pagefind indexes dist/
npm run preview       # serve dist/ — search only works here, not in dev
npm run lint:content  # cross-reference check on its own
```

`npm run dev` is fine for authoring content, but the search page will be empty:
Pagefind indexes the *built* site.

## Design

Carbonfox — the IBM Carbon-derived dark scheme. It is **single-theme by
intent**: there is no light counterpart, so every colour is painted explicitly
and there are no `prefers-color-scheme` blocks.

All tokens live at the top of `src/styles/global.css`:

| | |
| --- | --- |
| Ground / surface / text | `#161616` / `#252525` / `#f2f4f8` |
| Accent (Godot, links, numbers) | `#78a9ff` + a 100–900 ramp |
| Accent 2 (fidelity badges) | `#ee5396` + ramp |
| Syntax | keyword `#be95ff`, ident `#33b1ff`, comment `#93949a` |
| Type | Archivo 800 headings at `-0.03em`, Inter body |
| Shape | **no border-radius**; 2px rules for structure, 1px for row separators |

Two conventions worth keeping when adding pages:

- **The left rule on a code block identifies the engine** — neutral `--n-600`
  for Unity, `--accent` for Godot. `BindingPanel` sets this automatically.
- **`.lbl`** is the uppercase Archivo micro-label used for every section head,
  breadcrumb and engine caption. Reach for it rather than styling a heading down.

Syntax highlighting goes through Shiki's `css-variables` theme, so the
`--astro-code-*` variables in `global.css` are the single source of truth —
changing a syntax colour there updates every code block. The variable names must
match what Shiki emits exactly; there is no fallback if one is misspelled.

## Deploying

Static output, no server. Build `npm run build`, publish `dist`.

| Setting | Value |
| --- | --- |
| Build command | `npm run build` |
| Publish directory | `dist` |
| Node version | 20.11+ (`.nvmrc` pins 22; `engines` enforces the floor) |
| Env var | `SITE_URL` — only when deploying somewhere other than the default |

Live at **https://gdref.netlify.app**, which is the origin `astro.config.mjs`
falls back to. It drives `<link rel="canonical">`, Open Graph URLs and the
sitemap, so if you move to a custom domain, set `SITE_URL` in the Netlify build
environment and redeploy — a canonical pointing at the wrong host tells search
engines to index that host instead of this one.

### The one that breaks silently

Pagefind's index uses extensions no host recognises — `.pf_fragment`,
`.pf_index`, `.pf_meta`, and a WASM binary deliberately named `*.pagefind`. A
host that rewrites, minifies or 404s unknown extensions breaks search with **no
error**: the box renders, typing returns nothing, the console stays clean.

After the first deploy, load `/search/` and search something. If results are
empty, check the network tab for a 404 under `/pagefind/`.

`public/_headers` handles this for Netlify and Cloudflare Pages. Other hosts
need their own equivalent.

### Per-host notes

- **Cloudflare Pages / Netlify** — works as-is. `_headers` is read automatically.
- **Vercel** — needs `"trailingSlash": true` in `vercel.json` to match the Astro
  config, otherwise every URL redirects once. `_headers` is ignored; use
  `headers` in `vercel.json`.
- **GitHub Pages** — if you deploy to `<user>.github.io/gdref/` rather than a
  custom domain, set `base: '/gdref/'` in `astro.config.mjs`. Every internal
  link here is root-absolute (`/concepts/`) and will 404 without it. `_headers`
  is ignored; Pages serves unknown extensions fine, so search still works.

### Build-time gotchas already handled

- **npm 11+ blocks install scripts.** `esbuild` and `sharp` need theirs, and the
  approvals are committed in `package.json` under `allowScripts`, so CI works
  without interaction. `fsevents` is left unapproved on purpose — macOS-only dev
  file-watching, never installed on Linux.
- **Platform binaries.** `pagefind`, `esbuild` and `sharp` ship per-platform
  optional deps. The lockfile carries the Linux arm64/x64 variants, so `npm ci`
  resolves on CI even though it was generated on macOS.
- **No client JS.** The 616 KB Godot API index is build-time only and never
  reaches the browser; verify with `find dist -name '*.js' -not -path '*/pagefind/*'`.

## Layout

```
src/
  content.config.ts        Zod schemas — and where the licensing invariant is enforced
  content/
    concepts/*.md          Unity <-> Godot comparisons (the Rosetta layer)
    recipes/*.md           Godot-only how-tos, all rendered onto /recipes/
    legacy/unity.json      Legacy Unity symbols as searchable redirect stubs
  data/
    godot/api-index.json   Generated. Names only, for validation — not published.
    unity/6.json           Generated. Metadata only.
  lib/                     Data access + inline-markdown helper
  pages/
    concepts/[id].astro    Side-by-side concept pages
    recipes/index.astro    One page, grouped and anchored
    legacy/[id].astro      Thin "this was replaced by" stubs
    search.astro           Pagefind UI
scripts/
  ingest-godot.mjs         extension_api.json -> name index for validation
  ingest-unity.mjs         symbol index -> src/data/unity/
  lint-content.mjs         cross-reference + Godot API validation
SCOPE.md                   What is in scope, what is not, and why
```

## Why the Godot API is still ingested

There is no API browser here — docs.godotengine.org does that better, and
mirroring 952 class pages added pages without adding value.

What the dump is kept for is **validating our own work**. `npm run ingest:godot`
emits a name-only index (~600 KB, no signatures, no prose) and the linter uses it
to check that every Godot symbol cited in a concept, and every class and
`Class.MEMBER` reference in a recipe, actually exists in Godot 4.4.

It is committed so builds are reproducible offline and CI needs no Godot binary.
Re-run `npm run ingest` when bumping an engine version and review the diff —
members that disappear are exactly the content that needs updating.

The check is deliberately limited to unambiguous forms. `cooldown.is_stopped()`
on a local variable is not checked, because resolving that needs real type
inference; `Timer.is_stopped` and `extends Timer` are.

## Content rules the build enforces

These are not conventions — they fail `npm run build`. See `SCOPE.md` for why.

| Rule | Error surfaces as |
| --- | --- |
| Unity bindings can never claim `license: full` | `bindings.N.license: unity bindings are always "link-only"` |
| Unity bindings must carry a `docsUrl` | `bindings.N.docsUrl: unity prose cannot be mirrored…` |
| `mappingKind: none` requires a `gap` | `gap: mappingKind "none" requires 'gap'` |
| Only `mental-model` concepts may omit bindings | `bindings: Only mental-model concepts may omit bindings` |

`npm run lint:content` (also part of `npm run build`) additionally catches what
Zod cannot see across files:

- a `related` id or in-body `/concepts/...` link pointing at a concept that does
  not exist — these vanish silently, since the templates use `.filter(Boolean)`
- a legacy stub whose `replacedBy` concept is missing, or a duplicate stub id
- a legacy stub whose note admits the API is *not* deprecated — it would render
  a "Legacy" badge on current API. Cover those in a concept instead.
- a Godot `symbol` on a concept binding that does not exist in the engine
- an unknown Godot class, or a bad `Class.MEMBER`, in recipe GDScript

## What counts as legacy

The `legacy/` collection is for Unity APIs that are **deprecated or removed**,
so a reader with old code on screen finds a pointer to the modern concept. An
API that is merely *different in Godot* is not legacy — it belongs in a concept
binding. `PlayerPrefs`, `DontDestroyOnLoad` and `OnDrawGizmos` all failed this
test during authoring and were moved out; the linter now enforces it.

## Adding a recipe

Drop a Markdown file in `src/content/recipes/`. Frontmatter is `title`, `group`
(one of the 11 in `RECIPE_GROUPS`), `summary` — phrased the way someone would
search for the problem — and optionally `order` and `related` concept ids. The
body is the recipe: a `gdscript` fence and a short note on the part that bites.

They all render onto `/recipes/`, sorted by `order` then title.

Concept or recipe? If the page explains a *difference between engines*, it is a
concept. If it hands over *code for a task*, it is a recipe.

## Adding a concept

Drop a Markdown file in `src/content/concepts/`. The frontmatter is the data;
the body is prose shown beneath the comparison.

`category` must be one of the 17 in `src/content.config.ts`; adding a new one
means adding it there *and* to the `LABEL` map in `src/pages/concepts/index.astro`
(the array's order is the display order).

`mappingKind` is the honest signal, and picking it correctly matters more than
filling in every field:

- `direct` — same idea, same shape, swap the call
- `approximate` — same goal, different shape; the notes carry the delta
- `none` — no first-party equivalent; `gap` names what people actually use
- `mental-model` — the engines disagree structurally, so prose, not a table

Backticks work in `notes`, `migration` and `gap` even though they are YAML
scalars; `src/lib/inline.ts` renders that subset.

Quote any frontmatter value containing `: ` — GDScript signatures like
`func _process(delta: float)` will otherwise break the YAML parser.

## Known gaps

- **The Godot index carries names only.** That is all the linter needs, and the
  site links to docs.godotengine.org rather than restating it. Signatures and
  prose are no longer ingested.
- **The Unity index is a 26-symbol seed list.** `scripts/ingest-unity.mjs`
  has the `--assemblies` path stubbed out; finishing it means a Mono.Cecil pass
  over a local Unity install's managed DLLs. It throws rather than emitting a
  partial index that looks complete.
- **52 concepts across 17 categories.** Broad coverage of the migration path.
  The thinnest areas are audio, navigation, networking, debugging and editor
  tooling, at one concept each — enough to orient, not enough to be a reference.
