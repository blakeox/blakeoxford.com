/**
 * Component documentation catalog — public API.
 */

export type {
  ComponentProp,
  ComponentExample,
  VisualTier,
  ComponentDoc,
} from './types';
export { COMPONENT_AUTHORING_CHECKLIST, PRIMITIVE_PROP_CONTRACT } from './types';
export { componentDocs } from './catalog';
export {
  getComponentsByCategory,
  searchComponents,
  getCategories,
  getAllTags,
  getComponentsWithVisualBaseline,
} from './helpers';
