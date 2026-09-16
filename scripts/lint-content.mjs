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
const LEGACY = 'src/content/legacy/unity.json';

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

console.log(`${concepts.size} concepts, ${legacy.length} legacy stubs`);
console.log('  by category:   ', JSON.stringify(by('category')));
console.log('  by mappingKind:', JSON.stringify(by('mappingKind')));

for (const w of warn) console.log(`  warn: ${w}`);
if (problems.length) {
  console.error(`\n${problems.length} problem(s):`);
  for (const p of problems) console.error(`  ${p}`);
  process.exit(1);
}
console.log('\nno broken cross-references.');
