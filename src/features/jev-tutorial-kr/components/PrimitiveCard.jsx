import {
  Badge,
  Box,
  Group,
  Paper,
  Stack,
  Text,
  UnstyledButton,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import classes from './Dashboard.module.css';

// The shared shell every primitive panel sits in: name, one-line tagline,
// then the live answer. Everything explanatory — `notes`, which reads the
// numbers above, and the primitive's own reference lines — sits behind one
// toggle, so the three cards show only their answers side by side.
export default function PrimitiveCard({ primitive, headline, notes, children }) {
  const [open, { toggle }] = useDisclosure(false);

  return (
    <Paper
      bg="var(--wf-surface)"
      radius="lg"
      p={{ base: 'md', sm: 'lg' }}
      withBorder
      className={classes.card}
      style={{ borderColor: 'var(--wf-hairline)' }}
    >
      <Stack gap="md" style={{ flex: 1 }}>
        <Stack gap={6}>
          <Group gap="xs" align="center">
            <Badge variant="light" color="accent" radius="sm" size="md">
              {primitive.name}
            </Badge>
            <Text size="sm" c="ink.6" fw={600}>
              {primitive.korean}
            </Text>
          </Group>
          <Text size="xs" c="ink.5" className={classes.tagline}>
            {primitive.tagline}
          </Text>
        </Stack>

        {headline}

        <Stack gap="sm" style={{ flex: 1 }}>
          {children}
        </Stack>

        {/* Pinned to the foot of the card so the three toggles line up across
            the row, however much answer sits above each one. */}
        <Box pt="xs" mt="auto" style={{ flexShrink: 0, borderTop: '1px solid var(--wf-hairline)' }}>
          <UnstyledButton onClick={toggle} w="100%" aria-expanded={open}>
            <Group justify="space-between" wrap="nowrap" gap="xs">
              <Text size="xs" c="ink.6" fw={600}>
                읽는 법과 쓰는 곳
              </Text>
              <Text size="xs" c="ink.5">
                {open ? '접기 ▲' : '펼치기 ▼'}
              </Text>
            </Group>
          </UnstyledButton>

          {open ? (
            <Stack gap="sm" pt="sm">
              {notes}

              <Text size="xs" c="ink.6">
                {primitive.summary}
              </Text>
              <Text size="xs" c="ink.5">
                <b>쓰는 곳</b> · {primitive.useFor}
              </Text>
              <Text size="xs" c="ink.5">
                <b>주의</b> · {primitive.watchOut}
              </Text>
            </Stack>
          ) : null}
        </Box>
      </Stack>
    </Paper>
  );
}
