import { useState } from 'react';
import { CREDITS } from '../domain/credits';
import { LANGUAGES } from '../domain/language';
import { CONTACT_EMAIL, OPERATOR, PRIVACY_PATH } from '../domain/privacy';
import { useLanguage } from '../hooks/useLanguage';
import { useMuted, useSoundLevels, useVoice } from '../hooks/useSound';
import Button from '../ui/Button';
import Icon from '../ui/Icon';
import IconButton from '../ui/IconButton';
import Message from '../ui/Message';
import SegmentedControl from '../ui/SegmentedControl';
import Sheet from '../ui/Sheet';
import Switch from '../ui/Switch';
import AccountSheet from './AccountSheet';
import DeleteAccountSheet from './DeleteAccountSheet';
import styles from './SettingsSheet.module.css';

// Bottom sheet with the settings that apply on every screen: the language
// anime information is shown in, and sound (everything on or off, and how
// loud the music and 코토리's voice are). At the top is the account: logging
// out for someone logged in, logging in or signing up for a visitor. Below them, what the app is: who runs
// it, its privacy policy, and the open source and other work it uses.
export default function SettingsSheet({ diary, onClose }) {
  const { muted, toggleMuted } = useMuted();
  const { levels, setLevel } = useSoundLevels();
  const { play } = useVoice();
  const { language, setLanguage } = useLanguage();

  // The account sheets open over this one; once they have done their work
  // this one closes too, as the diary underneath is now a different one.
  const [accountMode, setAccountMode] = useState(null); // null | login | signup
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState(null);
  const logout = async () => {
    setLoggingOut(true);
    setLogoutError(null);
    try {
      await diary.logout();
      onClose();
    } catch (failure) {
      setLogoutError(failure?.message || '잠시 후 다시 시도해 주세요.');
      setLoggingOut(false);
    }
  };

  return (
    <>
    <Sheet label="설정" onClose={onClose} busy={loggingOut} className={styles.sheet}>
        <header className={styles.head}>
          <h2 className={styles.heading}>설정</h2>
          <IconButton icon="close" label="닫기" variant="tonal" size="m" autoFocus onClick={onClose} />
        </header>

        <h3 className={styles.group}>계정</h3>
        {diary.loginId ? (
          <>
            <div className={styles.row}>
              <span>아이디</span>
              <b className={styles.loginId}>{diary.loginId}</b>
              <Button variant="outlined" size="s" onClick={logout} disabled={loggingOut}>
                {loggingOut ? '로그아웃 중…' : '로그아웃'}
              </Button>
            </div>
            {logoutError && <Message tone="error">{logoutError}</Message>}
            <Message>로그아웃해도 기록은 계정에 남아 있어요. 다시 로그인하면 이어서 쓸 수 있어요.</Message>
          </>
        ) : (
          <>
            <div className={styles.row}>
              <span>비회원</span>
              <div className={styles.rowEnd}>
                <Button variant="outlined" size="s" onClick={() => setAccountMode('signup')}>
                  회원가입
                </Button>
                <Button size="s" onClick={() => setAccountMode('login')}>
                  로그인
                </Button>
              </div>
            </div>
            <Message>지금은 이 브라우저에만 기록돼요. 계정을 만들면 다른 기기에서도 볼 수 있어요.</Message>
          </>
        )}

        <h3 className={styles.group}>언어</h3>
        <div className={styles.row}>
          <span id="settings-language">작품 정보</span>
          <SegmentedControl
            options={LANGUAGES.map((option) => ({ ...option, lang: option.value }))}
            value={language}
            onChange={setLanguage}
            aria-labelledby="settings-language"
          />
        </div>
        <Message>작품 제목, 줄거리, 장르, 태그에 적용돼요. 메뉴와 코토리의 말은 한국어로 나와요.</Message>

        <h3 className={styles.group}>소리</h3>
        <div className={styles.row}>
          <span id="settings-sound">소리</span>
          <Switch checked={!muted} onChange={toggleMuted} aria-labelledby="settings-sound" />
        </div>
        <Volume label="배경음악" value={levels.music} disabled={muted} onChange={(level) => setLevel('music', level)} />
        <Volume
          label="코토리 목소리"
          value={levels.voice}
          disabled={muted}
          onChange={(level) => setLevel('voice', level)}
          // The music is always playing to judge by; her voice needs a line.
          onDone={() => play('greet')}
        />

        <h3 className={styles.group}>정보</h3>
        <a className={styles.row} href={PRIVACY_PATH} target="_blank" rel="noreferrer">
          개인정보 처리방침 <Icon name="external" className={styles.rowIcon} />
        </a>
        <details className={styles.credits}>
          <summary className={styles.row}>
            오픈소스 라이선스와 출처 <Icon name="chevronDown" className={styles.rowIcon} />
          </summary>
          {CREDITS.map((group) => (
            <section key={group.heading}>
              <h4>{group.heading}</h4>
              <ul>
                {group.items.map((item) => (
                  <li key={item.name}>
                    {item.url ? (
                      <a href={item.url} target="_blank" rel="noreferrer">
                        {item.name}
                      </a>
                    ) : (
                      <b>{item.name}</b>
                    )}
                    {item.license && <span className={styles.license}>{item.license}</span>}
                    {item.note && <p>{item.note}</p>}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </details>
        {diary.loginId && (
          <Button className={styles.deleteAccount} variant="dangerText" size="s" onClick={() => setDeleteOpen(true)}>
            계정 삭제
          </Button>
        )}
        <Message>
          운영: {OPERATOR} · 문의: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        </Message>
    </Sheet>
    {accountMode && (
      <AccountSheet
        diary={diary}
        initialMode={accountMode}
        onSuccess={onClose}
        onClose={() => setAccountMode(null)}
      />
    )}
    {deleteOpen && (
      <DeleteAccountSheet
        diary={diary}
        onDeleted={onClose}
        onClose={() => setDeleteOpen(false)}
      />
    )}
    </>
  );
}

// One volume slider, 0 to 100. `onDone` runs when the user lets go.
function Volume({ label, value, disabled, onChange, onDone }) {
  const percent = Math.round(value * 100);
  return (
    <label className={styles.row} data-disabled={disabled || undefined}>
      <span>{label}</span>
      <input
        className={styles.slider}
        type="range"
        min="0"
        max="100"
        step="5"
        value={percent}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
        onPointerUp={onDone}
        onKeyUp={onDone}
        aria-valuetext={`${percent}%`}
      />
      <output className={styles.value}>{percent}</output>
    </label>
  );
}
