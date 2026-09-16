import godot from '../data/godot/4.4.json';
import unity from '../data/unity/6.json';

export type EngineId = 'unity' | 'godot';

export const ENGINE_META = {
  godot: {
    id: 'godot' as const,
    label: 'Godot',
    version: godot.version,
    versionFull: godot.versionFull,
    lang: 'gdscript' as const,
    license: godot.license,
    accent: 'var(--godot)',
  },
  unity: {
    id: 'unity' as const,
    label: 'Unity',
    version: unity.version,
    versionFull: unity.versionFull,
    lang: 'csharp' as const,
    license: unity.license,
    accent: 'var(--unity)',
  },
};

export const godotApi = godot;
export const unityApi = unity;

/** Godot classes, sorted, with a stable URL slug. */
export function godotClasses() {
  return godot.classes.map((c) => ({ ...c, slug: c.name.toLowerCase() }));
}

export function godotClass(name: string) {
  return godot.classes.find((c) => c.name.toLowerCase() === name.toLowerCase()) ?? null;
}

/** Inheritance chain from a class up to Object, nearest ancestor first. */
export function godotAncestry(name: string): string[] {
  const chain: string[] = [];
  let cur = godotClass(name)?.inherits ?? null;
  while (cur) {
    chain.push(cur);
    cur = godotClass(cur)?.inherits ?? null;
  }
  return chain;
}

export function godotSubclasses(name: string) {
  return godot.classes.filter((c) => c.inherits === name).map((c) => c.name);
}

export function unitySymbol(id: string) {
  return unity.symbols.find((s) => s.id === id) ?? null;
}

/** Resolve a concept binding's `symbol` to a local page, when we have one. */
export function localSymbolHref(engine: EngineId, symbol: string | undefined): string | null {
  if (!symbol) return null;
  if (engine === 'godot') {
    const cls = symbol.split('.')[0];
    return godotClass(cls) ? `/godot/${cls.toLowerCase()}/` : null;
  }
  return null; // Unity has no local symbol pages: metadata only, we link out.
}
