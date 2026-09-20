import { Paper, Tabs, Text } from '@mantine/core';
import classes from './Dashboard.module.css';
import { QUESTIONS } from '../data/samples';

// The state and the questions go up together in one request; the three answers
// come back in one response. Showing both keeps the panels above honest.
function buildRequest(sample) {
  return {
    model: 'jev-latest',
    state: { ticket: sample.ticket },
    questions: Object.fromEntries(
      Object.entries(QUESTIONS).map(([key, q]) => [
        key,
        { type: q.primitive, instructions: q.instructions, criteria: q.criteria },
      ]),
    ),
  };
}

function buildResponse(sample) {
  return {
    model: 'jev-latest',
    answers: sample.answers,
    usage: sample.usage,
  };
}

export default function PayloadPanel({ sample }) {
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
        API 요청과 응답
      </Text>
      <Text size="sm" c="ink.5" mb="md">
        세 질문은 같은 문의를 바탕으로 한 번에 처리된다. 한 질문의 답이 다음
        질문에 필요할 때만 요청을 나눈다.
      </Text>

      <Tabs defaultValue="request" variant="pills" color="accent" radius="md">
        <Tabs.List mb="sm">
          <Tabs.Tab value="request">보낸 요청</Tabs.Tab>
          <Tabs.Tab value="response">받은 응답</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="request">
          <pre className={classes.code}>
            {JSON.stringify(buildRequest(sample), null, 2)}
          </pre>
        </Tabs.Panel>

        <Tabs.Panel value="response">
          <pre className={classes.code}>
            {JSON.stringify(buildResponse(sample), null, 2)}
          </pre>
        </Tabs.Panel>
      </Tabs>
    </Paper>
  );
}
