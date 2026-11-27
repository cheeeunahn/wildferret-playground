import { useState } from 'react';
import { MAX_COMMENT_LENGTH } from '../domain/review';
import AnimeCard from './AnimeCard';
import { StarInput } from './Stars';
import Button from '../ui/Button';
import Message from '../ui/Message';
import Sheet, { SheetActions } from '../ui/Sheet';
import TextField from '../ui/TextField';
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
    <Sheet label={`${anime.title} 별점 남기기`} onClose={onCancel} busy={saving} onSubmit={submit}>
      <AnimeCard anime={anime} showReview={false} />

      <StarInput value={rating} onChange={setRating} disabled={saving} />
      <p className={styles.word}>{RATING_WORDS[rating] || '별을 눌러 점수를 매겨 주세요'}</p>

      <TextField
        multiline
        label={
          <>
            한줄평 <em>(선택)</em>
          </>
        }
        labelEnd={`${comment.length}/${MAX_COMMENT_LENGTH}`}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        maxLength={MAX_COMMENT_LENGTH}
        rows={3}
        placeholder="어땠는지 한마디 남겨 보세요"
        disabled={saving}
      />

      {error && <Message tone="error">{error}</Message>}

      <SheetActions>
        <Button variant="tonal" size="l" onClick={onCancel} disabled={saving}>
          취소
        </Button>
        <Button size="l" grow type="submit" disabled={!rating || saving}>
          {saving ? '저장 중…' : submitLabel}
        </Button>
      </SheetActions>
    </Sheet>
  );
}
