import { useEffect, useRef, useState } from 'react';
import { PRIVACY_PATH } from '../domain/privacy';
import Button from '../ui/Button';
import Message from '../ui/Message';
import SegmentedControl from '../ui/SegmentedControl';
import Sheet, { SheetActions } from '../ui/Sheet';
import TextField from '../ui/TextField';
import styles from './AccountSheet.module.css';

const MODES = [
  { value: 'login', label: '로그인' },
  { value: 'signup', label: '회원가입' },
];

const MIN_PASSWORD_LENGTH = 8;

// Bottom sheet for logging in or making an account, with an ID and a
// password. The server has the final say on both and its message is shown
// as it comes; the checks here only save a round trip. `initialMode` picks
// the tab it opens on; `onSuccess` runs once the visitor is logged in.
export default function AccountSheet({ diary, initialMode = 'login', onSuccess, onClose }) {
  const [mode, setMode] = useState(initialMode); // login | signup
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [ageConfirmed, setAgeConfirmed] = useState(false);
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
  const ready = loginId.trim() && password && (!signingUp || (confirm && ageConfirmed));

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
      await (signingUp ? diary.signup(loginId, password, ageConfirmed) : diary.login(loginId, password));
      onClose();
      onSuccess?.();
    } catch (err) {
      setError(err?.message || '잠시 후 다시 시도해 주세요.');
      setBusy(false);
    }
  };

  return (
    <Sheet label={signingUp ? '회원가입' : '로그인'} onClose={onClose} busy={busy} onSubmit={submit}>
      <SegmentedControl options={MODES} value={mode} onChange={switchTo} disabled={busy} grow aria-label="로그인 또는 회원가입" />

      <TextField
        label="아이디"
        hint={signingUp && '영문 소문자, 숫자, 밑줄(_) 4~20자'}
        ref={idRef}
        value={loginId}
        onChange={(e) => setLoginId(e.target.value)}
        autoComplete="username"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        maxLength={20}
        disabled={busy}
      />
      <TextField
        label="비밀번호"
        hint={signingUp && `${MIN_PASSWORD_LENGTH}자 이상`}
        ref={passwordRef}
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete={signingUp ? 'new-password' : 'current-password'}
        maxLength={128}
        disabled={busy}
      />
      {signingUp && (
        <TextField
          label="비밀번호 확인"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
          maxLength={128}
          disabled={busy}
        />
      )}

      {signingUp && (
        <label className={styles.check}>
          <input
            type="checkbox"
            checked={ageConfirmed}
            onChange={(e) => setAgeConfirmed(e.target.checked)}
            disabled={busy}
          />
          <span>만 14세 이상입니다</span>
        </label>
      )}

      <Message>
        {signingUp
          ? `${hasDiary ? '새 계정은 빈 기록으로 시작해요. 비회원으로 기록한 애니는 옮겨지지 않고 지워져요. ' : ''}이메일을 받지 않아서 비밀번호를 잊으면 되찾을 수 없어요. 꼭 기억해 두세요.`
          : hasDiary
            ? '이 기기에서 기록한 애니는 로그인한 계정의 기록에 합쳐져요.'
            : '로그인하면 계정에 기록해 둔 애니를 불러와요.'}
        {signingUp && (
          <>
            {' '}
            아이디와 비밀번호를 어떻게 다루는지는{' '}
            <a href={PRIVACY_PATH} target="_blank" rel="noreferrer">
              개인정보 처리방침
            </a>
            에서 볼 수 있어요.
          </>
        )}
      </Message>

      {error && <Message tone="error">{error}</Message>}

      <SheetActions>
        <Button variant="tonal" size="l" onClick={onClose} disabled={busy}>
          취소
        </Button>
        <Button size="l" grow type="submit" disabled={!ready || busy}>
          {busy ? '잠시만요…' : signingUp ? '계정 만들기' : '로그인'}
        </Button>
      </SheetActions>
    </Sheet>
  );
}
