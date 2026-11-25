import { useEffect, useRef, useState } from 'react';
import styles from './AccountSheet.module.css';

// Bottom sheet that deletes the logged-in account for good. It asks for the
// password again, so a phone left unlocked is not enough.
export default function DeleteAccountSheet({ diary, onClose }) {
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
    } catch (err) {
      setError(err?.message || '잠시 후 다시 시도해 주세요.');
      setBusy(false);
    }
  };

  return (
    <div className={styles.backdrop} onClick={busy ? undefined : onClose}>
      <form
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-label="계정 삭제"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.key === 'Escape' && !busy && onClose()}
        onSubmit={submit}
      >
        <h2 className={styles.heading}>계정을 삭제할까요?</h2>
        <p className={styles.note}>
          <b>{diary.loginId}</b> 계정과 기록한 애니 {diary.records.length}편, 별점, 한줄평이 모두 지워지고
          로그인한 모든 기기에서 로그아웃돼요. 되돌릴 수 없어요.
        </p>

        {/* Lets a password manager match the account it saved. */}
        <input type="text" value={diary.loginId ?? ''} autoComplete="username" readOnly hidden />
        <label className={styles.field}>
          <span className={styles.label}>비밀번호 확인</span>
          <input
            ref={inputRef}
            className={styles.input}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            maxLength={128}
            disabled={busy}
          />
        </label>

        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}

        <div className={styles.buttons}>
          <button className={styles.cancel} type="button" onClick={onClose} disabled={busy}>
            취소
          </button>
          <button className={styles.danger} type="submit" disabled={!password || busy}>
            {busy ? '삭제하는 중…' : '삭제하기'}
          </button>
        </div>
      </form>
    </div>
  );
}
