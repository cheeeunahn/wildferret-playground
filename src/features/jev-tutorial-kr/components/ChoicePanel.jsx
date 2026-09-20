import { Group, Stack, Text } from '@mantine/core';
import PrimitiveCard from './PrimitiveCard';
import ProbabilityBar from './ProbabilityBar';
import { PRIMITIVES } from '../data/samples';

export default function ChoicePanel({ answer, question }) {
  // Highest probability first, so the picked option heads the list and the
  // runner-up — what Jev was torn with — sits right under it.
  const ranked = Object.entries(answer.probabilities).sort(
    (a, b) => b[1] - a[1],
  );

  return (
    <PrimitiveCard
      primitive={PRIMITIVES.choice}
      headline={
        <Stack gap={2}>
          <Text size="xs" c="ink.6" fw={600}>
            {question.title}
          </Text>
          <Group align="baseline" gap="xs">
            <Text fz={32} fw={700} c="accent.7" ff="monospace" lh={1.1}>
              {answer.choice}
            </Text>
            <Text size="xs" c="ink.4" ff="monospace">
              확신도 {answer.confidence.toFixed(2)}
            </Text>
          </Group>
        </Stack>
      }
      notes={
        <Text size="xs" c="ink.4">
          모든 확률의 합은 100%다. 확신도는 결과가 한쪽으로 얼마나 뚜렷하게
          기울었는지를 보여 주며, 정답률과는 다르다.
        </Text>
      }
    >
      {ranked.map(([option, probability]) => (
        <ProbabilityBar
          key={option}
          label={option}
          value={probability}
          muted={option !== answer.choice}
          note={question.criteria[option]}
        />
      ))}
    </PrimitiveCard>
  );
}
