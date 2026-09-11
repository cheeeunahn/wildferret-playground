import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Box,
  Button,
  Divider,
  Group,
  Modal,
  Paper,
  ScrollArea,
  SegmentedControl,
  Select,
  Stack,
  Switch,
  Text,
  Transition,
  UnstyledButton,
} from '@mantine/core';
import { createSketchbook, TOOL_META } from './engine';
import classes from './AsciiSketchbook.module.css';

// Every tool is a drag on the canvas; nothing is a fixed stencil.
const TOOL_BUTTONS = [
  { value: 'select', glyph: '↖', key: 'V' },
  { value: 'rect', glyph: '□', key: 'R' },
  { value: 'line', glyph: '─', key: 'L' },
  { value: 'arrow', glyph: '→', key: 'A' },
  { value: 'text', glyph: 'T', key: 'T' },
  { value: 'button', glyph: '[]', key: 'B' },
  { value: 'caret', glyph: '▼', key: 'D' },
  { value: 'block', glyph: '█', key: 'F' },
];

const SIZES = [
  { value: '60x20', label: 'S (60×20)' },
  { value: '90x32', label: 'M (90×32)' },
  { value: '140x50', label: 'L (140×50)' },
  { value: '200x80', label: 'XL (200×80)' },
];

const SHORTCUTS = [
  ...TOOL_BUTTONS.map((t) => [t.key, TOOL_META[t.value].label]),
  ['Space+드래그', '화면 이동'],
  ['Ctrl+스크롤', '확대/축소'],
  ['⌘Z', '되돌리기'],
  ['⌘C / ⌘V / ⌘X', '복사 / 붙여넣기 / 잘라내기'],
  ['Del/⌫', '선택 삭제'],
];

