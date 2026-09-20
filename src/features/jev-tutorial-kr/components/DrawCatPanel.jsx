import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Button,
  Grid,
  Group,
  Paper,
  Stack,
  Tabs,
  Text,
  UnstyledButton,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import ChoicePanel from './ChoicePanel';
import NoulPanel from './NoulPanel';
import ScorePanel from './ScorePanel';
import classes from './Dashboard.module.css';
import { createDrawingPad } from '../drawing/engine';
import { describeFeatures, extractFeatures } from '../drawing/features';
import {
  buildQuestions,
  DRAWING_QUESTIONS,
  questionForDisplay,
} from '../data/drawingQuestions';

const MIN_STROKES = 2;

// 한 번 묻고 나면 3초 동안 버튼을 잠근다. 버튼을 연타해도 호출이 그만큼
// 나가지는 않게 하려는 것이다. 다만 이것은 화면에 건 자물쇠일 뿐이라,
// /api/jev로 직접 쏘는 요청까지 막아 주지는 않는다.
const COOLDOWN_MS = 3000;

// 응답을 위 대시보드가 쓰는 모양으로 맞춘다. HTTP 문서와 SDK가 Noul을 각각
// `noul`과 `answer`로 적고 있어, 둘 다 받아 준다. 이 한 겹 덕분에 패널 세
// 개는 고정 샘플을 읽을 때와 똑같은 코드로 진짜 응답을 그린다.
function normalize(answers) {
  const noul = (raw) => ({
    type: 'noul',
    noul: typeof raw?.noul === 'number' ? raw.noul : (raw?.answer ?? 0),
  });

  return {
    subject: {
      type: 'choice',
      choice: answers.subject.choice,
      confidence: answers.subject.confidence ?? 0,
      probabilities: answers.subject.probabilities ?? {},
    },
    catness: {
      type: 'score',
      score: answers.catness.score,
      confidence: answers.catness.confidence ?? 0,
      legend: DRAWING_QUESTIONS.catness.legend,
      probabilities: answers.catness.probabilities ?? {},
    },
    ears: noul(answers.ears),
    whiskers: noul(answers.whiskers),
  };
}

