import { useState } from 'react';
import { Paper, Select, Text } from '@mantine/core';
import { useDocumentTitle } from '@mantine/hooks';
import StrudelPlayer from './components/StrudelPlayer';
import { SONGS } from './library';

export default function SongsPage() {
  useDocumentTitle("songs · wildferret's playground");
  const [selectedId, setSelectedId] = useState(SONGS[0]?.id ?? null);
  const selected = SONGS.find((song) => song.id === selectedId) ?? null;

  return (
    <>
      <Select
        label="pick a song"
        placeholder="pick a song"
        data={SONGS.map((song) => ({ value: song.id, label: song.name }))}
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
        style={{ borderColor: 'var(--wf-hairline)', overflow: 'hidden' }}
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
  );
}
