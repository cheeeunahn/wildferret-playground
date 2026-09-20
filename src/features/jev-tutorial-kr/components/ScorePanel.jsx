import { Box, Group, Stack, Text } from '@mantine/core';
import PrimitiveCard from './PrimitiveCard';
import ProbabilityBar from './ProbabilityBar';
import classes from './Dashboard.module.css';
import { PRIMITIVES } from '../data/samples';

export default function ScorePanel({ answer, question }) {
  const levels = Object.keys(answer.legend)
    .map(Number)
    .sort((a, b) => a - b);
  const maxLevel = levels[levels.length - 1];
  // The marker sits at the centre of the band it falls in, so score 0 and the
  // top score land inside the ruler instead of on its edges.
  const bandWidth = 100 / levels.length;
  const markerLeft = `${bandWidth * (answer.score + 0.5)}%`;
  const topLevel = levels.reduce((best, level) =>
    answer.probabilities[level] > answer.probabilities[best] ? level : best,
  );

  return (
    <PrimitiveCard
      primitive={PRIMITIVES.score}
      headline={
        <Stack gap={2}>
          <Text size="xs" c="ink.4">
            {question.title}
          </Text>
          <Group align="baseline" gap="xs">
            <Text fz={32} fw={700} c="accent.7" ff="monospace" lh={1.1}>
              {answer.score.toFixed(2)}
            </Text>
            <Text size="xs" c="ink.4" ff="monospace">
              / {maxLevel} · 확신도 {answer.confidence.toFixed(2)}
            </Text>
          </Group>
        </Stack>
      }
      notes={
        <>
          <Text size="xs" c="ink.4">
            점수는 각 단계의 확률을 반영한 평균이다. 이 문의는 {topLevel}단계일
            가능성이 가장 높지만, 다른 단계일 가능성도 남아 있어 최종 점수는{' '}
            {answer.score.toFixed(2)}가 되었다.
          </Text>
          <Text size="xs" c="ink.4">
            판단 기준은 낮은 단계부터 높은 단계까지 {question.criteria.length}
            개를 사용했다.
          </Text>
        </>
      }
    >
      <Box>
        <Box className={classes.ruler}>
          {levels.map((level) => (
            <Box key={level} className={classes.band} />
          ))}
          <Box className={classes.marker} style={{ left: markerLeft }} />
        </Box>
        <Group justify="space-between" mt={6}>
          <Text size="xs" c="ink.4" ff="monospace">
            0
          </Text>
          <Text size="xs" c="ink.4" ff="monospace">
            {maxLevel}
          </Text>
        </Group>
      </Box>

      {levels.map((level) => (
        <ProbabilityBar
          key={level}
          label={`${level} 단계`}
          value={answer.probabilities[level]}
          muted={level !== topLevel}
          note={answer.legend[level]}
        />
      ))}
    </PrimitiveCard>
  );
}
