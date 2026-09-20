// Jev는 그림을 볼 수 없다. 텍스트만 읽는 모델이라, 캔버스를 그대로 보낼 수는
// 없다. 그래서 브라우저가 먼저 획을 "재고", 그 숫자만 state로 올려 보낸다.
// 재는 일은 코드가 하고, 그 숫자가 고양이처럼 보이는지 판단하는 일은 Jev가
// 한다 — 이 페이지가 내내 설명해 온 역할 나누기가 여기서 그대로 쓰인다.
//
// 이 파일은 DOM을 건드리지 않는 순수 함수만 둔다. 입력은 0~1로 정규화된
// 획 배열([[{x, y}, ...], ...])이고, 출력은 작은 숫자들로만 이루어진 객체다.
// 필드 이름은 Jev가 읽는 글이기도 하므로 한글로 또박또박 적는다.

const GRID = 6; // 잉크 격자 한 변의 칸 수
const COLUMNS = 32; // 위쪽 윤곽을 훑을 세로 띠의 개수
const RASTER = 48; // 둘러싸인 영역을 찾을 때 쓰는 격자 한 변의 칸 수

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

// 한 획이 지나간 실제 길이. 끝점 사이 거리와 비교하면 그 획이 곧은 선인지
// 휘어진 선인지 알 수 있다.
function pathLength(stroke) {
  let total = 0;
  for (let i = 1; i < stroke.length; i += 1) {
    total += distance(stroke[i - 1], stroke[i]);
  }
  return total;
}

function boundingBox(points) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }

  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
}

function round(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

// 그림 전체를 감싸는 사각형 안에서의 좌표(0~1)로 바꾼다. 캔버스 어디에
// 그렸는지, 얼마나 크게 그렸는지는 "고양이인가"와 상관이 없기 때문이다.
function toBoxSpace(points, box) {
  // 한 점만 찍었거나 완전한 가로선이면 변의 길이가 0이 된다. 0으로 나누지
  // 않도록 아주 작은 값으로 바닥을 깐다.
  const w = Math.max(box.width, 1e-6);
  const h = Math.max(box.height, 1e-6);
  return points.map((p) => ({
    x: (p.x - box.minX) / w,
    y: (p.y - box.minY) / h,
  }));
}

// 점과 점 사이를 채워 선으로 만든다. 사람이 손으로 그으면 좌표가 촘촘히
// 들어오지만, 빠르게 그은 직선은 끝점 두 개만 남기도 한다. 그대로 두면
// 잉크 격자와 위쪽 윤곽에 실제로는 선이 지나간 자리가 구멍으로 남는다.
function densify(stroke) {
  const dense = [stroke[0]];

  for (let i = 1; i < stroke.length; i += 1) {
    const from = stroke[i - 1];
    const to = stroke[i];
    const steps = Math.ceil(distance(from, to) / 0.01);
    for (let s = 1; s <= steps; s += 1) {
      dense.push({
        x: from.x + ((to.x - from.x) * s) / steps,
        y: from.y + ((to.y - from.y) * s) / steps,
      });
    }
  }

  return dense;
}

// 칸마다 점이 몇 개 지나갔는지를 0~9로 눌러 담은 격자. 어디에 선이 몰려
// 있는지를 Jev가 한눈에 읽을 수 있는 유일한 형태다.
function inkGrid(boxPoints) {
  const counts = Array.from({ length: GRID }, () => Array(GRID).fill(0));

  for (const p of boxPoints) {
    // 경계값 1이 격자 밖(index 6)으로 나가지 않도록 마지막 칸에 붙인다.
    const col = Math.min(GRID - 1, Math.floor(p.x * GRID));
    const row = Math.min(GRID - 1, Math.floor(p.y * GRID));
    counts[row][col] += 1;
  }

  const busiest = Math.max(1, ...counts.flat());
  return counts.map((row) => row.map((n) => Math.round((n / busiest) * 9)));
}

// 격자를 좌우로 뒤집어 자기 자신과 비교한다. 고양이 얼굴처럼 좌우가 닮은
// 그림은 1에 가깝고, 한쪽으로 쏠린 낙서는 0에 가깝다.
function symmetry(grid) {
  let difference = 0;
  let total = 0;

  for (const row of grid) {
    for (let col = 0; col < GRID; col += 1) {
      const mirrored = row[GRID - 1 - col];
      difference += Math.abs(row[col] - mirrored);
      total += row[col] + mirrored;
    }
  }

  if (total === 0) return 0;
  return 1 - difference / total;
}

// 둘러싸인 영역을 찾는다. 처음에는 "한 획의 시작점과 끝점이 가까우면 고리"로
// 셌는데, 그러면 윤곽선 하나와 귀 두 개로 그린 고양이 얼굴이 고리 0개가 된다.
// 사람 눈에는 분명히 닫힌 얼굴인데도 그렇다. 그래서 획을 격자에 찍어 벽으로
// 삼고, 바깥에서 물을 부어 잠기지 않은 칸을 센다. 여러 획이 함께 둘러싼
// 영역도 이렇게 하면 잡힌다.
function rasterize(boxPoints) {
  // 테두리를 두 칸 비워 둔다. 한 칸만 두었더니, 그림 가장자리에 닿은 획이
  // 아래에서 부풀려질 때 테두리까지 막아 버려 바깥 여백이 "둘러싸인 영역"으로
  // 잡혔다. X자 낙서가 영역 3개를 가진 이유가 그것이었다.
  const MARGIN = 2;
  const size = RASTER + MARGIN * 2;
  const wall = Array.from({ length: size }, () => Array(size).fill(false));

  for (const p of boxPoints) {
    const col = Math.min(RASTER - 1, Math.floor(p.x * RASTER)) + MARGIN;
    const row = Math.min(RASTER - 1, Math.floor(p.y * RASTER)) + MARGIN;
    // 손으로 그은 선은 획과 획 사이가 한두 칸씩 벌어진다. 벽을 한 칸씩
    // 부풀려 그 틈을 메우지 않으면 물이 새어 얼굴 안쪽까지 잠겨 버린다.
    for (let dr = -1; dr <= 1; dr += 1) {
      for (let dc = -1; dc <= 1; dc += 1) {
        wall[row + dr][col + dc] = true;
      }
    }
  }

  // 바깥에서 물 붓기.
  const outside = Array.from({ length: size }, () => Array(size).fill(false));
  const queue = [[0, 0]];
  outside[0][0] = true;
  while (queue.length > 0) {
    const [r, c] = queue.pop();
    for (const [dr, dc] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr < 0 || nc < 0 || nr >= size || nc >= size) continue;
      if (outside[nr][nc] || wall[nr][nc]) continue;
      outside[nr][nc] = true;
      queue.push([nr, nc]);
    }
  }

  return { wall, outside, size };
}

