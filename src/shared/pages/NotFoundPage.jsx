import { Link } from 'react-router-dom';
import { Anchor, Paper, Stack, Text } from '@mantine/core';

export default function NotFoundPage() {
  return (
    <Paper
      bg="var(--wf-surface)"
      radius="lg"
      p="xl"
      withBorder
      style={{ borderColor: 'var(--wf-hairline)' }}
    >
      <Stack gap={6} align="center" py="xl">
        <Text fw={700} c="ink.7">
          여긴 아무것도 없어요
        </Text>
        <Anchor component={Link} to="/songs/" size="sm">
          playground으로 돌아가기 &rarr;
        </Anchor>
      </Stack>
    </Paper>
  );
}
