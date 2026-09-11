import { Link, Navigate, useParams } from 'react-router-dom';
import { Anchor, Box, Group, Text } from '@mantine/core';
import { useDocumentTitle } from '@mantine/hooks';
import { TOOLS } from '../tools/tools';

// One tool, full window, no site chrome: /tools/<id>/
export default function ToolPage() {
  const { toolId } = useParams();
  const tool = TOOLS.find((t) => t.id === toolId) ?? null;
  useDocumentTitle(tool ? `${tool.name} · wildferret's playground` : '');

  // An unknown tool id is just a stale link; send it to the tools tab.
  if (!tool) return <Navigate to="/tools/" replace />;

  return (
    <Box
      bg="var(--wf-surface)"
      style={{ display: 'flex', flexDirection: 'column', height: '100dvh' }}
    >
      <Group
        h={34}
        px="md"
        gap="xs"
        wrap="nowrap"
        style={{ borderBottom: '1px solid var(--wf-hairline)', flexShrink: 0 }}
      >
        <Anchor component={Link} to="/tools/" size="xs" c="ink.5">
          &larr; playground
        </Anchor>
        <Text size="xs" c="ink.4" truncate>
          {tool.name}
        </Text>
      </Group>

      <Box style={{ flex: 1, minHeight: 0 }}>
        <tool.Component />
      </Box>
    </Box>
  );
}