// 둘러싸인 덩어리의 수와, 그중 가장 큰 것이 차지하는 넓이.
function enclosedRegions(raster) {
  const { wall, outside, size } = raster;

  // 잠기지 않고 남은 칸들을 덩어리별로 묶는다.
  const seen = Array.from({ length: size }, () => Array(size).fill(false));
  const sizes = [];
  for (let r = 0; r < size; r += 1) {
    for (let c = 0; c < size; c += 1) {
      if (seen[r][c] || wall[r][c] || outside[r][c]) continue;

      let area = 0;
      const stack = [[r, c]];
      seen[r][c] = true;
      while (stack.length > 0) {
        const [cr, cc] = stack.pop();
        area += 1;
        for (const [dr, dc] of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ]) {
          const nr = cr + dr;
          const nc = cc + dc;
          if (nr < 0 || nc < 0 || nr >= size || nc >= size) continue;
          if (seen[nr][nc] || wall[nr][nc] || outside[nr][nc]) continue;
          seen[nr][nc] = true;
          stack.push([nr, nc]);
        }
      }
      sizes.push(area);
    }
  }

  // 선 굵기 때문에 생기는 자잘한 빈틈은 영역이라 부르지 않는다. 격자 전체의
  // 1%는 되어야 사람이 "안쪽"이라고 부를 만한 넓이다.
  const real = sizes.filter((area) => area >= RASTER * RASTER * 0.01);
  real.sort((a, b) => b - a);

  return {
    count: real.length,
    largestShare: round((real[0] ?? 0) / (RASTER * RASTER)),
  };
}

// 곧은 획의 수. 수염 후보다. 길이 기준을 그림 전체 대각선에 걸어 두었더니,
// 몸통까지 그린 고양이에서는 수염이 "너무 짧은 선"으로 밀려나 0개가 되었다.
// 그래서 잣대를 획들의 중간 길이로 바꾼다. 그림이 커지면 잣대도 같이 커지니
// 얼굴만 그리든 전신을 그리든 같은 뜻으로 읽힌다.
function straightStrokeCount(boxStrokes) {
  const lengths = boxStrokes.map(pathLength).sort((a, b) => a - b);
  const median = lengths[Math.floor(lengths.length / 2)];
  // 눈·코처럼 아주 짧은 점획은 빼되, 기준을 중간 길이의 1/4로 낮게 둔다.
  const floor = Math.max(median * 0.25, 0.02);

  return boxStrokes.filter((stroke) => {
    const length = pathLength(stroke);
    if (length < floor) return false;
    const straightness =
      distance(stroke[0], stroke[stroke.length - 1]) / Math.max(length, 1e-6);
    return straightness > 0.85;
  }).length;
}

