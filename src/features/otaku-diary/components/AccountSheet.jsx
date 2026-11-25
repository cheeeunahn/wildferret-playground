import { useEffect, useRef, useState } from 'react';
import styles from './AccountSheet.module.css';

const MIN_PASSWORD_LENGTH = 8;

// Bottom sheet for logging in or making an account, with an ID and a
// password. The server has the final say on both and its message is shown
// as it comes; the checks here only save a round trip.
export default function AccountSheet({ diary, onClose }) {
  const [mode, setMode] = useState('login'); // login | signup
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const idRef = useRef(null);
  const passwordRef = useRef(null);
  useEffect(() => idRef.current?.focus(), []);
  // The fields are switched off while a request is out, which drops the
  // cursor; after a refusal it goes back to the password.
  useEffect(() => {
    if (error) passwordRef.current?.focus();
  }, [error]);

  const signingUp = mode === 'signup';
  const hasDiary = diary.records.length > 0;
  const ready = loginId.trim() && password && (!signingUp || confirm);

  const switchTo = (next) => {
    setMode(next);
    setError(null);
    setConfirm('');
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!ready || busy) return;
    if (signingUp && password.length < MIN_PASSWORD_LENGTH) {
      setError(`비밀번호는 ${MIN_PASSWORD_LENGTH}자 이상이어야 해요.`);
      return;
    }
    if (signingUp && password !== confirm) {
      setError('비밀번호가 서로 달라요.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await (signingUp ? diary.signup(loginId, password) : diary.login(loginId, password));
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
        aria-label={signingUp ? '회원가입' : '로그인'}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.key === 'Escape' && !busy && onClose()}
        onSubmit={submit}
      >
        <div className={styles.tabs} role="tablist">
          {[
            ['login', '로그인'],
            ['signup', '회원가입'],
          ].map(([value, label]) => (
            <button
              key={value}
              className={styles.tab}
              type="button"
              role="tab"
              aria-selected={mode === value}
              onClick={() => switchTo(value)}
              disabled={busy}
            >
              {label}
            </button>
          ))}
        </div>

        <label className={styles.field}>
          <span className={styles.label}>아이디</span>
          <input
            ref={idRef}
            className={styles.input}
            value={loginId}
            onChange={(e) => setLoginId(e.target.value)}
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            maxLength={20}
            disabled={busy}
          />
          {signingUp && <span className={styles.rule}>영문 소문자, 숫자, 밑줄(_) 4~20자</span>}
        </label>

        <label className={styles.field}>
          <span className={styles.label}>비밀번호</span>
          <input
            ref={passwordRef}
            className={styles.input}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={signingUp ? 'new-password' : 'current-password'}
            maxLength={128}
            disabled={busy}
          />
          {signingUp && <span className={styles.rule}>{MIN_PASSWORD_LENGTH}자 이상</span>}
        </label>

        {signingUp && (
          <label className={styles.field}>
            <span className={styles.label}>비밀번호 확인</span>
            <input
              className={styles.input}
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              maxLength={128}
              disabled={busy}
            />
          </label>
        )}

        <p className={styles.note}>
          {signingUp
            ? `${hasDiary ? '지금까지 기록한 애니는 새 계정으로 옮겨져요. ' : ''}이메일을 받지 않아서 비밀번호를 잊으면 되찾을 수 없어요. 꼭 기억해 두세요.`
            : hasDiary
              ? '이 기기에서 기록한 애니는 로그인한 계정의 기록에 합쳐져요.'
              : '로그인하면 계정에 기록해 둔 애니를 불러와요.'}
        </p>

        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}

        <div className={styles.buttons}>
          <button className={styles.cancel} type="button" onClick={onClose} disabled={busy}>
            취소
          </button>
          <button className={styles.submit} type="submit" disabled={!ready || busy}>
            {busy ? '잠시만요…' : signingUp ? '계정 만들기' : '로그인'}
          </button>
        </div>
      </form>
    </div>
  );
}
