import { defineCollection, z } from 'astro:content';
import { glob, file } from 'astro/loaders';

const ENGINES = ['unity', 'godot'] as const;

export const CATEGORIES = [
  'lifecycle',
  'scripting',
  'scene-structure',
  'input',
  'physics',
  'rendering',
  'ui',
  'audio',
  'animation',
  'navigation',
  'assets',
  'serialization',
  'events',
  'async',
  'networking',
  'debugging',
  'editor',
] as const;

/**
 * A single engine's answer to a concept.
 *
 * `license` and `lang` are derived, never authored — see SCOPE.md. Godot docs
 * are CC-BY 3.0 and may be mirrored; Unity docs may not, so a Unity binding
 * carries our own prose plus a required outbound link. The transform below is
 * the enforcement point: authoring `license: full` on a Unity binding fails
 * the build rather than silently shipping prose we do not own.
 */
const binding = z
  .object({
    engine: z.enum(ENGINES),
    /** Fully-qualified symbol, e.g. `Node.add_child` or `InputAction.IsPressed`. */
    symbol: z.string().optional(),
    signature: z.string().optional(),
    snippet: z.string(),
    notes: z.string().optional(),
    docsUrl: z.string().url().optional(),
    license: z.enum(['full', 'link-only']).optional(),
  })
  .transform((b, ctx) => {
    const required = b.engine === 'godot' ? 'full' : 'link-only';

    if (b.license && b.license !== required) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['license'],
        message:
          `${b.engine} bindings are always "${required}" (see SCOPE.md). ` +
          `Remove the license field — it is derived.`,
      });
    }

    if (required === 'link-only' && !b.docsUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['docsUrl'],
        message:
          `${b.engine} prose cannot be mirrored, so docsUrl is required — ` +
          `the reader needs somewhere to go for the full text.`,
      });
    }

    return {
      ...b,
      license: required,
      lang: b.engine === 'godot' ? ('gdscript' as const) : ('csharp' as const),
    };
  });

const concepts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/concepts' }),
  schema: z
    .object({
      title: z.string(),
      category: z.enum(CATEGORIES),
      summary: z.string(),

      /**
       * direct       — same idea, same shape, swap the call
       * approximate  — same goal, different shape; the notes carry the delta
       * none         — no first-party equivalent; `gap` names what people use
       * mental-model — the engines disagree structurally; prose, not a table
       */
      mappingKind: z.enum(['direct', 'approximate', 'none', 'mental-model']),

      bindings: z.array(binding).default([]),

      /** Directional notes. The reader arriving from each side knows different things. */
      migration: z
        .object({
          fromUnity: z.string().optional(),
          fromGodot: z.string().optional(),
        })
        .optional(),

      /** Required when mappingKind is `none`. Names the real-world workaround. */
      gap: z.string().optional(),

      related: z.array(z.string()).default([]),
      draft: z.boolean().default(false),
    })
    .superRefine((c, ctx) => {
      if (c.mappingKind === 'none' && !c.gap) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['gap'],
          message:
            'mappingKind "none" requires `gap`. A blank cell reads as ' +
            'incomplete research; a named gap reads as expertise (SCOPE.md).',
        });
      }
      if (c.mappingKind !== 'mental-model' && c.bindings.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['bindings'],
          message: 'Only mental-model concepts may omit bindings.',
        });
      }
    }),
});

export const RECIPE_GROUPS = [
  'movement',
  'input',
  'scene',
  'timing',
  'physics',
  'ui',
  'camera',
  'audio',
  'data',
  'effects',
  'debug',
] as const;

/**
 * Godot-only how-tos. Unlike concepts these make no comparison — they answer
 * "how do I do X in Godot" with code you can paste. All render onto the single
 * /recipes/ page, grouped and anchored.
 */
const recipes = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/recipes' }),
  schema: z.object({
    title: z.string(),
    group: z.enum(RECIPE_GROUPS),
    /** The problem, phrased as the reader would search for it. */
    summary: z.string(),
    /** Sort key within a group; lower first, then alphabetical. */
    order: z.number().default(50),
    /** Concept ids this recipe illustrates. */
    related: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

/**
 * Legacy Unity symbols. Searchable so the reader with old code on screen finds
 * something, but deliberately absent from tables and browse pages (SCOPE.md).
 */
const legacy = defineCollection({
  loader: file('./src/content/legacy/unity.json'),
  schema: z.object({
    id: z.string(),
    symbol: z.string(),
    replacedBy: z.string(),
    note: z.string(),
    docsUrl: z.string().url().optional(),
  }),
});

export const collections = { concepts, recipes, legacy };
