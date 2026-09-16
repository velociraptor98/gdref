# gdref

A Rosetta stone and script reference for developers moving between **Unity 6**
and **Godot 4**.

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

## Layout

```
src/
  content.config.ts        Zod schemas — and where the licensing invariant is enforced
  content/
    concepts/*.md          Hand-authored Rosetta entries (the actual product)
    legacy/unity.json      Legacy Unity symbols as searchable redirect stubs
  data/
    godot/4.4.json         Generated. Committed on purpose — see below.
    unity/6.json           Generated. Metadata only.
  lib/                     Data access + inline-markdown helper
  pages/
    concepts/[id].astro    Side-by-side concept pages
    godot/[slug].astro     952 generated class pages
    legacy/[id].astro      Thin "this was replaced by" stubs
    search.astro           Pagefind UI
scripts/
  ingest-godot.mjs         extension_api.json -> src/data/godot/
  ingest-unity.mjs         symbol index -> src/data/unity/
  lint-content.mjs         cross-reference checks Zod cannot express
SCOPE.md                   What is in scope, what is not, and why
```

## Why generated data is committed

`src/data/` is build output, but it is checked in deliberately:

- Builds are reproducible without network access.
- Diffing `godot/4.4.json` against a future `4.5.json` gives you an "what changed
  between versions" page for free.
- CI does not need a Godot binary.

Re-run `npm run ingest` when you bump an engine version, and review the diff.

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

## What counts as legacy

The `legacy/` collection is for Unity APIs that are **deprecated or removed**,
so a reader with old code on screen finds a pointer to the modern concept. An
API that is merely *different in Godot* is not legacy — it belongs in a concept
binding. `PlayerPrefs`, `DontDestroyOnLoad` and `OnDrawGizmos` all failed this
test during authoring and were moved out; the linter now enforces it.

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

- **Godot prose is not merged yet.** The reference is structurally complete
  (signatures, signals, properties, enums) but descriptions need a local engine
  checkout: `npm run ingest:godot -- --docs <godot>/doc/classes`.
- **The Unity index is a 26-symbol seed list.** `scripts/ingest-unity.mjs`
  has the `--assemblies` path stubbed out; finishing it means a Mono.Cecil pass
  over a local Unity install's managed DLLs. It throws rather than emitting a
  partial index that looks complete.
- **52 concepts across 17 categories.** Broad coverage of the migration path.
  The thinnest areas are audio, navigation, networking, debugging and editor
  tooling, at one concept each — enough to orient, not enough to be a reference.
