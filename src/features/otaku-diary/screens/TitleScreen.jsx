import { useEffect, useState } from 'react';
import { assetUrl } from '../assets';
import AccountSheet from '../components/AccountSheet';
import DeleteAccountSheet from '../components/DeleteAccountSheet';
import { PRIVACY_PATH } from '../domain/privacy';
import { GUIDE_NAME } from '../domain/onboarding';
import styles from './TitleScreen.module.css';

// The way in. A visitor picks 로그인 (the main button), 비회원으로 시작하기
// to use the diary without an account, or the 회원가입 link. Someone already
// logged in just gets 기록하기. `error` replaces the tagline when the diary
// could not be loaded, and the button retries instead.
export default function TitleScreen({ onStart, disabled, error, onRetry, diary }) {
  const [accountMode, setAccountMode] = useState(null); // null | login | signup
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const logout = async () => {
    setLoggingOut(true);
    try {
      await diary.logout();
    } finally {
      setLoggingOut(false);
    }
  };

  // Logging in or signing up from here goes straight into the diary. It
  // waits for the render that has the account's diary, so `onStart` picks
  // the right screen for it.
  const [enterWhenLoggedIn, setEnterWhenLoggedIn] = useState(false);
  useEffect(() => {
    if (enterWhenLoggedIn && diary.loginId) {
      setEnterWhenLoggedIn(false);
      onStart();
    }
  }, [enterWhenLoggedIn, diary.loginId, onStart]);

  const background = assetUrl('bg-title.jpg');
  const kotori = assetUrl('kotori-neutral.png');
  // Someone who already recorded here without an account is carrying on.
  const guestLabel = diary.profile.onboarded ? '비회원으로 계속하기' : '비회원으로 시작하기';

  return (
    <div
      className={styles.screen}
      style={background ? { backgroundImage: `url(${background})` } : undefined}
    >
      {kotori && (
        <img className={styles.kotori} src={kotori} alt={GUIDE_NAME} draggable={false} />
      )}
      <div className={styles.panel}>
        <h1 className={styles.title}>애니와 함께하는 바다모험</h1>
        {error ? (
          <p className={styles.tagline} role="alert">
            {error}
          </p>
        ) : (
          <p className={styles.tagline}>지금까지 본 애니메이션을 기록해보아요</p>
        )}

        <div className={styles.actions}>
          {error ? (
            <button className={styles.cta} type="button" onClick={onRetry}>
              다시 시도
            </button>
          ) : diary.loginId ? (
            <>
              <button className={styles.cta} type="button" onClick={onStart} disabled={disabled}>
                기록하기
              </button>
              <p className={styles.account}>
                <b>{diary.loginId}</b> 님으로 로그인했어요 ·{' '}
                <button className={styles.link} type="button" onClick={logout} disabled={loggingOut}>
                  로그아웃
                </button>{' '}
                ·{' '}
                <button className={styles.link} type="button" onClick={() => setDeleteOpen(true)}>
                  계정 삭제
                </button>
              </p>
            </>
          ) : (
            <>
              <button
                className={styles.cta}
                type="button"
                onClick={() => setAccountMode('login')}
                disabled={disabled}
              >
                로그인
              </button>
              <button className={styles.guest} type="button" onClick={onStart} disabled={disabled}>
                {guestLabel}
              </button>
              <p className={styles.account}>
                계정이 없나요?{' '}
                <button
                  className={styles.link}
                  type="button"
                  onClick={() => setAccountMode('signup')}
                  disabled={disabled}
                >
                  회원가입
                </button>
              </p>
            </>
          )}
        </div>

        <a className={styles.privacy} href={PRIVACY_PATH}>
          개인정보 처리방침
        </a>
      </div>

      {accountMode && (
        <AccountSheet
          diary={diary}
          initialMode={accountMode}
          onSuccess={() => setEnterWhenLoggedIn(true)}
          onClose={() => setAccountMode(null)}
        />
      )}
      {deleteOpen && <DeleteAccountSheet diary={diary} onClose={() => setDeleteOpen(false)} />}
    </div>
  );
}
