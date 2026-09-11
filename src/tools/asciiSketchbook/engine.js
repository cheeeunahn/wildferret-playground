// The ASCII Sketchbook drawing engine.
//
// The canvas, its char grid, and the pointer/keyboard gestures are inherently
// imperative, so they live here in one closure rather than in React state; the
// React shell owns only the chrome and mirrors what it needs through onState.

// Cells are small enough that a default canvas fits a laptop screen without
// panning; bigger canvases are a deliberate choice in the panel.
const BASE_CW = 11;
const BASE_CH = 20;
const PAD = 56; // matches the canvas pad's CSS padding

const CONT = '\0'; // wide-char continuation marker
const BOX_SET = new Set('┌┐└┘─│├┤┬┴┼╔╗╚╝═║╠╣╦╩╬+');
const B = { TL:'┌', TR:'┐', BL:'└', BR:'┘', H:'─', V:'│', TJ:'┬', BJ:'┴', LJ:'├', RJ:'┤', X:'┼' };

// Canvas colours, kept in sync with the Mantine theme in src/theme.js.
const CC = {
  bg:    '#ffffff',
  grid:  '#e2e5ea',
  box:   '#1d2023',
  txt:   '#1d2023',
  prev:  'rgba(20, 99, 243, 0.55)',
  sel:   'rgba(20, 99, 243, 0.08)',
  selBd: 'rgba(20, 99, 243, 0.70)',
  caret: '#1463f3',
};

export const TOOL_META = {
  select:   { label: '선택',     hint: '도형을 클릭해 드래그로 이동 · ⌘C/⌘V 복사/붙여넣기 · Del로 삭제' },
  rect:     { label: '사각형',   hint: '드래그하여 사각형 그리기' },
  line:     { label: '선',       hint: '드래그 방향으로 가로 또는 세로선 그리기' },
  arrow:    { label: '화살표',   hint: '드래그한 방향 끝에 화살촉이 붙어요 — 흐름도에 좋아요' },
  text:     { label: '텍스트',   hint: '클릭해 입력 · 이미 있는 글자를 클릭하면 수정돼요' },
  button:   { label: '버튼',     hint: '드래그한 크기의 버튼 · 글자는 텍스트 도구로 수정해요' },
  caret:    { label: '▼ 표시',   hint: '클릭한 자리에 ▼ 하나를 찍어요 — 드롭다운 표시에 좋아요' },
  block:    { label: '블록',     hint: '드래그한 영역을 █ 로 꽉 채워요' },
};

// The keyboard shortcut for each tool, shown in the panel and handled below.
export const TOOL_KEYS = {
  v: 'select', r: 'rect', l: 'line', a: 'arrow',
  t: 'text', b: 'button', d: 'caret', f: 'block',
};

export function isWide(ch) {
  if (!ch) return false;
  const c = ch.charCodeAt(0);
  return (c >= 0x1100 && c <= 0x115F) ||
    (c >= 0x2E80 && c <= 0x9FFF) ||
    (c >= 0xAC00 && c <= 0xD7A3) ||
    (c >= 0xFF00 && c <= 0xFF60);
}

/**
 * Wire an engine up to already-mounted DOM nodes.
 *
 * @param {object} o
 * @param {HTMLCanvasElement} o.canvas
 * @param {HTMLElement} o.wrap      scroll container around the canvas
 * @param {HTMLTextAreaElement} o.textbox  the in-place text entry overlay
 * @param {HTMLElement} o.root      keyboard scope, so shortcuts stay in the tool
 * @param {(s: object) => void} o.onState   tool / zoom / cursor / status changes
 * @param {(msg: string) => void} o.onToast
 */
