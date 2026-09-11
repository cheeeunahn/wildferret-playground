import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Anchor, Group, Paper, Select, Stack, Text } from '@mantine/core';
import { useDocumentTitle } from '@mantine/hooks';
import { TOOLS } from './catalog';

export default function ToolsPage() {
  useDocumentTitle("tools · wildferret's playground");
  const [toolId, setToolId] = useState(TOOLS[0]?.id ?? null);
  const tool = TOOLS.find((t) => t.id === toolId) ?? null;

  if (TOOLS.length === 0) {
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
            nothing here to see yet!
          </Text>
          <Text size="sm" c="ink.4">
            more comming soon... I think
          </Text>
        </Stack>
      </Paper>
    );
  }

  return (
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
          <Group justify="space-between" align="baseline" wrap="wrap">
            <Text size="sm" c="ink.5">
              {tool.description}
            </Text>
            {/* The same tool on its own page, with the site chrome out of the
                way — handy for actually drawing in. */}
            <Anchor component={Link} to={`/tools/${tool.id}/`} size="sm">
              이 도구만 크게 열기 &rarr;
            </Anchor>
          </Group>

          <Paper
            bg="var(--wf-surface)"
            radius="lg"
            withBorder
            className="wf-tool-frame"
            style={{ borderColor: 'var(--wf-hairline)', overflow: 'hidden' }}
          >
            <tool.Component key={tool.id} />
          </Paper>
        </Stack>
      ) : null}
    </>
  );
}
