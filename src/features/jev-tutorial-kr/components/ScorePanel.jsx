import { Box, Group, Stack, Text } from "@mantine/core";
import PrimitiveCard from "./PrimitiveCard";
import ProbabilityBar from "./ProbabilityBar";
import classes from "./Dashboard.module.css";
import { PRIMITIVES } from "../data/samples";

export default function ScorePanel({ answer, question, compact = false }) {
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
      compact={compact}
      primitive={PRIMITIVES.score}
      headline={
        <Stack gap={2}>
          <Text size="xs" c="ink.6" fw={600}>
            {question.title}
          </Text>
          <Group align="baseline" gap="xs">
            <Text
              fz={compact ? 24 : 32}
              fw={700}
              c="accent.7"
              ff="monospace"
              lh={1.1}
            >
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
            각 단계의 확률을 가중 평균한 값이 점수다. 가장 유력한 단계는{" "}
            {topLevel}이지만, 다른 단계의 가능성까지 반영되어 최종 점수는{" "}
            {answer.score.toFixed(2)}다.
          </Text>
          <Text size="xs" c="ink.4">
            이 질문에는 낮음부터 높음까지 {question.criteria.length}개의 구체적인
            판단 기준을 적었다.
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
          compact={compact}
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
