import { Box, Group, Stack, Text } from '@mantine/core';
import PrimitiveCard from './PrimitiveCard';
import ProbabilityBar from './ProbabilityBar';
import classes from './Dashboard.module.css';
import { PRIMITIVES } from '../data/samples';

// 0.5 언저리는 "애매하다"가 아니라 "예와 아니오가 비슷하다"는 뜻이라, 읽는
// 사람이 실수하지 않도록 구간마다 말을 붙여 준다.
function reading(noul) {
  if (noul >= 0.9) return '그럴 가능성이 매우 높다';
  if (noul >= 0.65) return '그럴 가능성이 높다';
  if (noul > 0.35) return '판단이 엇갈린다';
  if (noul > 0.1) return '그렇지 않을 가능성이 높다';
  return '그렇지 않을 가능성이 매우 높다';
}

export default function NoulPanel({ answer, question }) {
  const percent = `${Math.round(answer.noul * 1000) / 10}%`;

  return (
    <PrimitiveCard
      primitive={PRIMITIVES.noul}
      headline={
        <Stack gap={2}>
          <Text size="xs" c="ink.6" fw={600}>
            {question.title}
          </Text>
          <Group align="baseline" gap="xs">
            <Text fz={32} fw={700} c="accent.7" ff="monospace" lh={1.1}>
              {answer.noul.toFixed(2)}
            </Text>
            <Text size="xs" c="ink.4">
              {reading(answer.noul)}
            </Text>
          </Group>
        </Stack>
      }
      notes={
        <Text size="xs" c="ink.4">
          Noul은 별도의 확신도 없이 ‘예’일 확률 하나만 반환한다. 여러 조건을
          따로 확인하려면 조건마다 Noul 질문을 하나씩 사용한다.
        </Text>
      }
    >
      <Box>
        <Box className={classes.track} style={{ height: 14 }}>
          <Box className={classes.fill} style={{ width: percent }} />
        </Box>
        <Group justify="space-between" mt={6}>
          <Text size="xs" c="ink.4" ff="monospace">
            0.0 아니오
          </Text>
          <Text size="xs" c="ink.4" ff="monospace">
            1.0 예
          </Text>
        </Group>
      </Box>

      <ProbabilityBar
        label="예"
        value={answer.noul}
        note={question.criteria.true}
      />
      <ProbabilityBar
        label="아니오"
        value={1 - answer.noul}
        muted
        note={question.criteria.false}
      />
    </PrimitiveCard>
  );
}
