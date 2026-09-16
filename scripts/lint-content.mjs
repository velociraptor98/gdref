#!/usr/bin/env node
/**
 * Cross-reference checks the Zod schema cannot express.
 *
 * The page templates use `.filter(Boolean)` when resolving `related` ids, so a
 * typo drops the link silently rather than failing. Same for a legacy stub
 * pointing at a concept that does not exist, and for in-body links to
 * /concepts/... paths. This catches all three.
 */
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const CONCEPTS = 'src/content/concepts';
const RECIPES = 'src/content/recipes';
const LEGACY = 'src/content/legacy/unity.json';
const GODOT_INDEX = 'src/data/godot/api-index.json';

const problems = [];
const warn = [];

const files = (await readdir(CONCEPTS)).filter((f) => f.endsWith('.md'));
const concepts = new Map();

for (const f of files) {
  const raw = await readFile(path.join(CONCEPTS, f), 'utf8');
  const id = f.replace(/\.md$/, '');
  const fm = raw.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '';
  const body = raw.slice(raw.indexOf('\n---', 4) + 4);

  concepts.set(id, {
    id,
    body,
    category: fm.match(/^category:\s*(\S+)/m)?.[1],
    mappingKind: fm.match(/^mappingKind:\s*(\S+)/m)?.[1],
    related: [...fm.matchAll(/^\s+- ([a-z0-9-]+)\s*$/gm)]
      .map((m) => m[1])
      .filter((v) => fm.indexOf('related:') !== -1 && fm.indexOf(v) > fm.indexOf('related:')),
    engines: [...fm.matchAll(/^\s+- engine:\s*(\w+)/gm)].map((m) => m[1]),
    // Pair each binding's engine with the symbol that follows it.
    symbols: [...fm.matchAll(/- engine:\s*(\w+)[\s\S]*?symbol:\s*'?([^'\n]+)'?/g)].map((m) => ({
      engine: m[1],
      symbol: m[2].trim(),
    })),
  });
}

for (const c of concepts.values()) {
  for (const r of c.related) {
    if (!concepts.has(r)) problems.push(`${c.id}: related "${r}" does not exist`);
    if (r === c.id) problems.push(`${c.id}: related links to itself`);
  }
  // In-body cross links, e.g. [text](/concepts/foo/)
  for (const m of c.body.matchAll(/\]\(\/concepts\/([a-z0-9-]+)\/\)/g)) {
    if (!concepts.has(m[1])) problems.push(`${c.id}: body links to missing /concepts/${m[1]}/`);
  }
  if (c.mappingKind !== 'mental-model' && !c.engines.includes('godot')) {
    warn.push(`${c.id}: no godot binding`);
  }
  if (c.mappingKind !== 'mental-model' && c.mappingKind !== 'none' && !c.engines.includes('unity')) {
    warn.push(`${c.id}: no unity binding`);
  }
}

/**
 * Validate that every Godot symbol we cite actually exists in the engine.
 *
 * This is the reason we still ingest the API at all. A `symbol` is either a
 * bare class (`Timer`) or `Class.member`, where member may be a method,
 * property, signal, constant or enum — or, on a singleton, any of those. GDScript
 * annotations (`@tool`, `@export`) and `@GlobalScope` utility functions are
 * handled separately; they are language features, not class members.
 */
const godot = JSON.parse(await readFile(GODOT_INDEX, 'utf8'));

function checkGodotSymbol(sym) {
  if (sym.startsWith('@GlobalScope')) {
    const fn = sym.split('.')[1];
    if (!fn) return null; // bare @GlobalScope is fine
    return godot.utility.includes(fn) ? null : `utility function "${fn}" not found`;
  }
  // Annotations and other language-level names are not in the class API.
  if (sym.startsWith('@') || !/^[A-Z]/.test(sym)) return null;

  const [cls, member] = sym.split('.');
  const entry = godot.classes[cls] ?? godot.builtins[cls];
  if (!entry) return `class "${cls}" not found in Godot ${godot.version}`;
  if (!member) return null;

  const members = [
    ...(entry.m ?? []),
    ...(entry.p ?? []),
    ...(entry.s ?? []),
    ...(entry.c ?? []),
    ...(entry.e ?? []),
  ];
  if (members.includes(member)) return null;

  // Inherited members count — `CharacterBody2D.move_and_slide` is its own, but
  // plenty of cited symbols live on a base class.
  let parent = entry.inherits;
  while (parent && godot.classes[parent]) {
    const p = godot.classes[parent];
    if ([...p.m, ...p.p, ...p.s, ...p.c, ...(p.e ?? [])].includes(member)) return null;
    parent = p.inherits;
  }
  return `"${cls}.${member}" not found (class exists, member does not)`;
}

for (const c of concepts.values()) {
  for (const { engine, symbol } of c.symbols) {
    if (engine !== 'godot') continue;
    const err = checkGodotSymbol(symbol);
    if (err) problems.push(`${c.id}: godot symbol ${err}`);
  }
}

/**
 * Recipes are Godot-only code readers will paste, so the class and member names
 * in them get checked too. Only unambiguous forms are inspected — `extends X`,
 * `X.new()`, type annotations, and `Class.MEMBER` where Class is a known engine
 * class — which keeps false positives near zero without needing to parse
 * GDScript.
 */
