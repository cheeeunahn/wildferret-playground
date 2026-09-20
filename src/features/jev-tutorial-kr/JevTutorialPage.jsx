import { useState } from 'react';
import {
  Anchor,
  Grid,
  Image,
  Paper,
  SegmentedControl,
  Stack,
  Tabs,
  Text,
  Title,
} from '@mantine/core';
import { useDocumentTitle, useMediaQuery } from '@mantine/hooks';
import ChoicePanel from './components/ChoicePanel';
import classes from './components/Dashboard.module.css';
import DrawCatPanel from './components/DrawCatPanel';
import NoulPanel from './components/NoulPanel';
import PayloadPanel from './components/PayloadPanel';
import RoutingPanel from './components/RoutingPanel';
import ScorePanel from './components/ScorePanel';
import { QUESTIONS, SAMPLES } from './data/samples';

// Jev가 어떻게 답하는지 보여 주는 대시보드. 같은 고객 문의 하나를 두고
// Choice·Score·Noul이 각각 무엇을 돌려주는지 나란히 놓는다.
export default function JevTutorialPage() {
  useDocumentTitle("jev tutorial · wildferret's playground");
  const [tab, setTab] = useState('sample');
  const [sampleId, setSampleId] = useState(SAMPLES[0].id);
  const sample = SAMPLES.find((s) => s.id === sampleId) ?? SAMPLES[0];
  // 세 라벨은 한글 문장에 가까워서 좁은 화면에서 한 줄에 들어가지 않는다.
  // 그럴 때는 가로로 욱여넣는 대신 세로로 쌓아 탭 하나하나를 크게 남긴다.
  const stackChoices = useMediaQuery('(max-width: 47.99em)');

  return (
    <Stack gap="lg" className={classes.page}>
      <Paper
        bg="var(--wf-surface)"
        radius="lg"
        p={{ base: 'md', sm: 'lg' }}
        withBorder
        style={{ borderColor: 'var(--wf-hairline)' }}
      >
        <Stack gap="sm">
          {/* The only heading on the page: BareLayout draws no site header. */}
          <Title order={1} c="ink.9" fz={{ base: '1.375rem', sm: '1.625rem' }}>
            Jev 동작 방식 알아보기
          </Title>

          {/* 넓은 화면에서는 그림을 글 옆에 세운다. 세로로 쌓으면 그림
              오른쪽이 통째로 비어 카드가 헐거워진다. */}
          <div className={classes.intro}>
            <Image
              src="/images/jev-output-comparison.webp"
              alt="기존 LLM은 자연어 문장을 반환하고 Jev는 Choice, Score, Noul 형태의 값과 확률을 반환하는 과정을 비교한 그림"
              radius="md"
              loading="eager"
              className={classes.introDiagram}
            />

            <Stack gap="sm" className={classes.introText}>
              <Text size="sm" c="ink.6">
                Jev는 기존 LLM (Claude, ChatGPT 등)과 다르게 텍스트 기반 자연어
                대신 앱에서 바로 쓸 수 있는 <b>값과 확률을 반환한다.</b>
                <br />이 화면에서는 같은 고객 문의를 <b>
                  Choice, Score, Noul
                </b>{' '}
                세 가지 방식으로 분석한다.
              </Text>

              <Text size="sm" c="ink.5">
                <b>고객 문의 예시</b> 탭에서는 문의 유형을 바꿔 결과가 어떻게
                달라지는지 살펴본다. 그 값은 실제 API 응답을 본뜬 예시다.
                <br />
                <b>직접 그려보기</b> 탭에서는 같은 세 가지 방식을 진짜 호출에
                물려, 직접 그린 그림으로 답이 움직이는 것을 본다.
              </Text>

              <Anchor
                href="https://docs.typesafe.ai/primitives.md"
                target="_blank"
                rel="noreferrer"
                size="sm"
              >
                TypeSafe 문서 보기 &rarr;
              </Anchor>
            </Stack>
          </div>
        </Stack>
      </Paper>

      {/* 예시를 읽는 화면과 직접 해 보는 화면은 목적이 달라, 한 줄로 이어
          놓으면 스크롤만 길어진다. 탭으로 나누어 한 번에 하나만 보인다. */}
      {/* pills로 두었더니 고르지 않은 탭이 아무 테두리 없는 맨 글씨로 보여,
          둘 중 하나만 버튼처럼 읽혔다. 밑줄 변형은 두 탭이 같은 무게로 보인다. */}
      <Tabs value={tab} onChange={setTab} color="accent">
        <Tabs.List grow mb="lg">
          <Tabs.Tab value="sample">고객 문의 예시</Tabs.Tab>
          <Tabs.Tab value="draw">직접 그려보기</Tabs.Tab>
        </Tabs.List>

        {/* keepMounted가 기본값이라 숨은 탭도 DOM에 남는다. 그리던 그림과
            받아 둔 답이 탭을 오갈 때 날아가지 않으려면 그래야 한다. */}
        <Tabs.Panel value="sample">
          <Stack gap="lg">
            <Paper
              bg="var(--wf-surface)"
              radius="lg"
              p={{ base: 'md', sm: 'lg' }}
              withBorder
              style={{ borderColor: 'var(--wf-hairline)' }}
            >
              <Stack gap="md">
                <Stack gap={6}>
                  <Text size="sm" fw={600} c="ink.7">
                    입력한 문의
                  </Text>
                  <SegmentedControl
                    value={sampleId}
                    onChange={setSampleId}
                    color="accent"
                    radius="md"
                    size="md"
                    fullWidth
                    orientation={stackChoices ? 'vertical' : 'horizontal'}
                    data={SAMPLES.map((s) => ({ value: s.id, label: s.label }))}
                  />
                </Stack>

                <Stack gap={4}>
                  <Text size="xs" c="ink.4">
                    {sample.ticket.channel}
                  </Text>
                  <Text size="sm" c="ink.8" style={{ lineHeight: 1.7 }}>
                    &ldquo;{sample.ticket.text}&rdquo;
                  </Text>
                </Stack>
              </Stack>
            </Paper>

            <Grid gutter={{ base: 'md', sm: 'lg' }} align="stretch">
              <Grid.Col span={{ base: 12, md: 4 }}>
                <ChoicePanel
                  answer={sample.answers.team}
                  question={QUESTIONS.team}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 4 }}>
                <ScorePanel
                  answer={sample.answers.urgency}
                  question={QUESTIONS.urgency}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 4 }}>
                <NoulPanel
                  answer={sample.answers.wants_human}
                  question={QUESTIONS.wants_human}
                />
              </Grid.Col>
            </Grid>

            <RoutingPanel answers={sample.answers} />

            <PayloadPanel sample={sample} />
          </Stack>
        </Tabs.Panel>

        {/* 앞 탭이 고정된 샘플을 읽는 화면이라면, 이 탭은 같은 세 프리미티브를
            진짜 호출에 물려 읽는 사람이 직접 답을 움직여 보는 곳이다. */}
        <Tabs.Panel value="draw">
          <Stack gap="lg">
            <DrawCatPanel />
          </Stack>
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}
