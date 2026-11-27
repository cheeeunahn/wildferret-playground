import { useState } from 'react';
import { factsOf } from '../domain/details';
import { genreLabel } from '../domain/format';
import { tagLabel } from '../domain/tags';
import { useAnimeDetails } from '../hooks/useAnimeDetails';
import { useLanguage } from '../hooks/useLanguage';
import { Poster } from './AnimeCard';
import Stars from './Stars';
import Trailer from './Trailer';
import Button from '../ui/Button';
import Chip from '../ui/Chip';
import Icon from '../ui/Icon';
import IconButton from '../ui/IconButton';
import Sheet from '../ui/Sheet';
import styles from './AnimeDetailSheet.module.css';

// Synopses longer than this start folded.
const FOLD_AT = 280;

// Bottom sheet with everything about one recorded anime: the user's own
// stars and comment, then AniList's facts, trailer, synopsis, genres and
// tags. The synopsis is TMDB's Korean text when there is one, else AniList's
// English; with the language setting on English it is always AniList's, and
// genres and tags keep their English names. `onRemove` asks to take the anime off the bookshelf.
export default function AnimeDetailSheet({ anime, onEditReview, onRemove, onClose }) {
  const { status, details, retry } = useAnimeDetails(anime.id);
  const { language } = useLanguage();
  // English shows AniList's synopsis even when TMDB has a Korean one.
  const synopsisLang = language === 'en' ? 'en' : details?.descriptionLang;

  return (
    <Sheet label={`${anime.title} 작품 정보`} onClose={onClose} flush>
        <div className={styles.hero}>
          {details?.banner && <img className={styles.banner} src={details.banner} alt="" />}
          <IconButton className={styles.close} icon="close" label="닫기" variant="scrim" size="m" autoFocus onClick={onClose} />
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
          <Button className={styles.edit} size="s" onClick={onEditReview}>
            {anime.rating ? '수정' : '별점 주기'}
          </Button>
          {anime.comment && <p className={styles.comment}>{anime.comment}</p>}
        </div>

        {status === 'loading' && <p className={styles.status}>작품 정보를 불러오는 중…</p>}
        {status === 'error' && (
          <div className={styles.status} role="alert">
            작품 정보를 불러오지 못했어요.
            <Button className={styles.retry} variant="tonal" size="s" onClick={retry}>
              다시 시도
            </Button>
          </div>
        )}
        {status === 'ready' && <Details details={details} title={anime.title} language={language} />}

        <Button className={styles.remove} variant="dangerText" size="s" onClick={onRemove}>
          책장에서 삭제
        </Button>

        <p className={styles.credit}>
          작품 정보:{' '}
          <a href={details?.siteUrl ?? `https://anilist.co/anime/${anime.id}`} target="_blank" rel="noreferrer">
            AniList <Icon name="external" />
          </a>
          {synopsisLang === 'ko' && ' · 줄거리: TMDB'}
        </p>
    </Sheet>
  );
}

function Details({ details, title, language }) {
  const facts = factsOf(details);
  const english = language === 'en';
  const synopsis = english ? details.englishDescription : details.description;
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

      {synopsis && (
        <Section heading="줄거리">
          {/* Keyed, so a longer text in the other language starts folded. */}
          <Synopsis key={language} text={synopsis} lang={english ? 'en' : details.descriptionLang} />
        </Section>
      )}

      {details.genres.length > 0 && (
        <Section heading="장르">
          <Chips items={details.genres.map((genre) => genreLabel(genre, language))} accent />
        </Section>
      )}

      {details.tags.length > 0 && (
        <Section heading="태그">
          <Chips items={details.tags.map((tag) => tagLabel(tag, language))} />
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
        <Button className={styles.more} variant="text" size="s" onClick={() => setOpen(!open)} aria-expanded={open}>
          {open ? '접기' : '더 보기'}
        </Button>
      )}
    </>
  );
}

function Chips({ items, accent }) {
  return (
    <ul className={styles.chips}>
      {items.map((item) => (
        <li key={item}>
          <Chip accent={accent}>{item}</Chip>
        </li>
      ))}
    </ul>
  );
}
