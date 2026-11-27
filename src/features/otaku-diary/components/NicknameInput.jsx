import { useState } from 'react';
import Button from '../ui/Button';
import TextField from '../ui/TextField';
import styles from './NicknameInput.module.css';

const MAX_LENGTH = 12;

export default function NicknameInput({ onSubmit }) {
  const [value, setValue] = useState('');
  const ready = value.trim().length > 0;

  return (
    <form
      className={styles.form}
      onSubmit={(e) => {
        e.preventDefault();
        if (ready) onSubmit(value);
      }}
    >
      <TextField
        value={value}
        onChange={(e) => setValue(e.target.value)}
        maxLength={MAX_LENGTH}
        placeholder="닉네임 입력"
        aria-label="닉네임"
        autoComplete="off"
        autoFocus
        enterKeyHint="done"
      />
      <Button size="l" type="submit" disabled={!ready}>
        확인
      </Button>
    </form>
  );
}
