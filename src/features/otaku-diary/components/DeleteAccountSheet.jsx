import { useEffect, useRef, useState } from 'react';
import Button from '../ui/Button';
import Message from '../ui/Message';
import Sheet, { SheetActions } from '../ui/Sheet';
import TextField from '../ui/TextField';
import styles from './AccountSheet.module.css';

// Bottom sheet that deletes the logged-in account for good. It asks for the
// password again, so a phone left unlocked is not enough. `onDeleted` runs
// once the account is gone.
export default function DeleteAccountSheet({ diary, onDeleted, onClose }) {
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);
  useEffect(() => inputRef.current?.focus(), [error]);

  const submit = async (e) => {
    e.preventDefault();
    if (!password || busy) return;
    setBusy(true);
    setError(null);
    try {
      await diary.deleteAccount(password);
      onClose();
      onDeleted?.();
    } catch (err) {
      setError(err?.message || '잠시 후 다시 시도해 주세요.');
      setBusy(false);
    }
  };

  return (
    <Sheet label="계정 삭제" onClose={onClose} busy={busy} onSubmit={submit}>
      <h2 className={styles.heading}>계정을 삭제할까요?</h2>
      <Message>
        <b>{diary.loginId}</b> 계정과 기록한 애니 {diary.records.length}편, 별점, 한줄평이 모두 지워지고
        로그인한 모든 기기에서 로그아웃돼요. 되돌릴 수 없어요.
      </Message>

      {/* Lets a password manager match the account it saved. */}
      <input type="text" value={diary.loginId ?? ''} autoComplete="username" readOnly hidden />
      <TextField
        label="비밀번호 확인"
        ref={inputRef}
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="current-password"
        maxLength={128}
        disabled={busy}
      />

      {error && <Message tone="error">{error}</Message>}

      <SheetActions>
        <Button variant="tonal" size="l" onClick={onClose} disabled={busy}>
          취소
        </Button>
        <Button variant="danger" size="l" grow type="submit" disabled={!password || busy}>
          {busy ? '삭제하는 중…' : '삭제하기'}
        </Button>
      </SheetActions>
    </Sheet>
  );
}
