import { useState } from 'react';
import { MAX_COMMENT_LENGTH } from '../domain/review';
import AnimeCard from './AnimeCard';
import { StarInput } from './Stars';
import styles from './ReviewSheet.module.css';

const RATING_WORDS = ['', '별로였어요', '그저 그랬어요', '볼만했어요', '재밌었어요', '인생작이에요'];

// Bottom sheet that asks for a star rating and, optionally, a comment.
// `onSubmit` receives `{ rating, comment }` and may return a promise; the
// sheet waits for it and shows the error if saving fails.
export default function ReviewSheet({ anime, submitLabel = '기록하기', onSubmit, onCancel }) {
  const [rating, setRating] = useState(anime.rating ?? 0);
  const [comment, setComment] = useState(anime.comment ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    if (!rating || saving) return;
    setSaving(true);
    setError(null);
    try {
      await onSubmit({ rating, comment });
    } catch (err) {
      setError(err?.message || '저장하지 못했어요. 다시 시도해 주세요.');
      setSaving(false);
    }
  };

  return (
    <div className={styles.backdrop} onClick={saving ? undefined : onCancel}>
      <form
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-label={`${anime.title} 별점 남기기`}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.key === 'Escape' && !saving && onCancel()}
        onSubmit={submit}
      >
        <AnimeCard anime={anime} showReview={false} />

        <StarInput value={rating} onChange={setRating} disabled={saving} />
        <p className={styles.word}>{RATING_WORDS[rating] || '별을 눌러 점수를 매겨 주세요'}</p>

        <label className={styles.field}>
          <span className={styles.label}>
            한줄평 <em>(선택)</em>
            <span className={styles.count}>
              {comment.length}/{MAX_COMMENT_LENGTH}
            </span>
          </span>
          <textarea
            className={styles.comment}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={MAX_COMMENT_LENGTH}
            rows={3}
            placeholder="어땠는지 한마디 남겨 보세요"
            disabled={saving}
          />
        </label>

        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}

        <div className={styles.buttons}>
          <button className={styles.cancel} type="button" onClick={onCancel} disabled={saving}>
            취소
          </button>
          <button className={styles.submit} type="submit" disabled={!rating || saving}>
            {saving ? '저장 중…' : submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
}
