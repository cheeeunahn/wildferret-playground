import { Badge, Paper, Stack, Text } from '@mantine/core';
import classes from './Dashboard.module.css';

// 판단은 모델이, 정책은 코드가 가진다. 임계값을 바꾸는 것만으로 동작이
// 달라지고, 답 자체는 다시 물을 필요가 없다는 점을 보여 주는 칸이다.
const THRESHOLDS = {
  humanHandoff: 0.7,
  sameDay: 1.5,
  needsReview: 0.5,
};

function decide({ team, urgency, wants_human: wantsHuman }) {
  return [
    {
      rule: `wants_human > ${THRESHOLDS.humanHandoff}`,
      hit: wantsHuman.noul > THRESHOLDS.humanHandoff,
      then: '챗봇을 건너뛰고 사람 상담원에게 바로 넘긴다',
      value: wantsHuman.noul.toFixed(2),
    },
    {
      rule: `urgency >= ${THRESHOLDS.sameDay}`,
      hit: urgency.score >= THRESHOLDS.sameDay,
      then: '당일 처리 큐에 올린다',
      value: urgency.score.toFixed(2),
    },
    {
      rule: `team.confidence < ${THRESHOLDS.needsReview}`,
      hit: team.confidence < THRESHOLDS.needsReview,
      then: `자동 배정 대신 사람이 확인한다 (${team.choice} 쪽이 앞섰지만 확신도가 낮다)`,
      value: team.confidence.toFixed(2),
    },
  ];
}

export default function RoutingPanel({ answers }) {
  const rules = decide(answers);
  const fired = rules.filter((r) => r.hit);

  return (
    <Paper
      bg="var(--wf-surface)"
      radius="lg"
      p={{ base: 'md', sm: 'lg' }}
      withBorder
      className={classes.card}
      style={{ borderColor: 'var(--wf-hairline)' }}
    >
      <Text fw={700} c="ink.8" mb={4}>
        결과에 따라 실행할 작업
      </Text>
      <Text size="sm" c="ink.5" mb="md">
        Jev는 판단값만 반환하고, 실제 동작은 아래 규칙이 결정한다. 임계값을
        바꿔도 모델을 다시 호출할 필요는 없다.
      </Text>

      <Stack gap="md">
        {rules.map((rule) => (
          <div key={rule.rule} className={classes.rule}>
            <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
              <Text size="sm" ff="monospace" c={rule.hit ? 'ink.9' : 'ink.4'}>
                {rule.rule} &nbsp;&rarr;&nbsp; {rule.value}
              </Text>
              <Text size="xs" c={rule.hit ? 'ink.6' : 'ink.4'}>
                {rule.then}
              </Text>
            </Stack>
            <Badge
              variant={rule.hit ? 'filled' : 'light'}
              color={rule.hit ? 'accent' : 'gray'}
              radius="sm"
              size="md"
            >
              {rule.hit ? '실행' : '해당 없음'}
            </Badge>
          </div>
        ))}
      </Stack>

      <Text size="xs" c="ink.5" mt="md">
        {fired.length === 0
          ? '적용되는 규칙이 없어 일반 큐로 자동 배정된다.'
          : `${fired.length}개 규칙을 실행한다.`}
      </Text>
    </Paper>
  );
}