export default function DrawCatPanel() {
  const canvasRef = useRef(null);
  const padRef = useRef(null);

  const [strokes, setStrokes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [showPayload, { toggle: togglePayload }] = useDisclosure(false);
  // 다시 누를 수 있게 되는 시각. 남은 초는 여기서 파생시킨다.
  const [readyAt, setReadyAt] = useState(0);
  const [cooldown, setCooldown] = useState(0);
  // 진짜 자물쇠는 이 ref다. 버튼의 disabled는 상태가 반영된 뒤에야 걸리는데,
  // React는 상태 변경을 모아서 처리하므로 한 번의 흐름 안에서 연달아 들어온
  // 클릭은 모두 disabled=false인 버튼을 누른 셈이 된다. 실제로 20번 연타하니
  // 요청이 20번 나갔다. ref는 그 자리에서 바뀌므로 두 번째 클릭부터 막힌다.
  const gateRef = useRef({ busy: false, readyAt: 0 });

  // 캔버스와 포인터 이벤트는 engine.js가 통째로 맡는다. React는 획이 끝났을
  // 때만 소식을 듣는다.
  useEffect(() => {
    const pad = createDrawingPad({
      canvas: canvasRef.current,
      onStrokesChange: setStrokes,
    });
    padRef.current = pad;
    return () => pad.destroy();
  }, []);

  // 남은 시간을 0.2초마다 다시 재어 화면의 초를 줄여 간다. setTimeout 한 번으로
  // 끝내지 않는 것은, 탭이 뒤로 갔다 오거나 시계가 튀어도 실제 남은 시간을
  // 보여 주기 위해서다.
  useEffect(() => {
    if (readyAt === 0) return undefined;

    const tick = () => {
      const left = readyAt - Date.now();
      if (left <= 0) {
        setReadyAt(0);
        setCooldown(0);
        return;
      }
      setCooldown(Math.ceil(left / 1000));
    };

    tick();
    const timer = setInterval(tick, 200);
    return () => clearInterval(timer);
  }, [readyAt]);

  const features = useMemo(() => extractFeatures(strokes), [strokes]);
  const enough = strokes.length >= MIN_STROKES && features !== null;
  const locked = loading || cooldown > 0;

  async function askJev() {
    // 화면을 건드리기 전에 먼저 문을 닫는다. 이 두 줄이 연타를 막는 전부다.
    const gate = gateRef.current;
    if (gate.busy || Date.now() < gate.readyAt) return;
    gate.busy = true;

    setLoading(true);
    setError(null);

    try {
      // 브라우저는 잰 숫자만 보낸다. 질문과 키는 서버가 쥐고 있다.
      const response = await fetch('/api/jev', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ features }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error ?? '요청이 실패했다.');

      setResult({
        answers: normalize(body.answers),
        raw: body,
        features,
      });
    } catch (e) {
      // 앞선 답은 지우지 않는다. 화면이 비면 무엇과 비교하던 중이었는지
      // 알 수 없게 된다.
      setError(e.message);
    } finally {
      // 성공이든 실패든 한 번 나간 뒤에는 잠근다. 실패했을 때만 열어 두면
      // 오류를 만난 사람이 곧장 연타하게 된다.
      const until = Date.now() + COOLDOWN_MS;
      gate.busy = false;
      gate.readyAt = until;

      setLoading(false);
      setReadyAt(until);
    }
  }

  return (
    <>
      <Paper
        bg="var(--wf-surface)"
        radius="lg"
        p={{ base: 'md', sm: 'lg' }}
        withBorder
        className={classes.card}
        style={{ borderColor: 'var(--wf-hairline)' }}
      >
        <Text fw={700} c="ink.8" mb={4}>
          직접 그려보기
        </Text>
        {/* 획이 모자라면 버튼이 잠긴다는 사실을 눌러 보고 나서야 알면 늦다.
            조건을 처음부터 말해 두고, 아래 안내는 아직 모자랄 때만 덧붙인다. */}
        <Text size="sm" c="ink.5" mb="md">
          <b>고양이를 그려보자.</b> 획을 <b>{MIN_STROKES}개 이상</b> 그려야
          Jev에게 물어볼 수 있다. 다 그렸으면 &ldquo;Jev 평가받기&rdquo;를
          누른다. 귀를 붙이고 다시 누르고, 수염을 더하고 또 눌러 보면 같은
          질문의 답이 어떻게 움직이는지 볼 수 있다.
        </Text>

        <Grid gutter={{ base: 'md', sm: 'lg' }}>
          <Grid.Col span={{ base: 12, md: 7 }}>
            <canvas ref={canvasRef} className={classes.pad} />
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 5 }}>
            <Stack gap="sm">
              <Group gap="xs">
                <Button
                  color="accent"
                  radius="md"
                  onClick={askJev}
                  loading={loading}
                  disabled={!enough || locked}
                >
                  Jev 평가받기
                </Button>
                <Button
                  variant="default"
                  radius="md"
                  onClick={() => padRef.current?.undo()}
                  disabled={strokes.length === 0}
                >
                  한 획 되돌리기
                </Button>
                <Button
                  variant="subtle"
                  color="ink"
                  radius="md"
                  onClick={() => {
                    padRef.current?.clear();
                    setResult(null);
                    setError(null);
                  }}
                  disabled={strokes.length === 0}
                >
                  지우기
                </Button>
              </Group>

              {!enough ? (
                <Text size="xs" c="ink.4">
                  조금 더 그려보자. 획이 {MIN_STROKES}개는 되어야 보낼 것이
                  생긴다.
                </Text>
              ) : cooldown > 0 ? (
                <Text size="xs" c="ink.4">
                  너무 자주 묻지 않도록 {COOLDOWN_MS / 1000}초에 한 번만 보낸다.{' '}
                  {cooldown}초 뒤에 다시 누를 수 있다.
                </Text>
              ) : null}

              {error ? (
                <Text size="xs" c="ink.4">
                  물어보지 못했다 · {error}
                </Text>
              ) : null}

              {/* 코드와 모델이 갈리는 지점을 눈에 보이게 둔다: 왼쪽 그림에서
                  이 숫자들까지가 브라우저의 몫이고, 그다음부터가 Jev의 몫이다. */}
              <Stack gap={4}>
                <Text size="xs" fw={600} c="ink.6">
                  코드가 재어 보낼 값
                </Text>
                <Text size="xs" c="ink.4" className={classes.featureLine}>
                  {features ? describeFeatures(features) : '아직 없음'}
                </Text>
              </Stack>

              <Text size="xs" c="ink.4">
                Jev는 그림을 보지 못한다. 텍스트만 읽는 모델이라, 캔버스 대신 위
                숫자가 올라간다. 재는 일은 코드가, 그 숫자가 고양이처럼 보이는지
                판단하는 일은 Jev가 한다.
              </Text>
            </Stack>
          </Grid.Col>
        </Grid>

        {result ? (
          <Box
            pt="xs"
            mt="md"
            style={{ borderTop: '1px solid var(--wf-hairline)' }}
          >
            <UnstyledButton
              onClick={togglePayload}
              w="100%"
              aria-expanded={showPayload}
            >
              <Group justify="space-between" wrap="nowrap" gap="xs">
                <Text size="xs" c="ink.6" fw={600}>
                  실제로 오간 요청과 응답
                </Text>
                <Text size="xs" c="ink.5">
                  {showPayload ? '접기 ▲' : '펼치기 ▼'}
                </Text>
              </Group>
            </UnstyledButton>

            {showPayload ? (
              <Tabs
                defaultValue="request"
                variant="pills"
                color="accent"
                radius="md"
                pt="sm"
              >
                <Tabs.List mb="sm">
                  <Tabs.Tab value="request">보낸 요청</Tabs.Tab>
                  <Tabs.Tab value="response">받은 응답</Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="request">
                  <pre className={classes.code}>
                    {JSON.stringify(
                      {
                        model: 'jev-latest',
                        state: { 측정값: result.features },
                        questions: buildQuestions(),
                      },
                      null,
                      2,
                    )}
                  </pre>
                </Tabs.Panel>

                <Tabs.Panel value="response">
                  <pre className={classes.code}>
                    {JSON.stringify(result.raw, null, 2)}
                  </pre>
                </Tabs.Panel>
              </Tabs>
            ) : null}
          </Box>
        ) : null}
      </Paper>

      {result ? (
        <Grid
          gutter={{ base: 'md', sm: 'lg' }}
          align="stretch"
          className={loading ? classes.pending : undefined}
        >
          <Grid.Col span={{ base: 12, md: 6 }}>
            <ChoicePanel
              answer={result.answers.subject}
              question={questionForDisplay('subject')}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <ScorePanel
              answer={result.answers.catness}
              question={questionForDisplay('catness')}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <NoulPanel
              answer={result.answers.ears}
              question={questionForDisplay('ears')}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <NoulPanel
              answer={result.answers.whiskers}
              question={questionForDisplay('whiskers')}
            />
          </Grid.Col>
        </Grid>
      ) : null}
    </>
  );
}
