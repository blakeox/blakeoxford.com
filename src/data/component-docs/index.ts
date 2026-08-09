/**
 * Component documentation catalog — public API.
 */

export type {
  ComponentProp,
  ComponentExample,
  VisualTier,
  ComponentDoc,
  ComponentRecipeReference,
  ComponentManifestEntry,
} from './types';
export { COMPONENT_AUTHORING_CHECKLIST, PRIMITIVE_PROP_CONTRACT } from './types';
export { componentDocs } from './catalog';
export { componentManifest, componentManifestBaselineKeys } from './manifest';
export {
  getComponentsByCategory,
  searchComponents,
  getCategories,
  getAllTags,
  getComponentsWithVisualBaseline,
} from './helpers';