const LANG_TYPES = new Set([
  'Variant', 'Array', 'Dictionary', 'String', 'StringName', 'NodePath', 'Callable',
  'Signal', 'RID', 'Object', 'PackedByteArray', 'PackedInt32Array', 'PackedInt64Array',
  'PackedFloat32Array', 'PackedFloat64Array', 'PackedStringArray', 'PackedVector2Array',
  'PackedVector3Array', 'PackedColorArray', 'OK', 'TYPE', 'KEY', 'MOUSE',
]);

function isKnownClass(name) {
  return Boolean(godot.classes[name] || godot.builtins[name] || LANG_TYPES.has(name));
}

const recipeFiles = (await readdir(RECIPES)).filter((f) => f.endsWith('.md'));
const recipes = new Map();

for (const f of recipeFiles) {
  const raw = await readFile(path.join(RECIPES, f), 'utf8');
  const id = f.replace(/\.md$/, '');
  const fm = raw.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '';
  const body = raw.slice(raw.indexOf('\n---', 4) + 4);

  recipes.set(id, {
    id,
    body,
    group: fm.match(/^group:\s*(\S+)/m)?.[1],
    related: (fm.match(/^related:\s*\[([^\]]*)\]/m)?.[1] ?? '')
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean),
  });
}

// Only GDScript blocks — GLSL shader code has its own vocabulary.
const gdBlocks = (body) =>
  [...body.matchAll(/```gdscript\n([\s\S]*?)```/g)].map((m) => m[1]).join('\n');

for (const r of recipes.values()) {
  for (const id of r.related) {
    if (!concepts.has(id)) problems.push(`recipe ${r.id}: related concept "${id}" does not exist`);
  }

  const code = gdBlocks(r.body);
  const seen = new Set();

  const flagClass = (name) => {
    if (seen.has(name) || isKnownClass(name)) return;
    seen.add(name);
    problems.push(`recipe ${r.id}: unknown Godot class "${name}"`);
  };

  for (const m of code.matchAll(/^extends\s+([A-Z]\w+)/gm)) flagClass(m[1]);
  for (const m of code.matchAll(/\b([A-Z]\w+)\.new\(\)/g)) flagClass(m[1]);
  for (const m of code.matchAll(/:\s*([A-Z]\w+)(?:\s*[=,)\n]|$)/gm)) flagClass(m[1]);
  for (const m of code.matchAll(/\bas\s+([A-Z]\w+)/g)) flagClass(m[1]);

  // Class.MEMBER references, where the class is one we know.
  for (const m of code.matchAll(/\b([A-Z]\w+)\.([a-zA-Z_]\w*)/g)) {
    const [, cls, member] = m;
    // `new` is the constructor, not a member — the class itself is checked above.
    if (member === 'new') continue;
    const key = `${cls}.${member}`;
    if (seen.has(key) || !godot.classes[cls]) continue;
    seen.add(key);
    if (checkGodotSymbol(key)) {
      problems.push(`recipe ${r.id}: "${key}" is not a member of ${cls}`);
    }
  }
}

const legacy = JSON.parse(await readFile(LEGACY, 'utf8'));
const ids = new Set();
for (const l of legacy) {
  if (ids.has(l.id)) problems.push(`legacy: duplicate id "${l.id}"`);
  ids.add(l.id);
  if (!concepts.has(l.replacedBy)) {
    problems.push(`legacy "${l.symbol}": replacedBy "${l.replacedBy}" does not exist`);
  }
  // A stub whose own note says the API is current contradicts the collection's
  // purpose: readers see a "Legacy" badge on something that is not deprecated.
  if (/\b(still current|not deprecated|still supported)\b/i.test(l.note)) {
    problems.push(
      `legacy "${l.symbol}": note says the API is current — it does not belong ` +
        `in the legacy collection (SCOPE.md). Cover it in a concept instead.`
    );
  }

  // A legacy symbol appearing in a concept binding would mean it leaked into scope.
  for (const c of concepts.values()) {
    if (c.body.includes(`\`${l.symbol}\``) && !c.body.includes('legacy')) {
      warn.push(`${c.id}: mentions legacy symbol ${l.symbol} outside a legacy note`);
    }
  }
}

const by = (key) =>
  [...concepts.values()].reduce((a, c) => ((a[c[key]] = (a[c[key]] ?? 0) + 1), a), {});

const godotChecked = [...concepts.values()].flatMap((c) =>
  c.symbols.filter((s) => s.engine === 'godot')
).length;
console.log(`${concepts.size} concepts, ${recipes.size} recipes, ${legacy.length} legacy stubs`);
console.log(`  godot symbols validated against ${godot.versionFull}: ${godotChecked}`);
console.log('  recipes by group:', JSON.stringify(
  [...recipes.values()].reduce((a, r) => ((a[r.group] = (a[r.group] ?? 0) + 1), a), {})
));
console.log('  by category:   ', JSON.stringify(by('category')));
console.log('  by mappingKind:', JSON.stringify(by('mappingKind')));

for (const w of warn) console.log(`  warn: ${w}`);
if (problems.length) {
  console.error(`\n${problems.length} problem(s):`);
  for (const p of problems) console.error(`  ${p}`);
  process.exit(1);
}
console.log('\nno broken cross-references.');
