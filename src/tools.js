// Archive of tools. Add a new one by appending to TOOLS below; each entry
// points at a React component that fills the tool panel.

import AsciiSketchbook from './tools/asciiSketchbook/AsciiSketchbook';

export const TOOLS = [
  {
    id: 'ascii-sketchbook',
    name: 'ASCII Sketchbook',
    description: '박스, 선, 텍스트로 ASCII 와이어프레임을 그리는 도구',
    Component: AsciiSketchbook,
  },
];
