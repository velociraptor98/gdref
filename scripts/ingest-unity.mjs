#!/usr/bin/env node
/**
 * Build the Unity symbol index.
 *
 * Unity's docs are proprietary and may not be redistributed, so unlike the
 * Godot ingester this deliberately captures **metadata only**: name, kind,
 * namespace, signature shape, and a canonical deep link. Prose on our pages is
 * always our own. See SCOPE.md.
 *
 * Two legitimate sources, neither of which redistributes documentation:
 *
 *   --assemblies <dir>   Reflect over a local Unity install's managed DLLs
 *                        (`<Unity>/Editor/Data/Managed/UnityEngine/`). Requires
 *                        `mono-cecil` via a small C# or `ikvm`-style helper;
 *                        this is the accurate path and the one to finish first.
 *
 *   --seed <file.json>   Hand-maintained seed list (the default). Enough to
 *                        make concept pages resolve and search work while the
 *                        assembly path is built out.
 *
 * Scope filter: modern Unity only. Legacy symbols do not belong here — they
 * live in src/content/legacy/unity.json as redirect stubs.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const OUT_DIR = 'src/data/unity';
const SEED = 'scripts/data/unity-seed.json';
const VERSION = '6';

function arg(name, fallback = null) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

/** Deep link into Unity's ScriptReference. Package APIs live under their own path. */
function docsUrlFor(sym) {
  if (sym.docsUrl) return sym.docsUrl;
  const page = sym.member ? `${sym.type}.${sym.member}` : sym.type;
  if (sym.package === 'com.unity.inputsystem') {
    return `https://docs.unity3d.com/Packages/com.unity.inputsystem@latest/index.html?subfolder=/api/${sym.namespace}.${page}.html`;
  }
  return `https://docs.unity3d.com/ScriptReference/${page.replace(/\./g, '-')}.html`;
}

async function loadAssemblies(dir) {
  // Intentionally not implemented yet — the Cecil helper is the next milestone.
  // Failing loudly beats emitting a half-index that looks complete.
  throw new Error(
    `--assemblies is not implemented yet (looked at ${dir}).\n` +
      `  Planned: Mono.Cecil pass over Managed/UnityEngine/*.dll emitting the\n` +
      `  same shape as ${SEED}. Run without --assemblies to use the seed list.`
  );
}

async function loadSeed(file) {
  if (!existsSync(file)) {
    throw new Error(`seed file not found: ${file}`);
  }
  return JSON.parse(await readFile(file, 'utf8'));
}

async function main() {
  console.log('unity: building symbol index (metadata only — docs are proprietary)');

  const assemblies = arg('assemblies');
  const raw = assemblies ? await loadAssemblies(assemblies) : await loadSeed(arg('seed', SEED));

  const symbols = raw.symbols
    .map((s) => ({
      id: [s.namespace, s.type, s.member].filter(Boolean).join('.'),
      kind: s.kind,
      namespace: s.namespace,
      type: s.type,
      member: s.member ?? null,
      signature: s.signature ?? null,
      summary: s.summary ?? '',
      package: s.package ?? 'builtin',
      docsUrl: docsUrlFor(s),
      license: 'link-only',
    }))
    .sort((a, b) => a.id.localeCompare(b.id));

  const out = {
    engine: 'unity',
    version: VERSION,
    versionFull: `Unity ${VERSION}`,
    generatedAt: new Date().toISOString(),
    source: assemblies ? `assemblies:${assemblies}` : `seed:${path.basename(arg('seed', SEED))}`,
    license: {
      tier: 'link-only',
      name: 'Proprietary — Unity Technologies',
      attribution:
        'Unity documentation is proprietary and is not reproduced here. ' +
        'Symbol names and signatures are factual metadata; all prose is our own.',
      url: 'https://unity.com/legal/terms-of-service',
    },
    symbols,
  };

  await mkdir(OUT_DIR, { recursive: true });
  const dest = path.join(OUT_DIR, `${VERSION}.json`);
  await writeFile(dest, JSON.stringify(out, null, 2));
  console.log(`  ${symbols.length} symbols -> ${dest}`);
  if (!assemblies) {
    console.log('  note: seed list. Pass --assemblies <Unity>/Editor/Data/Managed for full coverage.');
  }
}

main().catch((e) => {
  console.error(`unity ingest failed: ${e.message}`);
  process.exit(1);
});
