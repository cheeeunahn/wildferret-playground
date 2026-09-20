import { Group, Stack, Text } from "@mantine/core";
import PrimitiveCard from "./PrimitiveCard";
import ProbabilityBar from "./ProbabilityBar";
import { PRIMITIVES } from "../data/samples";

export default function ChoicePanel({ answer, question, compact = false }) {
  // Highest probability first, so the picked option heads the list and the
  // runner-up — what Jev was torn with — sits right under it.
  const ranked = Object.entries(answer.probabilities).sort(
    (a, b) => b[1] - a[1],
  );

  return (
    <PrimitiveCard
      compact={compact}
      primitive={PRIMITIVES.choice}
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
          가장 확률이 높은 선택지가 답이 된다. 확신도는 선택지 사이의 우열이
          얼마나 뚜렷한지를 나타내며, 정답일 확률과는 다르다.
        </Text>
      }
    >
      {ranked.map(([option, probability]) => (
        <ProbabilityBar
          compact={compact}
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