export default function AsciiSketchbook() {
  const rootRef = useRef(null);
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const textboxRef = useRef(null);
  const engineRef = useRef(null);
  const toastTimer = useRef(null);

  const [tool, setToolState] = useState('select');
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState('—');
  const [size, setSize] = useState('90x32');
  const [showGrid, setShowGrid] = useState(true);
  const [toast, setToast] = useState(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const showToast = useCallback((msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 1600);
  }, []);

  useEffect(() => {
    const engine = createSketchbook({
      canvas: canvasRef.current,
      wrap: wrapRef.current,
      textbox: textboxRef.current,
      root: rootRef.current,
      onToast: showToast,
      onState: (patch) => {
        if ('tool' in patch) setToolState(patch.tool);
        if ('zoom' in patch) setZoom(patch.zoom);
        if ('pos' in patch) setPos(patch.pos);
        if ('size' in patch) setSize(patch.size);
        if ('showGrid' in patch) setShowGrid(patch.showGrid);
      },
    });
    engineRef.current = engine;
    return () => {
      clearTimeout(toastTimer.current);
      engine.destroy();
      engineRef.current = null;
    };
  }, [showToast]);

  const engine = () => engineRef.current;
  const meta = TOOL_META[tool];

  return (
    <Box
      ref={rootRef}
      // The engine listens for shortcuts here rather than on document, so
      // typing "r" elsewhere on the page never switches tools.
      tabIndex={-1}
      className={classes.root}
      pos="relative"
    >
      <Group
        h={52}
        px="md"
        gap="xs"
        wrap="nowrap"
        style={{ borderBottom: '1px solid var(--wf-hairline)', flexShrink: 0 }}
      >
        <Text fw={800} c="accent.6" style={{ letterSpacing: '-0.02em' }}>
          ASCII Sketchbook
        </Text>

        <SegmentedControl
          ml="auto"
          size="xs"
          radius="md"
          value={tool}
          onChange={(v) => engine()?.setTool(v)}
          data={TOOL_BUTTONS.map((t) => ({
            value: t.value,
            label: (
              <Group gap={4} wrap="nowrap" justify="center" title={`${TOOL_META[t.value].label} (${t.key})`}>
                <Text span ff="monospace" fz="sm">
                  {t.glyph}
                </Text>
                <Text span fz={9} opacity={0.55}>
                  {t.key}
                </Text>
              </Group>
            ),
          }))}
        />

        <Group gap={6} ml="auto" wrap="nowrap">
          <UnstyledButton
            onClick={() => engine()?.resetZoom()}
            title="줌 초기화"
            style={{ fontSize: 13, color: 'var(--mantine-color-ink-6)', padding: '4px 8px' }}
          >
            {Math.round(zoom * 100)}%
          </UnstyledButton>
          <Button size="xs" variant="subtle" color="ink" onClick={() => engine()?.undo()}>
            되돌리기
          </Button>
          <Button size="xs" variant="subtle" color="ink" onClick={() => engine()?.copyText()}>
            ASCII 복사
          </Button>
          <Button size="xs" variant="light" onClick={() => setConfirmClear(true)}>
            비우기
          </Button>
        </Group>
      </Group>

      <div className={classes.main}>
        <div className={classes.canvasWrap} ref={wrapRef}>
          <div className={classes.canvasPad}>
            <canvas className={classes.canvas} ref={canvasRef} />
            <textarea
              className={classes.textbox}
              ref={textboxRef}
              spellCheck={false}
              autoComplete="off"
              autoCapitalize="off"
            />
          </div>
        </div>

        <div className={classes.panel}>
          <ScrollArea type="hover" scrollbarSize={6}>
            <Stack gap={0} p="md">
              <SectionTitle>그리기</SectionTitle>
              <Text fz={12} c="ink.5" lh={1.7} mb="xs">
                위쪽 도구를 고르고 캔버스에 드래그하면 드래그한 크기대로 그려져요.
                버튼 글자는 <Text span c="ink.6" fw={600}>텍스트(T)</Text> 도구로 클릭해
                바로 고칠 수 있어요.
              </Text>

              <Divider my="md" color="var(--wf-hairline)" />

              <SectionTitle>캔버스</SectionTitle>
              <Group justify="space-between" mb="sm">
                <Text fz="sm" c="ink.6">
                  격자 점
                </Text>
                <Switch
                  size="sm"
                  checked={showGrid}
                  onChange={(e) => engine()?.setShowGrid(e.currentTarget.checked)}
                  aria-label="격자 점 표시"
                />
              </Group>
              <Group justify="space-between">
                <Text fz="sm" c="ink.6">
                  크기
                </Text>
                <Select
                  size="xs"
                  w={140}
                  data={SIZES}
                  value={size}
                  allowDeselect={false}
                  onChange={(v) => {
                    const [cols, rows] = v.split('x').map(Number);
                    engine()?.resize(cols, rows);
                  }}
                />
              </Group>

              <Divider my="md" color="var(--wf-hairline)" />

              <SectionTitle>내보내기</SectionTitle>
              <Button variant="light" fullWidth mb={6} onClick={() => engine()?.copyText()}>
                ASCII 텍스트로 복사
              </Button>
              <Button variant="default" fullWidth onClick={() => setConfirmClear(true)}>
                캔버스 비우기
              </Button>

              <Divider my="md" color="var(--wf-hairline)" />

              <SectionTitle>단축키</SectionTitle>
              <Stack gap={2}>
                {SHORTCUTS.map(([keys, what]) => (
                  <Text key={keys} fz={12} c="ink.4">
                    <Text span c="ink.6">
                      {keys}
                    </Text>{' '}
                    · {what}
                  </Text>
                ))}
              </Stack>
            </Stack>
          </ScrollArea>
        </div>
      </div>

      <Group
        h={30}
        px="md"
        gap="md"
        wrap="nowrap"
        style={{ borderTop: '1px solid var(--wf-hairline)', flexShrink: 0 }}
      >
        <Text fz={12.5} c="accent.6" fw={600}>
          {meta.label}
        </Text>
        <Text fz={12.5} c="ink.4">
          {pos}
        </Text>
        <Text fz={12.5} c="ink.4" truncate>
          {meta.hint}
        </Text>
      </Group>

      <Transition mounted={toast !== null} transition="slide-up" duration={180}>
        {(style) => (
          <Paper
            className={classes.toast}
            style={style}
            withBorder
            radius="xl"
            py={9}
            px={24}
            shadow="md"
          >
            <Text fz="sm" fw={600}>
              {toast}
            </Text>
          </Paper>
        )}
      </Transition>

      <Modal
        opened={confirmClear}
        onClose={() => setConfirmClear(false)}
        title="캔버스를 비울까요?"
        centered
        radius="lg"
      >
        <Text fz="sm" c="ink.6" mb="lg">
          그린 내용이 모두 지워져요. 되돌리기(⌘Z)로 한 번은 되살릴 수 있어요.
        </Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={() => setConfirmClear(false)}>
            취소
          </Button>
          <Button
            onClick={() => {
              engine()?.clearAll();
              setConfirmClear(false);
            }}
          >
            비우기
          </Button>
        </Group>
      </Modal>
    </Box>
  );
}

function SectionTitle({ children }) {
  return (
    <Text fz={11.5} fw={700} c="ink.4" mb={11} style={{ letterSpacing: '0.08em' }}>
      {children}
    </Text>
  );
}