// 그림의 위쪽 윤곽을 세로 띠로 훑어 내려, 뾰족하게 솟은 지점의 수를 센다.
// 고양이 귀 두 개를 그렸다면 여기서 2가 나오기를 기대한다.
function topSpikeCount(boxPoints) {
  const top = Array(COLUMNS).fill(Infinity);

  for (const p of boxPoints) {
    const col = Math.min(COLUMNS - 1, Math.floor(p.x * COLUMNS));
    if (p.y < top[col]) top[col] = p.y;
  }

  // 그림 바깥에는 선이 없으니, 윤곽은 거기서 바닥까지 떨어진 셈으로 본다.
  // 이렇게 두지 않으면 귀가 그림의 좌우 맨 끝에 놓인 그림에서 귀를 놓친다.
  const topAt = (j) => (j < 0 || j >= COLUMNS ? 1 : top[j]);

  // 한 봉우리가 얼마나 솟았는지는, 양옆으로 내려가다 만나는 가장 낮은 골의
  // 깊이로 잰다. 한쪽으로만 솟은 것은 봉우리가 아니라 그림의 끝자락이다.
  const candidates = [];
  for (let i = 0; i < COLUMNS; i += 1) {
    if (!Number.isFinite(top[i])) continue;

    let left = -Infinity;
    for (let j = i - 3; j < i; j += 1) {
      const value = topAt(j);
      if (Number.isFinite(value) && value > left) left = value;
    }

    let right = -Infinity;
    for (let j = i + 1; j <= i + 3; j += 1) {
      const value = topAt(j);
      if (Number.isFinite(value) && value > right) right = value;
    }

    if (!Number.isFinite(left) || !Number.isFinite(right)) continue;

    const prominence = Math.min(left, right) - top[i];
    // 전신을 그리면 귀는 그림 높이의 10%도 되지 않는다. 0.08에서는 그런
    // 귀가 통째로 묻혔다.
    if (prominence > 0.04) candidates.push({ index: i, prominence });
  }

  // 뾰족한 끝은 띠 두어 개에 걸쳐 나타난다. 가장 높이 솟은 것부터 집고,
  // 그 옆에 붙은 후보는 같은 봉우리로 보아 버린다.
  candidates.sort((a, b) => b.prominence - a.prominence);
  const peaks = [];
  for (const candidate of candidates) {
    if (peaks.some((taken) => Math.abs(taken - candidate.index) <= 3)) continue;
    peaks.push(candidate.index);
  }

  return peaks.length;
}

// 획 배열 하나를 Jev에게 보낼 state로 바꾼다. 그릴 것이 없으면 null을
// 돌려주어, 호출하는 쪽이 요청 자체를 건너뛸 수 있게 한다.
export function extractFeatures(strokes) {
  const usable = strokes.filter((stroke) => stroke.length >= 2);
  if (usable.length === 0) return null;

  const box = boundingBox(usable.flat());
  // 격자와 위쪽 윤곽은 "선이 지나간 자리"를 보는 것이므로, 꼭짓점만이 아니라
  // 그 사이까지 채운 점들을 쓴다.
  const boxStrokes = usable.map((stroke) => densify(toBoxSpace(stroke, box)));
  const boxPoints = boxStrokes.flat();
  const grid = inkGrid(boxPoints);
  const inked = grid.flat().filter((n) => n > 0).length;
  const raster = rasterize(boxPoints);
  const enclosed = enclosedRegions(raster);
  const straight = straightStrokeCount(boxStrokes);

  return {
    획수: usable.length,
    가로세로비: round(box.width / Math.max(box.height, 1e-6)),
    잉크비율: round(inked / (GRID * GRID)),
    닫힌영역수: enclosed.count,
    가장큰닫힌영역비율: enclosed.largestShare,
    위쪽뾰족돌출수: topSpikeCount(boxPoints),
    곧은획수: straight,
    좌우대칭도: round(symmetry(grid)),
    잉크격자: grid,
  };
}

// 화면 아래 한 줄로 "코드가 무엇을 재서 보냈는지" 보여 줄 때 쓴다.
// 격자는 줄글로 읽히지 않으므로 여기서는 뺀다.
export function describeFeatures(features) {
  if (!features) return '';

  return [
    `획 ${features.획수}개`,
    `가로세로비 ${features.가로세로비}`,
    `닫힌 영역 ${features.닫힌영역수}`,
    `뾰족한 돌출 ${features.위쪽뾰족돌출수}`,
    `곧은 획 ${features.곧은획수}`,
    `좌우대칭도 ${features.좌우대칭도}`,
  ].join(' · ');
}
