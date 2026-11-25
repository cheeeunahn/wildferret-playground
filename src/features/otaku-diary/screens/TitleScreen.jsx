import { useState } from 'react';
import { assetUrl } from '../assets';
import AccountSheet from '../components/AccountSheet';
import { GUIDE_NAME } from '../domain/onboarding';
import styles from './TitleScreen.module.css';

// `error` is shown in place of the tagline when the diary could not be
// loaded, and the button retries instead of starting. Under the button is
// the way into an account, or who is logged in.
export default function TitleScreen({ onStart, disabled, error, onRetry, diary }) {
  const [accountOpen, setAccountOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const logout = async () => {
    setLoggingOut(true);
    try {
      await diary.logout();
    } finally {
      setLoggingOut(false);
    }
  };
  const background = assetUrl('bg-title.jpg');
  const kotori = assetUrl('kotori-neutral.png');

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
        {error ? (
          <button className={styles.cta} type="button" onClick={onRetry}>
            다시 시도
          </button>
        ) : (
          <button className={styles.cta} type="button" onClick={onStart} disabled={disabled}>
            기록하기
          </button>
        )}

        <p className={styles.account}>
          {error || diary.loading ? null : diary.loginId ? (
            <>
              <b>{diary.loginId}</b> 님으로 로그인했어요 ·{' '}
              <button className={styles.link} type="button" onClick={logout} disabled={loggingOut}>
                로그아웃
              </button>
            </>
          ) : (
            <>
              다른 기기에서도 이어서 기록하려면{' '}
              <button className={styles.link} type="button" onClick={() => setAccountOpen(true)}>
                로그인 · 회원가입
              </button>
            </>
          )}
        </p>
      </div>

      {accountOpen && <AccountSheet diary={diary} onClose={() => setAccountOpen(false)} />}
    </div>
  );
}
