import { NavLink, Outlet } from 'react-router-dom';
import {
  Box,
  Container,
  Group,
  Paper,
  Stack,
  Text,
  Title,
} from '@mantine/core';

// Trailing slashes, so the address bar reads /songs/ and /tools/.
const NAV = [
  { to: '/songs/', label: 'songs' },
  { to: '/tools/', label: 'tools' },
];

export default function SiteLayout() {
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
                {NAV.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    style={({ isActive }) => ({
                      fontSize: 'var(--mantine-font-size-sm)',
                      fontWeight: isActive ? 700 : 400,
                      color: isActive
                        ? 'var(--mantine-color-accent-6)'
                        : 'var(--mantine-color-ink-5)',
                      // Longhand, so React never rewrites the shorthand over
                      // the other textDecoration-* values on a re-render.
                      textDecorationLine: isActive ? 'underline' : 'none',
                      textDecorationThickness: 2,
                      textUnderlineOffset: 9,
                      textDecorationColor: 'var(--mantine-color-accent-6)',
                    })}
                  >
                    {item.label}
                  </NavLink>
                ))}
              </Group>
            </Group>
          </Paper>

          <Outlet />
        </Stack>
      </Container>
    </Box>
  );
}
