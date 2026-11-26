import { useEffect, useRef, useState } from 'react';
import { factsOf } from '../domain/details';
import { genreLabel } from '../domain/format';
import { tagLabel } from '../domain/tags';
import { useAnimeDetails } from '../hooks/useAnimeDetails';
import { Poster } from './AnimeCard';
import Stars from './Stars';
import Trailer from './Trailer';
import styles from './AnimeDetailSheet.module.css';

// Synopses longer than this start folded.
const FOLD_AT = 280;

// Bottom sheet with everything about one recorded anime: the user's own
// stars and comment, then AniList's facts, trailer, synopsis, genres and
// tags. The synopsis is TMDB's Korean text when there is one, else AniList's
// English.
export default function AnimeDetailSheet({ anime, onEditReview, onClose }) {
  const { status, details, retry } = useAnimeDetails(anime.id);
  const closeRef = useRef(null);
  useEffect(() => closeRef.current?.focus(), []);

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <section
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-label={`${anime.title} 작품 정보`}
        // Focusable, so Escape still closes it after a tap on plain text.
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
      >
        <div className={styles.hero}>
          {details?.banner && <img className={styles.banner} src={details.banner} alt="" />}
          <button ref={closeRef} className={styles.close} type="button" onClick={onClose} aria-label="닫기">
            ✕
          </button>
        </div>

        <header className={styles.head}>
          <Poster anime={anime} className={styles.poster} />
          <div className={styles.titles}>
            <h2 className={styles.title}>{anime.title}</h2>
            {anime.nativeTitle && anime.nativeTitle !== anime.title && (
              <p className={styles.native} lang="ja">
                {anime.nativeTitle}
              </p>
            )}
          </div>
        </header>

        <div className={styles.mine}>
          {anime.rating > 0 ? (
            <Stars rating={anime.rating} />
          ) : (
            <span className={styles.unrated}>아직 별점을 안 줬어요</span>
          )}
          <button className={styles.edit} type="button" onClick={onEditReview}>
            {anime.rating ? '수정' : '별점 주기'}
          </button>
          {anime.comment && <p className={styles.comment}>{anime.comment}</p>}
        </div>

        {status === 'loading' && <p className={styles.status}>작품 정보를 불러오는 중…</p>}
        {status === 'error' && (
          <div className={styles.status} role="alert">
            작품 정보를 불러오지 못했어요.
            <button className={styles.retry} type="button" onClick={retry}>
              다시 시도
            </button>
          </div>
        )}
        {status === 'ready' && <Details details={details} title={anime.title} />}

        <p className={styles.credit}>
          작품 정보:{' '}
          <a href={details?.siteUrl ?? `https://anilist.co/anime/${anime.id}`} target="_blank" rel="noreferrer">
            AniList ↗
          </a>
          {details?.descriptionLang === 'ko' && ' · 줄거리: TMDB'}
        </p>
      </section>
    </div>
  );
}

function Details({ details, title }) {
  const facts = factsOf(details);
  return (
    <>
      {facts.length > 0 && (
        <dl className={styles.facts}>
          {facts.map((fact) => (
            <div key={fact.label}>
              <dt>{fact.label}</dt>
              <dd>{fact.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {details.trailer && (
        <Section heading="예고편">
          <Trailer trailer={details.trailer} title={title} />
        </Section>
      )}

      {details.description && (
        <Section heading="줄거리">
          <Synopsis text={details.description} lang={details.descriptionLang} />
        </Section>
      )}

      {details.genres.length > 0 && (
        <Section heading="장르">
          <Chips items={details.genres.map(genreLabel)} accent />
        </Section>
      )}

      {details.tags.length > 0 && (
        <Section heading="태그">
          <Chips items={details.tags.map(tagLabel)} />
        </Section>
      )}
    </>
  );
}

function Section({ heading, children }) {
  return (
    <section className={styles.section}>
      <h3 className={styles.heading}>{heading}</h3>
      {children}
    </section>
  );
}

function Synopsis({ text, lang }) {
  const long = text.length > FOLD_AT;
  const [open, setOpen] = useState(!long);
  return (
    <>
      <p className={styles.synopsis} lang={lang} data-folded={!open || undefined}>
        {text}
      </p>
      {long && (
        <button className={styles.more} type="button" onClick={() => setOpen(!open)} aria-expanded={open}>
          {open ? '접기' : '더 보기'}
        </button>
      )}
    </>
  );
}

function Chips({ items, accent }) {
  return (
    <ul className={styles.chips} data-accent={accent || undefined}>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}
