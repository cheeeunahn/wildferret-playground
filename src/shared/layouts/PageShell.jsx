import { Box, Container, Stack } from '@mantine/core';

// The page frame every site page sits in: paper background, centred column,
// even spacing between the stacked cards. Layouts decide what goes inside.
export default function PageShell({ children }) {
  return (
    <Box bg="var(--wf-paper)" mih="100vh" py={{ base: 'md', sm: 'xl' }}>
      <Container size="lg">
        <Stack gap="lg">{children}</Stack>
      </Container>
    </Box>
  );
}
