// 손으로 긋는 획은 React의 상태로 다루기에 너무 잦다. 포인터가 움직일 때마다
// 리렌더를 시키는 대신, 캔버스와 이벤트는 이 파일이 통째로 맡고 React에는
// "획 하나가 끝났다"는 사실만 알린다. tools/catalog/ascii-sketchbook/engine.js와
// 같은 방식이다: create*() 팩토리가 destroy()를 가진 객체를 돌려준다.

const LINE_WIDTH = 3;
const STROKE_COLOR = '#2d3238'; // ink.8 — CSS 변수는 캔버스에서 못 읽는다

export function createDrawingPad({ canvas, onStrokesChange }) {
  const ctx = canvas.getContext('2d');

  // 획은 0~1로 정규화해 쌓는다. 캔버스가 화면 폭에 따라 달라지고 확대/축소도
  // 있으므로, 픽셀 좌표를 그대로 두면 같은 그림이 기기마다 다른 숫자가 된다.
  let strokes = [];
  let current = null;
  let activePointer = null;

  // 백킹 스토어를 CSS 크기 × 픽셀 비율로 맞춘다. 이걸 빼면 고해상도 화면에서
  // 선이 뭉개진다. 크기가 바뀌면 그리던 내용이 지워지므로 곧바로 다시 그린다.
  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const ratio = window.devicePixelRatio || 1;
    const width = Math.round(rect.width * ratio);
    const height = Math.round(rect.height * ratio);
    if (canvas.width === width && canvas.height === height) return;

    canvas.width = width;
    canvas.height = height;
    redraw();
  }

  function redraw() {
    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);
    ctx.lineWidth = LINE_WIDTH * (window.devicePixelRatio || 1);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = STROKE_COLOR;

    for (const stroke of strokes) {
      if (stroke.length === 0) continue;

      ctx.beginPath();
      ctx.moveTo(stroke[0].x * width, stroke[0].y * height);
      for (let i = 1; i < stroke.length; i += 1) {
        ctx.lineTo(stroke[i].x * width, stroke[i].y * height);
      }
      // 점 하나만 찍은 획도 보이도록, 제자리로 한 번 더 이어 준다.
      if (stroke.length === 1) {
        ctx.lineTo(stroke[0].x * width, stroke[0].y * height);
      }
      ctx.stroke();
    }
  }

  function pointFrom(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      // 가장자리를 살짝 넘겨 잡히는 좌표는 0~1 안으로 자른다.
      x: Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height)),
    };
  }

  function publish() {
    // 방어적 복사: 바깥에서 들고 있는 배열을 다음 획이 바꿔 버리면, 무엇을
    // 보냈는지와 화면에 보이는 것이 어긋난다.
    onStrokesChange?.(strokes.map((stroke) => stroke.slice()));
  }

  function onPointerDown(event) {
    if (activePointer !== null) return;
    // 마우스는 왼쪽 버튼만. 펜과 손가락은 button === 0으로 온다.
    if (event.button !== 0) return;

    activePointer = event.pointerId;
    try {
      // 캔버스 밖으로 손이 나가도 획이 끊기지 않게 잡아 둔다. 붙잡을 수 없는
      // 포인터면 예외가 나는데, 그때는 포착 없이 계속 그리면 된다. 여기서
      // 터지게 두면 획이 시작도 못 한 채 펜이 물려 버린다.
      canvas.setPointerCapture(event.pointerId);
    } catch {
      /* 포착은 있으면 좋은 것이지, 없으면 안 되는 것이 아니다. */
    }
    current = [pointFrom(event)];
    strokes.push(current);
    event.preventDefault();
  }

  function onPointerMove(event) {
    if (event.pointerId !== activePointer || !current) return;

    const point = pointFrom(event);
    const last = current[current.length - 1];
    // 손이 멈춰 있는 동안 쏟아지는 좌표는 길이만 늘리고 모양은 바꾸지 않는다.
    if (Math.hypot(point.x - last.x, point.y - last.y) < 0.004) return;

    current.push(point);
    redraw();
  }

  function onPointerUp(event) {
    if (event.pointerId !== activePointer) return;

    activePointer = null;
    current = null;
    redraw();
    // 획이 끝난 이 순간에만 React가 다시 그린다. 버튼의 활성 여부와 "무엇을
    // 보낼지" 미리보기가 여기에 달려 있다.
    publish();
  }

  const observer =
    typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(resize);

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerUp);
  observer?.observe(canvas);
  resize();

  return {
    clear() {
      strokes = [];
      current = null;
      redraw();
      publish();
    },

    undo() {
      strokes.pop();
      redraw();
      publish();
    },

    destroy() {
      observer?.disconnect();
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerUp);
    },
  };
}
