#!/usr/bin/env node
/**
 * Ingest Godot's extension API dump into a slim, committed JSON file.
 *
 * Source of truth is `extension_api.json` — the same dump `godot
 * --dump-extension-api` produces, published per-branch in godot-cpp. It gives
 * every class, method, signal, property and enum, fully typed.
 *
 * Godot docs are CC-BY 3.0, so unlike Unity we can mirror freely. Prose lives
 * in `doc/classes/*.xml` in the engine repo; pass --docs to merge it in from a
 * local checkout. Without it you still get the complete structural API.
 *
 *   node scripts/ingest-godot.mjs                        # default branch
 *   node scripts/ingest-godot.mjs --branch 4.3
 *   node scripts/ingest-godot.mjs --from ./extension_api.json
 *   node scripts/ingest-godot.mjs --docs ~/src/godot/doc/classes
 */
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const DEFAULT_BRANCH = '4.4';
const OUT_DIR = 'src/data/godot';

function arg(name, fallback = null) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

/** `enum::Node.InternalMode` -> `Node.InternalMode`, `typedarray::Node` -> `Array[Node]`. */
function cleanType(t) {
  if (!t) return 'void';
  if (t.startsWith('enum::')) return t.slice(6);
  if (t.startsWith('bitfield::')) return t.slice(10);
  if (t.startsWith('typedarray::')) {
    // May carry a `24/17:` variant prefix for packed element types.
    const inner = t.slice(12).replace(/^\d+\/\d+:/, '');
    return `Array[${cleanType(inner)}]`;
  }
  return t;
}

function renderArgs(args = []) {
  return args
    .map((a) => {
      const base = `${a.name}: ${cleanType(a.type)}`;
      return 'default_value' in a ? `${base} = ${a.default_value}` : base;
    })
    .join(', ');
}

function renderMethod(m) {
  const ret = cleanType(m.return_value?.type);
  const args = renderArgs(m.arguments);
  const vararg = m.is_vararg ? (args ? ', ...' : '...') : '';
  const prefix = m.is_static ? 'static func' : 'func';
  // `is_const` is surfaced as a badge in the UI, not in the signature — there
  // is no const-method syntax in GDScript to render it into.
  return `${prefix} ${m.name}(${args}${vararg}) -> ${ret}`;
}

function anchor(className, kind, memberName) {
  const slug = (s) => s.toLowerCase().replace(/_/g, '-');
  // Virtuals are named `_process`; Godot's anchor drops the leading underscore
  // rather than rendering it as a second dash.
  return `class-${slug(className)}-${kind}-${slug(memberName.replace(/^_+/, ''))}`;
}

function docsUrlFor(version, className, kind, memberName) {
  const base = `https://docs.godotengine.org/en/${version}/classes/class_${className.toLowerCase()}.html`;
  return kind ? `${base}#${anchor(className, kind, memberName)}` : base;
}

/** Strip the XML tag soup Godot uses in descriptions down to readable text. */
function stripBBCode(s) {
  return s
    .replace(/\[(code|codeblock|gdscript|csharp)\]([\s\S]*?)\[\/\1\]/g, '`$2`')
    .replace(/\[(b|i|u)\]([\s\S]*?)\[\/\1\]/g, '$2')
    .replace(/\[(?:method|member|signal|constant|enum|param|class)\s+([^\]]+)\]/g, '`$1`')
    .replace(/\[url=[^\]]*\]([\s\S]*?)\[\/url\]/g, '$1')
    .replace(/\[\/?[a-z]+[^\]]*\]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Minimal targeted extraction — avoids pulling an XML parser for four fields. */
async function loadDocs(dir) {
  const docs = new Map();
  if (!dir || !existsSync(dir)) return docs;

  const files = (await readdir(dir)).filter((f) => f.endsWith('.xml'));
  for (const f of files) {
    const xml = await readFile(path.join(dir, f), 'utf8');
    const className = xml.match(/<class name="([^"]+)"/)?.[1];
    if (!className) continue;

    const brief = stripBBCode(xml.match(/<brief_description>([\s\S]*?)<\/brief_description>/)?.[1] ?? '');
    const full = stripBBCode(xml.match(/<description>([\s\S]*?)<\/description>/)?.[1] ?? '');

    const members = new Map();
    for (const m of xml.matchAll(/<method name="([^"]+)"[\s\S]*?<description>([\s\S]*?)<\/description>/g)) {
      members.set(m[1], stripBBCode(m[2]));
    }
    docs.set(className, { brief, full, members });
  }
  console.log(`  merged prose for ${docs.size} classes from ${dir}`);
  return docs;
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
  console.log('godot: ingesting extension API');
  const api = await loadApi();
  const h = api.header;
  const version = `${h.version_major}.${h.version_minor}`;
  const docs = await loadDocs(arg('docs'));

  const singletons = new Set(api.singletons.map((s) => s.type));

  const classes = api.classes.map((c) => {
    const doc = docs.get(c.name);
    return {
      name: c.name,
      inherits: c.inherits ?? null,
      apiType: c.api_type,
      isRefcounted: !!c.is_refcounted,
      isInstantiable: !!c.is_instantiable,
      isSingleton: singletons.has(c.name),
      docsUrl: docsUrlFor(version, c.name),
      brief: doc?.brief ?? '',
      description: doc?.full ?? '',
      methods: (c.methods ?? []).map((m) => ({
        name: m.name,
        signature: renderMethod(m),
        isVirtual: !!m.is_virtual,
        isStatic: !!m.is_static,
        isConst: !!m.is_const,
        returnType: cleanType(m.return_value?.type),
        description: doc?.members.get(m.name) ?? '',
        // Godot documents virtuals (`_process`, `_ready`, ...) under a
        // `private-method` anchor rather than `method`.
        docsUrl: docsUrlFor(version, c.name, m.is_virtual ? 'private-method' : 'method', m.name),
      })),
      signals: (c.signals ?? []).map((s) => ({
        name: s.name,
        signature: `signal ${s.name}(${renderArgs(s.arguments)})`,
        docsUrl: docsUrlFor(version, c.name, 'signal', s.name),
      })),
      properties: (c.properties ?? []).map((p) => ({
        name: p.name,
        type: cleanType(p.type),
        setter: p.setter ?? null,
        getter: p.getter ?? null,
      })),
      enums: (c.enums ?? []).map((e) => ({
        name: e.name,
        isBitfield: !!e.is_bitfield,
        values: e.values.map((v) => ({ name: v.name, value: v.value })),
      })),
    };
  });

  classes.sort((a, b) => a.name.localeCompare(b.name));

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
    hasProse: docs.size > 0,
    classes,
  };

  await mkdir(OUT_DIR, { recursive: true });
  const dest = path.join(OUT_DIR, `${version}.json`);
  await writeFile(dest, JSON.stringify(out));

  const methods = classes.reduce((n, c) => n + c.methods.length, 0);
  const signals = classes.reduce((n, c) => n + c.signals.length, 0);
  const kb = Math.round((await readFile(dest)).length / 1024);
  console.log(
    `  ${out.versionFull}: ${classes.length} classes, ${methods} methods, ` +
      `${signals} signals -> ${dest} (${kb} KB)`
  );
  if (!out.hasProse) {
    console.log('  note: structural only. Pass --docs <godot>/doc/classes to merge prose.');
  }
}

main().catch((e) => {
  console.error(`godot ingest failed: ${e.message}`);
  process.exit(1);
});