export function createSketchbook({ canvas, wrap, textbox, root, onState, onToast }) {
  const ctx = canvas.getContext('2d');

  let CW = BASE_CW, CH = BASE_CH, zoom = 1.0;
  let COLS = 90, ROWS = 32;
  let showGrid = true;

  let grid = mkGrid();
  let histStack = [];
  let tool = 'select';

  // Drawing
  let drawing = false, sr = 0, sc = 0, er = 0, ec = 0;
  let prevGrid = null;

  // Selection
  let sel = null;        // { r1,c1,r2,c2 } — sorted
  let selDrag = false;
  let selAnchor = null;

  // Move (drag selection)
  let moving = false;
  let moveStart = null;
  let moveSnap = null;

  // Resize (box selection via corner handles)
  let resizing = false;
  let resizeAnchor = null;
  let resizeComp = null;   // the widget being resized, when it is one

  // Pan
  let spaceHeld = false;
  let panning = false;
  let panPt = null;
  let panScroll = null;

  // Component insert position
  let insPos = { r: 2, c: 2 };

  // Registered components (object model layered on top of the char grid)
  // { r1, c1, r2, c2, parts: [{ r, c1, c2, text }] }
  let components = [];

  // Text overlay
  let tbOrigin = null;
  let tbUserResized = false;
  let pendingPartEdit = null;

  let internalClip = null; // 2D char array preserving CONT layout

  canvas.width = COLS * CW;
  canvas.height = ROWS * CH;

  const emit = (patch) => onState?.(patch);

  // ══════════════════════════════════════════
  //  Grid helpers
  // ══════════════════════════════════════════
  function mkGrid() {
    return Array.from({ length: ROWS }, () => new Array(COLS).fill(' '));
  }
  function cloneGrid(g) { return g.map((r) => [...r]); }
  function inGrid(r, c) { return r >= 0 && r < ROWS && c >= 0 && c < COLS; }
  function getCell(r, c) { return inGrid(r, c) ? grid[r][c] : ' '; }

  function placeChar(g, r, c, ch) {
    if (!inGrid(r, c)) return 0;
    // Clean old wide-char artifacts at target
    if (g[r][c] === CONT && c > 0 && isWide(g[r][c-1])) g[r][c-1] = ' ';
    if (isWide(g[r][c]) && c+1 < COLS && g[r][c+1] === CONT) g[r][c+1] = ' ';
    if (isWide(ch)) {
      if (c+1 >= COLS) return 0;
      if (isWide(g[r][c+1]) && c+2 < COLS && g[r][c+2] === CONT) g[r][c+2] = ' ';
      g[r][c] = ch; g[r][c+1] = CONT;
      return 2;
    }
    g[r][c] = ch;
    return 1;
  }

  function putStr(g, r, c, str) {
    let col = c;
    for (const ch of [...str]) {
      if (col >= COLS) break;
      const used = placeChar(g, r, col, ch);
      if (!used) break;
      col += used;
    }
  }

  // ══════════════════════════════════════════
  //  Draw tools
  //
  //  Every tool is a drag: the shape is whatever fits the dragged box, so a
  //  button or a dropdown is as free-form as a rectangle. Drawing into a
  //  scratch grid gives the live preview; drawing into `grid` commits.
  // ══════════════════════════════════════════
  const BUTTON_LABEL = '버튼';

  function drawRect(g, r1, c1, r2, c2) {
    if (r1 === r2 && c1 === c2) { if (inGrid(r1,c1)) g[r1][c1] = '+'; return; }
    if (r1 === r2) { for (let c=c1;c<=c2;c++) if (inGrid(r1,c)) g[r1][c] = B.H; return; }
    if (c1 === c2) { for (let r=r1;r<=r2;r++) if (inGrid(r,c1)) g[r][c1] = B.V; return; }
    g[r1][c1] = B.TL; g[r1][c2] = B.TR; g[r2][c1] = B.BL; g[r2][c2] = B.BR;
    for (let c=c1+1; c<c2; c++) { g[r1][c] = B.H; g[r2][c] = B.H; }
    for (let r=r1+1; r<r2; r++) { g[r][c1] = B.V; g[r][c2] = B.V; }
  }

  // A drag taller than it is wide becomes a vertical line and vice versa, so
  // one tool covers both directions.
  function lineAxis(r1, c1, r2, c2) {
    return Math.abs(r2 - r1) > Math.abs(c2 - c1) ? 'v' : 'h';
  }

  function drawLine(g, r1, c1, r2, c2) {
    if (lineAxis(r1, c1, r2, c2) === 'h') {
      const [from, to] = c1 <= c2 ? [c1, c2] : [c2, c1];
      for (let c = from; c <= to; c++) if (inGrid(r1, c)) g[r1][c] = B.H;
    } else {
      const [from, to] = r1 <= r2 ? [r1, r2] : [r2, r1];
      for (let r = from; r <= to; r++) if (inGrid(r, c1)) g[r][c1] = B.V;
    }
  }

  function drawArrow(g, r1, c1, r2, c2) {
    if (lineAxis(r1, c1, r2, c2) === 'h') {
      const [from, to] = c1 <= c2 ? [c1, c2] : [c2, c1];
      for (let c = from; c <= to; c++) if (inGrid(r1, c)) g[r1][c] = B.H;
      if (inGrid(r1, c2)) g[r1][c2] = c2 >= c1 ? '▶' : '◀';
    } else {
      const [from, to] = r1 <= r2 ? [r1, r2] : [r2, r1];
      for (let r = from; r <= to; r++) if (inGrid(r, c1)) g[r][c1] = B.V;
      if (inGrid(r2, c1)) g[r2][c1] = r2 >= r1 ? '▼' : '▲';
    }
  }

  // Display width of a string, counting wide (CJK) chars as two cells
  function strDisplayWidth(str) {
    let w = 0;
    for (const ch of [...str]) w += isWide(ch) ? 2 : 1;
    return w;
  }

  // Centre a label on a row and report where it landed, so the caller can
  // register it as an editable part.
  function putCentered(g, r, c1, c2, label) {
    const lw = strDisplayWidth(label);
    const col = Math.max(c1, c1 + Math.floor((c2 - c1 + 1 - lw) / 2));
    putStr(g, r, col, label);
    return { r, c1: col, c2: col + lw - 1, text: label };
  }

  // A button is a box with a centred label, or a single [ label ] row when the
  // drag is too short for a box.
  function drawButton(g, r1, c1, r2, c2, label = BUTTON_LABEL) {
    if (r2 - r1 < 2) {
      const lw = strDisplayWidth(label);
      const right = Math.max(c2, c1 + lw + 3);
      if (inGrid(r1, c1)) g[r1][c1] = '[';
      for (let c = c1 + 1; c < right; c++) if (inGrid(r1, c)) g[r1][c] = ' ';
      if (inGrid(r1, right)) g[r1][right] = ']';
      const part = putCentered(g, r1, c1 + 1, right - 1, label);
      return { r1, c1, r2: r1, c2: right, parts: [part] };
    }
    drawRect(g, r1, c1, r2, c2);
    const mid = r1 + Math.floor((r2 - r1) / 2);
    for (let c = c1 + 1; c < c2; c++) if (inGrid(mid, c)) g[mid][c] = ' ';
    const part = putCentered(g, mid, c1 + 1, c2 - 1, label);
    return { r1, c1, r2, c2, parts: [part] };
  }

  // Just the caret — the box around a dropdown is a rectangle you can draw
  // yourself, and stamping the glyph alone composes with anything.
  function drawCaret(g, r, c) {
    if (inGrid(r, c)) g[r][c] = '▼';
  }

  // Solid fill, for placeholder blocks and filled-in areas.
  function drawBlock(g, r1, c1, r2, c2) {
    for (let r = r1; r <= r2; r++)
      for (let c = c1; c <= c2; c++)
        if (inGrid(r, c)) g[r][c] = '█';
  }

  // Draw the active tool's shape into `g`. Returns a component to register when
  // the shape carries editable text, else null.
  function applyTool(g, r1, c1, r2, c2) {
    const mr = Math.min(r1,r2), xr = Math.max(r1,r2);
    const mc = Math.min(c1,c2), xc = Math.max(c1,c2);

    switch (tool) {
      case 'rect':     drawRect(g, mr, mc, xr, xc); return null;
      case 'line':     drawLine(g, r1, c1, r2, c2); return null;
      case 'arrow':    drawArrow(g, r1, c1, r2, c2); return null;
      case 'button':   return drawButton(g, mr, mc, xr, xc);
      case 'caret':    drawCaret(g, r1, c1); return null;
      case 'block':    drawBlock(g, mr, mc, xr, xc); return null;
      default:         return null;
    }
  }

  // Commit the dragged shape, registering labelled parts so a click selects
  // just the label and the text tool can edit it in place.
  function commitDraw() {
    pushHistory();
    const comp = applyTool(grid, sr, sc, er, ec);
    if (comp) components.push(comp);
    render();
  }

  // ══════════════════════════════════════════
  //  Components — drawn widgets that carry editable text parts
  // ══════════════════════════════════════════
  function findComponentAt(r, c) {
    let best = null, bestArea = Infinity;
    for (const co of components) {
      if (r >= co.r1 && r <= co.r2 && c >= co.c1 && c <= co.c2) {
        const a = (co.r2 - co.r1 + 1) * (co.c2 - co.c1 + 1);
        if (a < bestArea) { best = co; bestArea = a; }
      }
    }
    return best;
  }

  function findTextPartAt(r, c) {
    // Pick the smallest text part the click lands on
    let best = null, bestW = Infinity;
    for (const co of components) {
      for (const p of co.parts) {
        if (p.r !== r || c < p.c1 || c > p.c2) continue;
        const w = p.c2 - p.c1 + 1;
        if (w < bestW) { best = { comp: co, part: p }; bestW = w; }
      }
    }
    return best;
  }

  // ══════════════════════════════════════════
  //  Render
  // ══════════════════════════════════════════
  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = CC.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid dots
    if (showGrid) {
      ctx.fillStyle = CC.grid;
      for (let r = 0; r <= ROWS; r++)
        for (let c = 0; c <= COLS; c++)
          ctx.fillRect(c * CW, r * CH, 1.5, 1.5);
    }

    // Selection fill
    if (sel) {
      ctx.fillStyle = CC.sel;
      ctx.fillRect(sel.c1*CW, sel.r1*CH, (sel.c2-sel.c1+1)*CW, (sel.r2-sel.r1+1)*CH);
    }

    // Characters
    const g = prevGrid ? mergeGrids() : grid;
    ctx.font = cellFont();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const ch = g[r][c];
        if (!ch || ch === ' ' || ch === CONT) continue;
        const wide = isWide(ch);
        const inPv = prevGrid && prevGrid[r][c] !== ' ' && prevGrid[r][c] !== CONT;
        ctx.fillStyle = inPv ? CC.prev : (BOX_SET.has(ch) ? CC.box : CC.txt);
        if (drawCellShape(ch, r, c)) continue;
        const x = wide ? (c*CW + CW) : (c*CW + CW/2);
        ctx.fillText(ch, x, r*CH + CH/2);
      }
    }

    // Selection border + handles
    if (sel) {
      ctx.strokeStyle = CC.selBd;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 3]);
      ctx.strokeRect(sel.c1*CW+.5, sel.r1*CH+.5, (sel.c2-sel.c1+1)*CW-1, (sel.r2-sel.r1+1)*CH-1);
      ctx.setLineDash([]);
      ctx.fillStyle = CC.caret;
      for (const [hc,hr] of [[sel.c1,sel.r1],[sel.c2+1,sel.r1],[sel.c1,sel.r2+1],[sel.c2+1,sel.r2+1]]) {
        ctx.fillRect(hc*CW-3, hr*CH-3, 6, 6);
      }
    }
  }

  // Box-drawing characters must span a whole cell or every line reads as a
  // dashed one, so the font size is fitted to the cell width (and remeasured
  // whenever zoom changes it) rather than derived from the row height alone.
  const FONT_STACK = "'D2Coding','Pretendard','Malgun Gothic','Courier New',monospace";
  let fontCache = { cw: 0, ch: 0, font: '' };

  function cellFont() {
    if (fontCache.cw === CW && fontCache.ch === CH) return fontCache.font;
    const base = Math.floor(CH * 0.72);
    let font = `${base}px ${FONT_STACK}`;
    ctx.font = font;
    const advance = ctx.measureText(B.H).width;
    if (advance > 0 && advance < CW) {
      const fitted = Math.min(CH - 2, Math.round((base * CW) / advance));
      font = `${fitted}px ${FONT_STACK}`;
    }
    fontCache = { cw: CW, ch: CH, font };
    return font;
  }

  // Box-drawing characters, blocks and arrowheads are drawn as geometry rather
  // than glyphs: no font fills a cell edge to edge, so drawn rules would show
  // gaps between cells at any size. Returns false for anything to draw as text.
  function drawCellShape(ch, r, c) {
    const x0 = c * CW, y0 = r * CH;
    const lw = Math.max(1, Math.round(CW / 9));
    const xm = Math.round(x0 + CW / 2 - lw / 2);
    const ym = Math.round(y0 + CH / 2 - lw / 2);
    const hseg = (from, to) => ctx.fillRect(from, ym, to - from, lw);
    const vseg = (from, to) => ctx.fillRect(xm, from, lw, to - from);
    const left = () => hseg(x0, xm + lw);
    const right = () => hseg(xm, x0 + CW);
    const up = () => vseg(y0, ym + lw);
    const down = () => vseg(ym, y0 + CH);

    switch (ch) {
      case '█': ctx.fillRect(x0, y0, CW, CH); return true;
      case B.H: hseg(x0, x0 + CW); return true;
      case B.V: vseg(y0, y0 + CH); return true;
      case B.TL: right(); down(); return true;
      case B.TR: left(); down(); return true;
      case B.BL: right(); up(); return true;
      case B.BR: left(); up(); return true;
      case B.LJ: vseg(y0, y0 + CH); right(); return true;
      case B.RJ: vseg(y0, y0 + CH); left(); return true;
      case B.TJ: hseg(x0, x0 + CW); down(); return true;
      case B.BJ: hseg(x0, x0 + CW); up(); return true;
      case B.X:
      case '+': hseg(x0, x0 + CW); vseg(y0, y0 + CH); return true;
      case '▶': case '◀': case '▲': case '▼': drawHead(ch, x0, y0); return true;
      default: return false;
    }
  }

  // Arrowheads as filled triangles, so they meet the line they cap. Cells are
  // twice as tall as wide, so each head is sized against its own axis.
  function drawHead(ch, x0, y0) {
    const cx = x0 + CW / 2, cy = y0 + CH / 2;
    ctx.beginPath();
    if (ch === '▶') {
      ctx.moveTo(x0 + CW * 0.15, cy - CH * 0.28);
      ctx.lineTo(x0 + CW, cy);
      ctx.lineTo(x0 + CW * 0.15, cy + CH * 0.28);
    } else if (ch === '◀') {
      ctx.moveTo(x0 + CW * 0.85, cy - CH * 0.28);
      ctx.lineTo(x0, cy);
      ctx.lineTo(x0 + CW * 0.85, cy + CH * 0.28);
    } else if (ch === '▲') {
      ctx.moveTo(cx - CW * 0.5, y0 + CH * 0.7);
      ctx.lineTo(cx, y0 + CH * 0.28);
      ctx.lineTo(cx + CW * 0.5, y0 + CH * 0.7);
    } else {
      ctx.moveTo(cx - CW * 0.5, y0 + CH * 0.3);
      ctx.lineTo(cx, y0 + CH * 0.72);
      ctx.lineTo(cx + CW * 0.5, y0 + CH * 0.3);
    }
    ctx.closePath();
    ctx.fill();
  }

  function mergeGrids() {
    const m = cloneGrid(grid);
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++)
        if (prevGrid[r][c] !== ' ') m[r][c] = prevGrid[r][c];
    return m;
  }

  // ══════════════════════════════════════════
  //  Coord helpers
  // ══════════════════════════════════════════
  function cellAt(e) {
    const rect = canvas.getBoundingClientRect();
    const sx = canvas.width / rect.width;
    const sy = canvas.height / rect.height;
    return {
      r: Math.max(0, Math.min(ROWS-1, Math.floor((e.clientY - rect.top)  * sy / CH))),
      c: Math.max(0, Math.min(COLS-1, Math.floor((e.clientX - rect.left) * sx / CW))),
    };
  }

  function cursorForTool(t) {
    if (t === 'text') return 'text';
    if (t === 'select') return 'default';
    return 'crosshair';
  }

  // ══════════════════════════════════════════
  //  Mouse events
  // ══════════════════════════════════════════
  function onMouseDown(e) {
    e.preventDefault();
    root.focus({ preventScroll: true });
    const { r, c } = cellAt(e);

    if (spaceHeld) {
      panning = true;
      panPt = { x: e.clientX, y: e.clientY };
      panScroll = { x: wrap.scrollLeft, y: wrap.scrollTop };
      canvas.style.cursor = 'grabbing';
      return;
    }

    if (tool === 'text') {
      const run = findTextRunAt(r, c);
      if (run) {
        pushHistory();
        for (let i = run.col; i <= run.end; i++) if (inGrid(r, i)) grid[r][i] = ' ';
        render();
        showTextbox(run.row, run.col, run.text);
      } else {
        showTextbox(r, c);
      }
      return;
    }

    // Clicking with another tool — commit any open textbox first
    if (tbOrigin) commitTextbox();

    if (tool === 'select') {
      // (0) Handle hit → resize box
      const hid = handleAt(e);
      if (hid && isResizable(sel)) {
        beginResize(hid);
        return;
      }
      // (1) Click inside existing selection → start moving it
      if (sel && r >= sel.r1 && r <= sel.r2 && c >= sel.c1 && c <= sel.c2) {
        beginMove(r, c);
        return;
      }
      // (1.4) Deepest text/icon part wins → select just that chunk
      const tp = findTextPartAt(r, c);
      if (tp) {
        sel = { r1: tp.part.r, c1: tp.part.c1, r2: tp.part.r, c2: tp.part.c2 };
        beginMove(r, c);
        render();
        return;
      }
      // (1.5) Smallest containing component (parent or nested child box)
      const comp = findComponentAt(r, c);
      if (comp) {
        sel = { r1: comp.r1, c1: comp.c1, r2: comp.r2, c2: comp.c2 };
        beginMove(r, c);
        render();
        return;
      }
      // (2) Click on a drawn cell → auto-select connected shape, start moving
      let ch = getCell(r, c);
      let cr = r, cc = c;
      if (ch === CONT && cc > 0) { cc--; ch = getCell(cr, cc); }
      if (ch !== ' ' && ch !== CONT) {
        const bbox = detectShape(cr, cc);
        if (bbox) {
          sel = bbox;
          beginMove(r, c);
          render();
          return;
        }
      }
      // (3) Empty cell → start new rectangle selection
      selDrag = true;
      selAnchor = { r, c };
      sel = { r1: r, c1: c, r2: r, c2: c };
      render();
      return;
    }

    drawing = true;
    sr = er = r; sc = ec = c;
  }

  function onMouseMove(e) {
    const { r, c } = cellAt(e);
    emit({ pos: `열 ${c+1}  행 ${r+1}` });

    if (panning) {
      wrap.scrollLeft = panScroll.x - (e.clientX - panPt.x);
      wrap.scrollTop  = panScroll.y - (e.clientY - panPt.y);
      return;
    }

    if (resizing) { updateResizePreview(r, c); return; }
    if (moving)   { updateMovePreview(r, c);   return; }

    if (selDrag) {
      sel = {
        r1: Math.min(selAnchor.r, r), c1: Math.min(selAnchor.c, c),
        r2: Math.max(selAnchor.r, r), c2: Math.max(selAnchor.c, c),
      };
      render();
      return;
    }

    if (drawing) {
      er = r; ec = c;
      prevGrid = mkGrid();
      applyTool(prevGrid, sr, sc, er, ec);
      render();
      return;
    }

    // Hover cursor: move over a selection or a detectable shape, resize over handles
    if (tool !== 'select' || spaceHeld) return;
    let cur = 'default';
    const hid = handleAt(e);
    if (hid && isResizable(sel)) {
      cur = (hid === 'tl' || hid === 'br') ? 'nwse-resize' : 'nesw-resize';
    } else if (sel && r >= sel.r1 && r <= sel.r2 && c >= sel.c1 && c <= sel.c2) {
      cur = 'move';
    } else {
      let ch = getCell(r, c);
      if (ch === CONT && c > 0) ch = getCell(r, c-1);
      if (ch !== ' ' && ch !== CONT) cur = 'move';
    }
    canvas.style.cursor = cur;
  }

  function onMouseUp(e) {
    if (panning) {
      panning = false;
      canvas.style.cursor = spaceHeld ? 'grab' : cursorForTool(tool);
      return;
    }

    if (resizing) { commitResize(); return; }

    if (moving) {
      const { r, c } = cellAt(e);
      commitMove(r, c);
      return;
    }

    if (selDrag) {
      selDrag = false;
      // Single click = deselect
      if (sel && sel.r1 === sel.r2 && sel.c1 === sel.c2) {
        sel = null;
        render();
        return;
      }
      // Figma-style: snap selection to shapes intersecting the marquee
      sel = collectShapesBBox(sel.r1, sel.c1, sel.r2, sel.c2); // null if empty
      render();
      return;
    }

    if (!drawing) return;
    drawing = false;
    prevGrid = null;
    const { r, c } = cellAt(e);
    er = r; ec = c;
    commitDraw();
  }

  // Double-click on a text/icon part inside a component → edit it in place
  function onDblClick(e) {
    if (tool !== 'select') return;
    const { r, c } = cellAt(e);
    const tp = findTextPartAt(r, c);
    if (!tp) return;
    e.preventDefault();
    const p = tp.part;
    pushHistory();
    // Erase the existing text in the grid; the component drops the part, and
    // committing the textbox re-attaches the edited one.
    for (let i = p.c1; i <= p.c2; i++) if (inGrid(p.r, i)) grid[p.r][i] = ' ';
    const partIdx = tp.comp.parts.indexOf(p);
    if (partIdx >= 0) tp.comp.parts.splice(partIdx, 1);
    pendingPartEdit = { comp: tp.comp, r: p.r, c: p.c1 };
    sel = null;
    render();
    setTool('text');
    showTextbox(p.r, p.c1, p.text);
  }

  function onMouseLeave() {
    emit({ pos: '—' });
    if (drawing) {
      drawing = false;
      prevGrid = null;
      commitDraw();
    }
    selDrag = false;
  }

  // Ctrl/⌘+Scroll = zoom
  function onWheel(e) {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    const rect = wrap.getBoundingClientRect();
    const newZ = Math.max(0.2, Math.min(5.0, zoom + (e.deltaY < 0 ? 0.1 : -0.1)));
    doZoom(newZ, e.clientX - rect.left, e.clientY - rect.top);
  }

  function doZoom(newZ, pivX, pivY) {
    const cPivX = wrap.scrollLeft + pivX;
    const cPivY = wrap.scrollTop  + pivY;
    const ratio = newZ / zoom;
    zoom = newZ;
    CW = Math.max(4, Math.round(BASE_CW * zoom));
    CH = Math.max(7, Math.round(BASE_CH * zoom));
    canvas.width  = COLS * CW;
    canvas.height = ROWS * CH;
    wrap.scrollLeft = cPivX * ratio - pivX;
    wrap.scrollTop  = cPivY * ratio - pivY;
    emit({ zoom });
    if (tbOrigin) { positionTextbox(); autoSizeTextbox(); }
    render();
  }

  function resetZoom() {
    doZoom(1.0, wrap.clientWidth / 2, wrap.clientHeight / 2);
  }

  // ══════════════════════════════════════════
  //  Visible text box (text tool)
  // ══════════════════════════════════════════
  function showTextbox(r, c, initialText = '') {
    if (tbOrigin) commitTextbox();
    tbOrigin = { row: r, col: c };
    textbox.value = initialText;
    tbUserResized = false;
    textbox.style.width = '';
    textbox.style.height = '';
    positionTextbox();
    textbox.style.display = 'block';
    autoSizeTextbox();
    setTimeout(() => {
      textbox.focus();
      if (initialText) textbox.setSelectionRange(initialText.length, initialText.length);
    }, 0);
  }

  function findTextRunAt(r, c) {
    if (!inGrid(r, c)) return null;
    let cc = c;
    const isText = (rr, col) => {
      if (!inGrid(rr, col)) return false;
      const ch = grid[rr][col];
      return ch !== ' ' && ch !== CONT && !BOX_SET.has(ch);
    };
    if (!isText(r, cc)) {
      if (cc > 0 && isText(r, cc - 1)) cc--;
      else if (cc + 1 < COLS && isText(r, cc + 1)) cc++;
      else return null;
    }
    let start = cc;
    while (start > 0 && (isText(r, start - 1) || (grid[r][start - 1] === CONT && start - 2 >= 0 && isText(r, start - 2)))) start--;
    let end = cc;
    while (end + 1 < COLS && (isText(r, end + 1) || grid[r][end + 1] === CONT)) end++;
    let text = '';
    for (let i = start; i <= end; i++) {
      if (grid[r][i] !== CONT) text += grid[r][i];
    }
    return { row: r, col: start, end, text };
  }

  function positionTextbox() {
    if (!tbOrigin) return;
    const fs = parseInt(cellFont(), 10);
    // padding is 6px 10px — offset so the typed text aligns with the grid cell
    textbox.style.left = (PAD + tbOrigin.col * CW - 10) + 'px';
    textbox.style.top  = (PAD + tbOrigin.row * CH - 6) + 'px';
    textbox.style.fontSize   = fs + 'px';
    textbox.style.lineHeight = CH + 'px';
    textbox.style.minWidth   = (CW * 6) + 'px';
    textbox.style.minHeight  = CH + 'px';
  }

  function autoSizeTextbox() {
    if (!tbOrigin || tbUserResized) return;
    textbox.style.height = 'auto';
    textbox.style.width  = 'auto';
    textbox.style.height = Math.max(CH, textbox.scrollHeight) + 'px';
    textbox.style.width  = Math.max(CW * 6, textbox.scrollWidth + CW) + 'px';
  }

  function commitTextbox() {
    if (!tbOrigin) return;
    const text = textbox.value;
    const origin = tbOrigin;
    const partEdit = pendingPartEdit;
    textbox.style.display = 'none';
    textbox.value = '';
    tbOrigin = null;
    pendingPartEdit = null;
    if (!text) { render(); return; }
    pushHistory();
    const lines = text.split('\n');
    let lastCol = origin.col;
    for (let i = 0; i < lines.length; i++) {
      const r = origin.row + i;
      if (r >= ROWS) break;
      let col = origin.col;
      for (const ch of [...lines[i]]) {
        if (col >= COLS) break;
        const u = placeChar(grid, r, col, ch);
        if (!u) break;
        col += u;
      }
      lastCol = col;
    }
    // If we were editing a part of a registered component, re-attach the text
    if (partEdit && lines.length === 1) {
      partEdit.comp.parts.push({
        r: origin.row,
        c1: origin.col,
        c2: Math.max(origin.col, lastCol - 1),
        text: lines[0],
      });
    }
    render();
  }

  function cancelTextbox() {
    textbox.style.display = 'none';
    textbox.value = '';
    tbOrigin = null;
    pendingPartEdit = null;
  }

  // Detect a manual drag on the resize handle, so autoSize stops fighting the user
  function onTextboxMouseDown(e) {
    const rect = textbox.getBoundingClientRect();
    if (e.clientX > rect.right - 18 && e.clientY > rect.bottom - 18) tbUserResized = true;
  }
  function onTextboxKeyDown(e) {
    e.stopPropagation();
    if (e.key === 'Escape') { e.preventDefault(); cancelTextbox(); render(); }
  }
  function onTextboxBlur() {
    setTimeout(() => {
      if (document.activeElement !== textbox && tbOrigin) commitTextbox();
    }, 80);
  }

  // ══════════════════════════════════════════
  //  Keyboard — scoped to the tool's root, never the whole page
  // ══════════════════════════════════════════
  function onKeyDown(e) {
    if (e.target === textbox) return;

    if (e.code === 'Space') {
      if (!e.repeat) {
        e.preventDefault();
        spaceHeld = true;
        if (!panning) canvas.style.cursor = 'grab';
      }
      return;
    }

    if (e.metaKey || e.ctrlKey) {
      const k = e.key.toLowerCase();
      if (k === 'z') { e.preventDefault(); undo(); return; }
      if (k === 'c' && sel) { e.preventDefault(); copySelection(); return; }
      if (k === 'x' && sel) { e.preventDefault(); copySelection(); deleteSel(); return; }
      if (k === 'v')        { e.preventDefault(); pasteClipboard(); return; }
      return;
    }

    const next = TOOL_KEYS[e.key.toLowerCase()];
    if (next) { setTool(next); return; }

    if ((e.key === 'Delete' || e.key === 'Backspace') && sel) {
      e.preventDefault();
      deleteSel();
      return;
    }
    if (e.key === 'Escape') { sel = null; render(); }
  }

  function onKeyUp(e) {
    if (e.code === 'Space') {
      spaceHeld = false;
      if (!panning) canvas.style.cursor = cursorForTool(tool);
    }
  }

  // ══════════════════════════════════════════
  //  Shape detection (flood-fill on non-empty cells)
  // ══════════════════════════════════════════
  const DIRS = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];

  function detectShape(r, c) {
    if (!inGrid(r, c)) return null;
    const ch = grid[r][c];
    if (ch === ' ' || ch === CONT) return null;
    const seen = new Set();
    const stack = [[r, c]];
    let r1 = r, r2 = r, c1 = c, c2 = c;
    // 8-directional flood-fill catches box corners that touch diagonally
    while (stack.length) {
      const [rr, cc] = stack.pop();
      const k = rr * COLS + cc;
      if (seen.has(k)) continue;
      if (!inGrid(rr, cc)) continue;
      if (grid[rr][cc] === ' ') continue;
      seen.add(k);
      r1 = Math.min(r1, rr); r2 = Math.max(r2, rr);
      c1 = Math.min(c1, cc); c2 = Math.max(c2, cc);
      for (const [dr, dc] of DIRS) stack.push([rr + dr, cc + dc]);
    }
    // Expand right if last col holds a wide-char start (its CONT lives at c2+1)
    if (c2 + 1 < COLS && isWide(grid[r1] && grid[r1][c2])) c2++;
    return { r1, c1, r2, c2 };
  }

  // Collect all shapes whose flood-fill touches the marquee, return union bbox
  function collectShapesBBox(mr1, mc1, mr2, mc2) {
    const seen = new Set();
    let R1 = Infinity, C1 = Infinity, R2 = -Infinity, C2 = -Infinity;
    let found = false;
    for (let r = mr1; r <= mr2; r++) {
      for (let c = mc1; c <= mc2; c++) {
        if (!inGrid(r, c)) continue;
        const ch = grid[r][c];
        if (ch === ' ' || ch === CONT) continue;
        const k = r * COLS + c;
        if (seen.has(k)) continue;
        const stack = [[r, c]];
        let sr1 = r, sr2 = r, sc1 = c, sc2 = c;
        while (stack.length) {
          const [rr, cc] = stack.pop();
          if (!inGrid(rr, cc)) continue;
          const kk = rr * COLS + cc;
          if (seen.has(kk)) continue;
          if (grid[rr][cc] === ' ') continue;
          seen.add(kk);
          sr1 = Math.min(sr1, rr); sr2 = Math.max(sr2, rr);
          sc1 = Math.min(sc1, cc); sc2 = Math.max(sc2, cc);
          for (const [dr, dc] of DIRS) stack.push([rr + dr, cc + dc]);
        }
        if (sc2 + 1 < COLS && isWide(grid[sr1][sc2])) sc2++;
        R1 = Math.min(R1, sr1); C1 = Math.min(C1, sc1);
        R2 = Math.max(R2, sr2); C2 = Math.max(C2, sc2);
        found = true;
      }
    }
    return found ? { r1: R1, c1: C1, r2: R2, c2: C2 } : null;
  }

  // ── Handle hit-test & box resize ──
  function handleAt(e) {
    if (!sel) return null;
    const rect = canvas.getBoundingClientRect();
    const sx = canvas.width / rect.width;
    const sy = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * sx;
    const y = (e.clientY - rect.top)  * sy;
    const HIT = Math.max(7, CW * 0.6);
    const pts = [
      ['tl', sel.c1 * CW,     sel.r1 * CH],
      ['tr', (sel.c2+1) * CW, sel.r1 * CH],
      ['bl', sel.c1 * CW,     (sel.r2+1) * CH],
      ['br', (sel.c2+1) * CW, (sel.r2+1) * CH],
    ];
    for (const [id, hx, hy] of pts) {
      if (Math.abs(x - hx) <= HIT && Math.abs(y - hy) <= HIT) return id;
    }
    return null;
  }

  // A selection is resizable when it is a plain box, or when it is exactly a
  // widget we drew (a button keeps its label centred as it resizes).
  function componentAt(s) {
    if (!s) return null;
    return components.find(
      (co) => co.r1 === s.r1 && co.c1 === s.c1 && co.r2 === s.r2 && co.c2 === s.c2,
    ) ?? null;
  }

  function isResizable(s) {
    return isBoxSelection(s) || componentAt(s) !== null;
  }

  function isBoxSelection(s) {
    if (!s) return false;
    if (s.r1 === s.r2 || s.c1 === s.c2) return false;
    if (!inGrid(s.r1, s.c1) || !inGrid(s.r2, s.c2)) return false;
    return grid[s.r1][s.c1] === B.TL && grid[s.r1][s.c2] === B.TR
        && grid[s.r2][s.c1] === B.BL && grid[s.r2][s.c2] === B.BR;
  }

  function drawBoxInto(g, r1, c1, r2, c2) {
    if (r1 === r2 && c1 === c2) { if (inGrid(r1,c1)) g[r1][c1] = '+'; return; }
    if (r1 === r2) { for (let c=c1;c<=c2;c++) if (inGrid(r1,c)) g[r1][c] = B.H; return; }
    if (c1 === c2) { for (let r=r1;r<=r2;r++) if (inGrid(r,c1)) g[r][c1] = B.V; return; }
    g[r1][c1] = B.TL; g[r1][c2] = B.TR; g[r2][c1] = B.BL; g[r2][c2] = B.BR;
    for (let c=c1+1; c<c2; c++) { g[r1][c] = B.H; g[r2][c] = B.H; }
    for (let r=r1+1; r<r2; r++) { g[r][c1] = B.V; g[r][c2] = B.V; }
  }

  function eraseBoxBorder(r1, c1, r2, c2) {
    const isBorderCh = (ch) => ch === B.TL || ch === B.TR || ch === B.BL || ch === B.BR || ch === B.H || ch === B.V;
    for (let c=c1; c<=c2; c++) {
      if (inGrid(r1,c) && isBorderCh(grid[r1][c])) grid[r1][c] = ' ';
      if (inGrid(r2,c) && isBorderCh(grid[r2][c])) grid[r2][c] = ' ';
    }
    for (let r=r1+1; r<r2; r++) {
      if (inGrid(r,c1) && isBorderCh(grid[r][c1])) grid[r][c1] = ' ';
      if (inGrid(r,c2) && isBorderCh(grid[r][c2])) grid[r][c2] = ' ';
    }
  }

  function beginResize(hid) {
    pushHistory();
    resizeComp = componentAt(sel);
    if (resizeComp) {
      // Clear the whole widget: its label moves with the new bounds.
      for (let r = sel.r1; r <= sel.r2; r++)
        for (let c = sel.c1; c <= sel.c2; c++)
          if (inGrid(r, c)) grid[r][c] = ' ';
    } else {
      eraseBoxBorder(sel.r1, sel.c1, sel.r2, sel.c2);
    }
    resizing = true;
    if (hid === 'tl') resizeAnchor = { r: sel.r2, c: sel.c2 };
    if (hid === 'tr') resizeAnchor = { r: sel.r2, c: sel.c1 };
    if (hid === 'bl') resizeAnchor = { r: sel.r1, c: sel.c2 };
    if (hid === 'br') resizeAnchor = { r: sel.r1, c: sel.c1 };
    canvas.style.cursor = (hid === 'tl' || hid === 'br') ? 'nwse-resize' : 'nesw-resize';
  }

  function resizeLabel() {
    return resizeComp?.parts?.[0]?.text ?? BUTTON_LABEL;
  }

  function updateResizePreview(r, c) {
    if (!resizing) return;
    const a = resizeAnchor;
    const nr1 = Math.min(a.r, r), nr2 = Math.max(a.r, r);
    const nc1 = Math.min(a.c, c), nc2 = Math.max(a.c, c);
    prevGrid = mkGrid();
    if (resizeComp) drawButton(prevGrid, nr1, nc1, nr2, nc2, resizeLabel());
    else drawBoxInto(prevGrid, nr1, nc1, nr2, nc2);
    sel = { r1: nr1, c1: nc1, r2: nr2, c2: nc2 };
    render();
  }

  function commitResize() {
    if (!resizing) return;
    if (resizeComp) {
      const drawn = drawButton(grid, sel.r1, sel.c1, sel.r2, sel.c2, resizeLabel());
      Object.assign(resizeComp, drawn);
      sel = { r1: drawn.r1, c1: drawn.c1, r2: drawn.r2, c2: drawn.c2 };
    } else {
      drawBoxInto(grid, sel.r1, sel.c1, sel.r2, sel.c2);
    }
    resizing = false;
    resizeComp = null;
    resizeAnchor = null;
    prevGrid = null;
    canvas.style.cursor = cursorForTool(tool);
    render();
  }

  // ══════════════════════════════════════════
  //  Move (drag) selection
  // ══════════════════════════════════════════
  function beginMove(r, c) {
    if (!sel) return;
    moving = true;
    moveStart = { r, c };
    // Snapshot cells under sel
    moveSnap = { r1: sel.r1, c1: sel.c1, r2: sel.r2, c2: sel.c2, cells: [] };
    for (let rr = sel.r1; rr <= sel.r2; rr++) {
      const row = [];
      for (let cc = sel.c1; cc <= sel.c2; cc++) {
        row.push(inGrid(rr, cc) ? grid[rr][cc] : ' ');
      }
      moveSnap.cells.push(row);
    }
    // Erase the original area; the preview redraws it via prevGrid
    pushHistory();
    for (let rr = moveSnap.r1; rr <= moveSnap.r2; rr++)
      for (let cc = moveSnap.c1; cc <= moveSnap.c2; cc++)
        if (inGrid(rr, cc)) grid[rr][cc] = ' ';
    canvas.style.cursor = 'grabbing';
  }

  function updateMovePreview(r, c) {
    if (!moving) return;
    const dr = r - moveStart.r;
    const dc = c - moveStart.c;
    prevGrid = mkGrid();
    for (let i = 0; i < moveSnap.cells.length; i++) {
      for (let j = 0; j < moveSnap.cells[i].length; j++) {
        const ch = moveSnap.cells[i][j];
        if (ch === ' ') continue;
        const nr = moveSnap.r1 + dr + i;
        const nc = moveSnap.c1 + dc + j;
        if (inGrid(nr, nc)) prevGrid[nr][nc] = ch;
      }
    }
    sel = {
      r1: moveSnap.r1 + dr, c1: moveSnap.c1 + dc,
      r2: moveSnap.r2 + dr, c2: moveSnap.c2 + dc,
    };
    render();
  }

  function commitMove(r, c) {
    if (!moving) return;
    const dr = r - moveStart.r;
    const dc = c - moveStart.c;
    for (let i = 0; i < moveSnap.cells.length; i++) {
      for (let j = 0; j < moveSnap.cells[i].length; j++) {
        const ch = moveSnap.cells[i][j];
        if (ch === ' ') continue;
        const nr = moveSnap.r1 + dr + i;
        const nc = moveSnap.c1 + dc + j;
        if (inGrid(nr, nc)) grid[nr][nc] = ch;
      }
    }
    // Shift component bounds + parts that were fully inside the moved region
    if (dr !== 0 || dc !== 0) {
      const shiftedComps = new Set();
      for (const co of components) {
        if (co.r1 >= moveSnap.r1 && co.r2 <= moveSnap.r2 &&
            co.c1 >= moveSnap.c1 && co.c2 <= moveSnap.c2) {
          co.r1 += dr; co.r2 += dr; co.c1 += dc; co.c2 += dc;
          for (const p of co.parts) { p.r += dr; p.c1 += dc; p.c2 += dc; }
          shiftedComps.add(co);
        }
      }
      // Orphan parts (component itself didn't shift, but a single part did)
      for (const co of components) {
        if (shiftedComps.has(co)) continue;
        for (const p of co.parts) {
          if (p.r >= moveSnap.r1 && p.r <= moveSnap.r2 &&
              p.c1 >= moveSnap.c1 && p.c2 <= moveSnap.c2) {
            p.r += dr; p.c1 += dc; p.c2 += dc;
          }
        }
      }
    }
    moving = false;
    moveSnap = null;
    moveStart = null;
    prevGrid = null;
    canvas.style.cursor = cursorForTool(tool);
    render();
  }

  // ══════════════════════════════════════════
  //  Clipboard (copy / paste)
  // ══════════════════════════════════════════
  async function copySelection() {
    if (!sel) return;
    internalClip = [];
    const lines = [];
    for (let r = sel.r1; r <= sel.r2; r++) {
      const row = [];
      for (let c = sel.c1; c <= sel.c2; c++) {
        row.push(inGrid(r, c) ? grid[r][c] : ' ');
      }
      internalClip.push(row);
      lines.push(row.filter((ch) => ch !== CONT).join('').replace(/\s+$/, ''));
    }
    try { await navigator.clipboard.writeText(lines.join('\n')); } catch { /* clipboard blocked */ }
    onToast?.('복사됨');
  }

  async function pasteClipboard() {
    let cells = internalClip;
    let fromOS = false;
    if (!cells) {
      try {
        const text = await navigator.clipboard.readText();
        if (!text) { onToast?.('붙여넣을 내용이 없어요'); return; }
        cells = text.split('\n').map((line) => [...line]);
        fromOS = true;
      } catch { onToast?.('붙여넣기 실패'); return; }
    }
    if (!cells.length) return;

    // Paste origin: top-left of current selection, else last insertion position
    const pr = sel ? sel.r1 : insPos.r;
    const pc = sel ? sel.c1 : insPos.c;

    pushHistory();

    if (fromOS) {
      // Re-flow line by line so wide chars take 2 grid cells correctly
      for (let i = 0; i < cells.length; i++) {
        let col = pc;
        for (const ch of cells[i]) {
          if (pr + i >= ROWS || col >= COLS) break;
          const u = placeChar(grid, pr + i, col, ch);
          if (!u) break;
          col += u;
        }
      }
    } else {
      // Preserve exact spatial layout from copy
      for (let i = 0; i < cells.length; i++) {
        for (let j = 0; j < cells[i].length; j++) {
          const ch = cells[i][j];
          if (ch === ' ' || ch === CONT) continue;
          if (pr + i >= ROWS || pc + j >= COLS) continue;
          placeChar(grid, pr + i, pc + j, ch);
        }
      }
    }

    // Select pasted region
    const h = cells.length;
    const w = Math.max(...cells.map((r) => r.length));
    sel = {
      r1: pr, c1: pc,
      r2: Math.min(ROWS - 1, pr + h - 1),
      c2: Math.min(COLS - 1, pc + w - 1),
    };
    render();
    onToast?.('붙여넣음');
  }

  function deleteSel() {
    if (!sel) return;
    pushHistory();
    for (let r=sel.r1; r<=sel.r2; r++)
      for (let c=sel.c1; c<=sel.c2; c++)
        if (inGrid(r,c)) grid[r][c] = ' ';
    // Drop components fully contained in the deleted region
    components = components.filter((co) =>
      !(co.r1 >= sel.r1 && co.r2 <= sel.r2 && co.c1 >= sel.c1 && co.c2 <= sel.c2)
    );
    sel = null;
    render();
    onToast?.('삭제됨');
  }

  // ══════════════════════════════════════════
  //  History
  // ══════════════════════════════════════════
  function pushHistory() {
    histStack.push(cloneGrid(grid));
    if (histStack.length > 80) histStack.shift();
  }

  function undo() {
    if (!histStack.length) return;
    grid = histStack.pop();
    sel = null;
    render();
    onToast?.('되돌림');
  }

  // ══════════════════════════════════════════
  //  Tool switching / canvas settings
  // ══════════════════════════════════════════
  function setTool(t) {
    if (!TOOL_META[t]) return;
    if (t !== 'text' && tbOrigin) commitTextbox();
    tool = t;
    sel = null;
    canvas.style.cursor = cursorForTool(t);
    emit({ tool: t });
    render();
  }

  function resize(cols, rows) {
    if (!cols || !rows) return;
    pushHistory();
    const prev = cloneGrid(grid);
    COLS = cols; ROWS = rows;
    grid = mkGrid();
    for (let r=0; r<Math.min(prev.length, ROWS); r++)
      for (let c=0; c<Math.min(prev[r].length, COLS); c++)
        grid[r][c] = prev[r][c];
    canvas.width  = COLS * CW;
    canvas.height = ROWS * CH;
    emit({ size: `${COLS}x${ROWS}` });
    render();
  }

  function setShowGrid(next) {
    showGrid = next;
    emit({ showGrid });
    render();
  }

  // ══════════════════════════════════════════
  //  Export / clear
  // ══════════════════════════════════════════
  async function copyText() {
    const lines = grid.map((row) => row.filter((ch) => ch !== CONT).join('').replace(/\s+$/, ''));
    while (lines.length && !lines[lines.length-1]) lines.pop();
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      onToast?.('복사됨!');
    } catch { onToast?.('복사 실패'); }
  }

  function clearAll() {
    pushHistory();
    grid = mkGrid();
    components = [];
    insPos = { r: 2, c: 2 };
    sel = null;
    cancelTextbox();
    render();
  }

  // ══════════════════════════════════════════
  //  Wiring
  // ══════════════════════════════════════════
  canvas.addEventListener('mousedown', onMouseDown);
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('mouseup', onMouseUp);
  canvas.addEventListener('dblclick', onDblClick);
  canvas.addEventListener('mouseleave', onMouseLeave);
  wrap.addEventListener('wheel', onWheel, { passive: false });
  textbox.addEventListener('mousedown', onTextboxMouseDown);
  textbox.addEventListener('input', autoSizeTextbox);
  textbox.addEventListener('keydown', onTextboxKeyDown);
  textbox.addEventListener('blur', onTextboxBlur);
  root.addEventListener('keydown', onKeyDown);
  root.addEventListener('keyup', onKeyUp);

  canvas.style.cursor = cursorForTool(tool);
  render();

  return {
    setTool,
    undo,
    copyText,
    clearAll,
    resize,
    setShowGrid,
    resetZoom,
    destroy() {
      canvas.removeEventListener('mousedown', onMouseDown);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('dblclick', onDblClick);
      canvas.removeEventListener('mouseleave', onMouseLeave);
      wrap.removeEventListener('wheel', onWheel);
      textbox.removeEventListener('mousedown', onTextboxMouseDown);
      textbox.removeEventListener('input', autoSizeTextbox);
      textbox.removeEventListener('keydown', onTextboxKeyDown);
      textbox.removeEventListener('blur', onTextboxBlur);
      root.removeEventListener('keydown', onKeyDown);
      root.removeEventListener('keyup', onKeyUp);
    },
  };
}
