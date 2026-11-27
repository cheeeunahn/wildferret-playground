import { useEffect, useRef, useState } from 'react';
import Button from '../ui/Button';
import Dialog from '../ui/Dialog';
import styles from './RemoveDialog.module.css';

// Asks before titles leave the bookshelf (`animes`, one or many), since their
// ratings and comments go with them and cannot be brought back. `onConfirm`
// may reject with a message for the user; the dialog then stays open and
// shows it.
export default function RemoveDialog({ animes, onConfirm, onCancel }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  // Focus starts on 취소, so Enter on a stray tap does not delete.
  const cancelRef = useRef(null);
  useEffect(() => cancelRef.current?.focus(), []);

  const confirm = async () => {
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
    } catch (failure) {
      setError(failure?.message || '잠시 후 다시 시도해 주세요.');
      setBusy(false);
    }
  };

  return (
    <Dialog
      title={animes.length > 1 ? `${animes.length}편을 책장에서 삭제할까요?` : '책장에서 삭제할까요?'}
      onClose={onCancel}
      busy={busy}
      actions={
        <>
          <Button ref={cancelRef} variant="outlined" grow onClick={onCancel} disabled={busy}>
            취소
          </Button>
          <Button variant="danger" grow onClick={confirm} disabled={busy}>
            {busy ? '삭제하는 중…' : '삭제하기'}
          </Button>
        </>
      }
    >
      <p>
        {animes.length === 1 && (
          <>
            <b>{animes[0].title}</b>
            <br />
          </>
        )}
        별점과 한줄평도 함께 지워지고 되돌릴 수 없어요.
      </p>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </Dialog>
  );
}
