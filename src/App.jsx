import { useState } from 'react';
import {
  Box,
  Container,
  Group,
  Paper,
  Select,
  Stack,
  Text,
  Title,
  UnstyledButton,
} from '@mantine/core';
import StrudelPlayer from './StrudelPlayer';
import { PIECES } from './pieces';
import { TOOLS } from './tools';

const NAV = [
  { id: 'songs', label: 'songs' },
  { id: 'tools', label: 'tools' },
];

export default function App() {
  const [view, setView] = useState('songs');
  const [selectedId, setSelectedId] = useState(PIECES[0]?.id ?? null);
  const selected = PIECES.find((p) => p.id === selectedId) ?? null;
  const [toolId, setToolId] = useState(TOOLS[0]?.id ?? null);
  const tool = TOOLS.find((t) => t.id === toolId) ?? null;

  return (
    <Box bg="var(--wf-paper)" mih="100vh" py={{ base: 'md', sm: 'xl' }}>
      <Container size="lg">
        <Stack gap="lg">
          <Paper
            component="header"
            bg="var(--wf-surface)"
            radius="lg"
            p={{ base: 'md', sm: 'lg' }}
            withBorder
            style={{ borderColor: 'var(--wf-hairline)' }}
          >
            <Group justify="space-between" align="flex-start" wrap="wrap">
              <Stack gap={4}>
                <Title order={1} c="ink.9">
                  wildferret&rsquo;s playground
                </Title>
                <Text size="sm" c="ink.5">
                  where random experimenting happens
                </Text>
              </Stack>

              <Group gap="lg" component="nav" mt={4}>
                {NAV.map((item) => {
                  const active = item.id === view;
                  return (
                    <UnstyledButton
                      key={item.id}
                      onClick={() => setView(item.id)}
                      aria-current={active ? 'page' : undefined}
                      style={{
                        fontSize: 'var(--mantine-font-size-sm)',
                        fontWeight: active ? 700 : 400,
                        color: active
                          ? 'var(--mantine-color-accent-6)'
                          : 'var(--mantine-color-ink-5)',
                        // Longhand, so React never rewrites the shorthand over
                        // the other textDecoration-* values on a re-render.
                        textDecorationLine: active ? 'underline' : 'none',
                        textDecorationThickness: 2,
                        textUnderlineOffset: 9,
                        textDecorationColor: 'var(--mantine-color-accent-6)',
                      }}
                    >
                      {item.label}
                    </UnstyledButton>
                  );
                })}
              </Group>
            </Group>
          </Paper>

          {view === 'songs' ? (
            <>
              <Select
                label="pick a song"
                placeholder="pick a song"
                data={PIECES.map((p) => ({ value: p.id, label: p.name }))}
                value={selectedId}
                onChange={setSelectedId}
                allowDeselect={false}
                size="md"
                radius="md"
                comboboxProps={{ shadow: 'md' }}
              />

              <Paper
                bg="var(--wf-surface)"
                radius="lg"
                p="xs"
                withBorder
                style={{
                  borderColor: 'var(--wf-hairline)',
                  overflow: 'hidden',
                }}
              >
                {selected ? (
                  <StrudelPlayer code={selected.code} />
                ) : (
                  <Text c="ink.4" ta="center" py="xl">
                    pick a song to start the player
                  </Text>
                )}
              </Paper>
            </>
          ) : TOOLS.length > 0 ? (
            <>
              <Select
                label="pick a tool"
                placeholder="pick a tool"
                data={TOOLS.map((t) => ({ value: t.id, label: t.name }))}
                value={toolId}
                onChange={setToolId}
                allowDeselect={false}
                size="md"
                radius="md"
                comboboxProps={{ shadow: 'md' }}
              />

              {tool ? (
                <Stack gap="xs">
                  <Text size="sm" c="ink.5">
                    {tool.description}
                  </Text>

                  <Paper
                    bg="var(--wf-surface)"
                    radius="lg"
                    withBorder
                    className="wf-tool-frame"
                    style={{
                      borderColor: 'var(--wf-hairline)',
                      overflow: 'hidden',
                    }}
                  >
                    <tool.Component key={tool.id} />
                  </Paper>
                </Stack>
              ) : null}
            </>
          ) : (
            <Paper
              bg="var(--wf-surface)"
              radius="lg"
              p="xl"
              withBorder
              style={{ borderColor: 'var(--wf-hairline)' }}
            >
              <Stack gap={6} align="center" py="xl">
                <Text fw={700} c="ink.7">
                  nothing here to see yet!
                </Text>
                <Text size="sm" c="ink.4">
                  more comming soon... I think
                </Text>
              </Stack>
            </Paper>
          )}
        </Stack>
      </Container>
    </Box>
  );
}
