#!/usr/bin/env node
/**
 * Build a name-only index of Godot's API, used to VALIDATE content.
 *
 * We no longer publish an API browser — docs.godotengine.org does that better,
 * and mirroring it added pages without adding value. What the API dump is still
 * worth keeping for is checking our own work: every `symbol` we cite in a
 * concept or recipe should actually exist in the engine.
 *
 * So this emits names only (no signatures, no prose), which is a few hundred KB
 * instead of several MB. `scripts/lint-content.mjs` reads it.
 *
 * Source is `extension_api.json` — the dump `godot --dump-extension-api`
 * produces, published per-branch in godot-cpp.
 *
 *   node scripts/ingest-godot.mjs                  # default branch
 *   node scripts/ingest-godot.mjs --branch 4.3
 *   node scripts/ingest-godot.mjs --from ./extension_api.json
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const DEFAULT_BRANCH = '4.4';
const OUT_DIR = 'src/data/godot';

function arg(name, fallback = null) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

async function loadApi() {
  const from = arg('from');
  if (from) {
    console.log(`  reading ${from}`);
    return JSON.parse(await readFile(from, 'utf8'));
  }
  const branch = arg('branch', DEFAULT_BRANCH);
  const url = `https://raw.githubusercontent.com/godotengine/godot-cpp/${branch}/gdextension/extension_api.json`;
  console.log(`  fetching ${url}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetch failed: ${res.status} ${res.statusText}`);
  return res.json();
}

async function main() {
  console.log('godot: building API name index');
  const api = await loadApi();
  const h = api.header;
  const version = `${h.version_major}.${h.version_minor}`;

  const singletons = new Set(api.singletons.map((s) => s.type));

  /** Short keys keep the committed file small: m/p/s/c = methods/properties/signals/constants. */
  const classes = {};
  for (const c of api.classes) {
    classes[c.name] = {
      m: (c.methods ?? []).map((x) => x.name),
      p: (c.properties ?? []).map((x) => x.name),
      s: (c.signals ?? []).map((x) => x.name),
      // Enum VALUES are folded in with constants: in GDScript both are reached
      // as `Class.NAME`, which is what the linter validates.
      c: [
        ...(c.constants ?? []).map((x) => x.name),
        ...(c.enums ?? []).flatMap((e) => e.values.map((v) => v.name)),
      ],
      e: (c.enums ?? []).map((x) => x.name),
      ...(singletons.has(c.name) ? { singleton: 1 } : {}),
      ...(c.inherits ? { inherits: c.inherits } : {}),
    };
  }

  const builtins = {};
  for (const b of api.builtin_classes ?? []) {
    builtins[b.name] = {
      m: (b.methods ?? []).map((x) => x.name),
      p: (b.members ?? []).map((x) => x.name),
      c: (b.constants ?? []).map((x) => x.name),
    };
  }

  const out = {
    engine: 'godot',
    version,
    versionFull: h.version_full_name,
    generatedAt: new Date().toISOString(),
    source: arg('from') ?? `godot-cpp@${arg('branch', DEFAULT_BRANCH)}`,
    license: {
      tier: 'full',
      name: 'CC-BY 3.0',
      attribution: 'Godot Engine documentation, CC-BY 3.0. Engine is MIT.',
      url: 'https://docs.godotengine.org/en/stable/about/complying_with_licenses.html',
    },
    classes,
    builtins,
    utility: (api.utility_functions ?? []).map((f) => f.name),
  };

  await mkdir(OUT_DIR, { recursive: true });
  const dest = path.join(OUT_DIR, 'api-index.json');
  await writeFile(dest, JSON.stringify(out));

  const members = Object.values(classes).reduce(
    (n, c) => n + c.m.length + c.p.length + c.s.length,
    0
  );
  const kb = Math.round((await readFile(dest)).length / 1024);
  console.log(
    `  ${out.versionFull}: ${Object.keys(classes).length} classes, ` +
      `${Object.keys(builtins).length} builtins, ${members} members, ` +
      `${out.utility.length} utility functions -> ${dest} (${kb} KB)`
  );
}

main().catch((e) => {
  console.error(`godot ingest failed: ${e.message}`);
  process.exit(1);
});
