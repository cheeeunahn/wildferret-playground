import { createTheme } from '@mantine/core';

// Palette lifted from wildferret-blog (src/styles/global.css): a cool neutral
// "ink" scale anchored to Shark (#1d2023), with Blue Ribbon as the one
// saturated accent. Mantine wants ten steps per colour, lightest first, so the
// blog's 50→950 ink scale is reversed here and padded at the dark end.
const ink = [
  '#f1f3f6',
  '#e2e5ea',
  '#ccd0d8',
  '#bcc0c9',
  '#9ba1ad',
  '#7c8290',
  '#5c6270',
  '#414652',
  '#2c3038',
  '#1d2023',
];

const accent = [
  '#eef3ff',
  '#dbe5fe',
  '#b7c8fd',
  '#90a9fc',
  '#6d8ffb',
  '#437cf8',
  '#1463f3',
  '#0d55da',
  '#0b48c4',
  '#083a9f',
];

export const theme = createTheme({
  colors: { ink, accent },
  primaryColor: 'accent',
  primaryShade: 6,
  // The page is faintly tinted and cards are pure white, so a card reads as
  // paper laid on a surface rather than as a recess.
  white: '#ffffff',
  black: '#1d2023',
  fontFamily:
    '"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, system-ui, "Segoe UI", Roboto, "Helvetica Neue", "Apple SD Gothic Neo", sans-serif',
  fontFamilyMonospace:
    'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
  defaultRadius: 'md',
  radius: { md: '12px', lg: '16px' },
  headings: {
    fontWeight: '700',
    sizes: {
      h1: { fontSize: '1.75rem', lineHeight: '1.3' },
    },
  },
  other: {
    paper: '#f4f5f8',
  },
});

// Semantic tokens the components read, so the palette lives in one place.
export const cssVariablesResolver = (t) => ({
  variables: {
    '--wf-paper': t.other.paper,
    '--wf-surface': t.white,
    '--wf-hairline': t.colors.ink[1],
    '--mantine-color-body': t.other.paper,
    '--mantine-color-text': t.colors.ink[9],
  },
  light: {},
  dark: {},
});
