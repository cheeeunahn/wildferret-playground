import { jevTutorialKrPage } from './jev-tutorial-kr';
import { songsFeature } from './songs';
import { toolsFeature } from './tools';

// This is the only cross-feature registry. Adding an item here makes its main
// page available to both the router and the site navigation.
export const FEATURES = [songsFeature, toolsFeature];

export const DEFAULT_FEATURE = FEATURES[0];

// Pages that share the site layout but stay out of the navigation: you get
// there by knowing the URL, and nothing on the site links to them.
export const UNLISTED_PAGES = [jevTutorialKrPage];
