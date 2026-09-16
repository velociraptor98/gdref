import godot from '../data/godot/api-index.json';
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
    docsRoot: `https://docs.godotengine.org/en/${godot.version}/`,
  },
  unity: {
    id: 'unity' as const,
    label: 'Unity',
    version: unity.version,
    versionFull: unity.versionFull,
    lang: 'csharp' as const,
    license: unity.license,
    accent: 'var(--unity)',
    docsRoot: 'https://docs.unity3d.com/ScriptReference/',
  },
};

export const godotApi = godot;
export const unityApi = unity;

export function unitySymbol(id: string) {
  return unity.symbols.find((s) => s.id === id) ?? null;
}
