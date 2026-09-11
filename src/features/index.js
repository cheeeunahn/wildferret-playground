import { songsFeature } from './songs';
import { toolsFeature } from './tools';

// This is the only cross-feature registry. Adding an item here makes its main
// page available to both the router and the site navigation.
export const FEATURES = [songsFeature, toolsFeature];

export const DEFAULT_FEATURE = FEATURES[0];
