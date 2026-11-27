import { useState } from 'react';
import { NO_FILTER, applyFilter, filterOptions, isFiltering, toggleFilter } from '../domain/filters';
import Button from '../ui/Button';
import Chip from '../ui/Chip';
import Icon from '../ui/Icon';
import IconButton from '../ui/IconButton';
import Sheet, { SheetActions } from '../ui/Sheet';
import styles from './FilterSheet.module.css';

// Past this many choices a kind folds, with 더 보기 for the rest.
const FOLD_AFTER = 8;

// Every way to narrow the bookshelf on one sheet: pick any number of values
// of each kind, see at the foot how many titles that leaves, and apply them
// all at once. Nothing changes behind the sheet until "N편 보기".
// `facetStatus` is "loading" while genres and studios are still on the way.
export default function FilterSheet({ records, facets, facetStatus, filter, language, onApply, onClose }) {
  const [draft, setDraft] = useState(filter);
  const options = filterOptions(records, facets, language);
  const count = applyFilter(records, facets, draft).length;
  const toggle = (kind) => (value) => setDraft((current) => toggleFilter(current, kind, value));
  const loading = facetStatus === 'loading';

  return (
    <Sheet label="필터" onClose={onClose}>
      <header className={styles.head}>
        <h2 className={styles.title}>필터</h2>
        <IconButton icon="close" label="닫기" variant="tonal" size="m" autoFocus onClick={onClose} />
      </header>

      <Group
        heading="별점"
        options={options.ratings}
        picked={draft.ratings}
        onToggle={toggle('ratings')}
        renderLabel={(option) => (
          <>
            <Icon name="star" className={styles.star} />
            {option.value}
          </>
        )}
      />
      <Group heading="장르" options={options.genres} picked={draft.genres} onToggle={toggle('genres')} loading={loading} />
      <Group heading="제작사" options={options.studios} picked={draft.studios} onToggle={toggle('studios')} loading={loading} />
      <Group heading="형식" options={options.formats} picked={draft.formats} onToggle={toggle('formats')} />

      <div className={styles.foot}>
        <SheetActions>
          <Button variant="tonal" size="l" disabled={!isFiltering(draft)} onClick={() => setDraft(NO_FILTER)}>
            모두 지우기
          </Button>
          <Button size="l" grow disabled={count === 0} onClick={() => onApply(draft)}>
            {count === 0 ? '맞는 애니가 없어요' : `${count}편 보기`}
          </Button>
        </SheetActions>
      </div>
    </Sheet>
  );
}

// One kind of filter: its choices as chips, each with how many titles have
// it. A choice no title has is shown but cannot be picked.
function Group({ heading, options, picked, onToggle, loading = false, renderLabel }) {
  // Starts open if something past the fold is already picked.
  const [open, setOpen] = useState(() => options.slice(FOLD_AFTER).some((o) => picked.includes(o.value)));
  if (options.length === 0) {
    if (!loading) return null;
    return (
      <section className={styles.group}>
        <h3 className={styles.heading}>{heading}</h3>
        <p className={styles.loading}>불러오는 중…</p>
      </section>
    );
  }
  const shown = open ? options : options.slice(0, FOLD_AFTER);
  return (
    <section className={styles.group}>
      <h3 className={styles.heading}>{heading}</h3>
      <div className={styles.chips} role="group" aria-label={heading}>
        {shown.map((option) => {
          const on = picked.includes(option.value);
          return (
            <Chip
              key={option.value}
              selected={on}
              disabled={option.count === 0 && !on}
              aria-label={`${option.label}, ${option.count}편`}
              onClick={() => onToggle(option.value)}
            >
              {renderLabel ? renderLabel(option) : option.label}
              <span className={styles.n}>{option.count}</span>
            </Chip>
          );
        })}
        {options.length > FOLD_AFTER && (
          <Button variant="text" size="s" onClick={() => setOpen(!open)}>
            {open ? '접기' : `더 보기 ${options.length - FOLD_AFTER}`}
          </Button>
        )}
      </div>
    </section>
  );
}
