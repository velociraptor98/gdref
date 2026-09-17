import godot from '../data/godot/api-index.json';
import unity from '../data/unity/6.json';

export const ENGINE_META = {
  godot: {
    label: 'Godot',
    version: godot.version,
    versionFull: godot.versionFull,
    license: godot.license,
  },
  unity: {
    label: 'Unity',
    version: unity.version,
    versionFull: unity.versionFull,
    license: unity.license,
  },
};
