import { Box, Group, Text } from "@mantine/core";
import classes from "./Dashboard.module.css";

// One row of a distribution. `muted` greys out the options that were not
// picked, so the chosen one reads first.
export default function ProbabilityBar({
  label,
  value,
  muted = false,
  note,
  compact = false,
}) {
  const percent = `${Math.round(value * 1000) / 10}%`;

  return (
    <Box>
      <Group justify="space-between" align="baseline" gap="xs" wrap="nowrap">
        <Text
          size={compact ? "xs" : "sm"}
          c={muted ? "ink.5" : "ink.9"}
          fw={muted ? 400 : 600}
        >
          {label}
        </Text>
        <Text
          size="xs"
          c={muted ? "ink.4" : "accent.7"}
          fw={muted ? 400 : 700}
          ff="monospace"
        >
          {percent}
        </Text>
      </Group>

      <Box className={classes.track} mt={5}>
        <Box
          className={`${classes.fill} ${muted ? classes.fillMuted : ""}`}
          style={{ width: percent }}
        />
      </Box>

      {/* 좁은 칸에서는 고르지 않은 줄의 설명까지 남기면 카드가 화면을
          넘긴다. 고른 줄의 근거만 남긴다. */}
      {note && (!compact || !muted) ? (
        <Text size="xs" c="ink.4" mt={4}>
          {note}
        </Text>
      ) : null}
    </Box>
  );
}
