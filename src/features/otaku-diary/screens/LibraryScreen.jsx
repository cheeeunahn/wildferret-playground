import { useMemo, useState } from 'react';
import AnimeCard from '../components/AnimeCard';
import AnimeDetailSheet from '../components/AnimeDetailSheet';
import FilterSheet from '../components/FilterSheet';
import PosterTile from '../components/PosterTile';
import RemoveDialog from '../components/RemoveDialog';
import ReviewSheet from '../components/ReviewSheet';
import {
  NO_FILTER,
  appliedFilters,
  applyFilter,
  filterCount,
  isFiltering,
  toggleFilter,
} from '../domain/filters';
import { titleIn } from '../domain/language';
import { DEFAULT_SORT, SORTS, isSort, sortRecords } from '../domain/sort';
import { useAnimeFacets } from '../hooks/useAnimeFacets';
import { useLanguage } from '../hooks/useLanguage';
import { useLongPress } from '../hooks/useLongPress';
import { usePreference } from '../hooks/usePreference';
import Button from '../ui/Button';
import Chip from '../ui/Chip';
import Icon from '../ui/Icon';
import IconButton from '../ui/IconButton';
import Select from '../ui/Select';
import TopBar from '../ui/TopBar';
import styles from './LibraryScreen.module.css';

const VIEWS = ['grid', 'list'];
const isView = (value) => VIEWS.includes(value);

// The bookshelf, opened: every anime the user has recorded, as a grid of
// posters or as a list that shows comments (the user's choice, remembered).
// Tapping one opens its details (synopsis, trailer, genres), where it can be
// re-rated or removed. Holding one down, or 선택 in the header, starts
// selecting: taps then tick, and the bar at the bottom removes the ticked
// ones after a dialog asks once more.
//
// 필터 opens a sheet for narrowing by star rating, genre, studio and format;
// what is applied shows as chips under the controls, each removable. The
// order (newest first, best rated, title, year aired) is remembered too.
export default function LibraryScreen({ diary, onBack }) {
  const { language } = useLanguage();
  const [editingId, setEditingId] = useState(null);
  const [openId, setOpenId] = useState(null);
  // The ticked rows' ids while selecting, and null otherwise.
  const [selected, setSelected] = useState(null);
  const [removingIds, setRemovingIds] = useState(null);
  const [filter, setFilter] = useState(NO_FILTER);
  const [filterOpen, setFilterOpen] = useState(false);
  const [view, setView] = usePreference('otaku-diary:shelf-view', 'grid', isView);
  const [sort, setSort] = usePreference('otaku-diary:shelf-sort', DEFAULT_SORT, isSort);
  // Changing what is listed drops the ticks, so nothing out of sight is
  // removed along with what is.
  const changeFilter = (next) => {
    setFilter(next);
    setSelected((current) => current && new Set());
  };
  // Genre and studio come from AniList; they load after the list shows.
  const { status: facetStatus, facets } = useAnimeFacets(diary.records);
  // In English a record is listed under AniList's title once that has loaded.
  const records = useMemo(
    () => diary.records.map((record) => titleIn(language, record, facets[record.id]?.title)),
    [diary.records, facets, language],
  );
  const shown = sortRecords(applyFilter(records, facets, filter), sort, language);
  const applied = appliedFilters(filter, language);
  const picked = filterCount(filter);
  const editing = records.find((r) => r.id === editingId);
  const open = records.find((r) => r.id === openId);
  const removing = removingIds && records.filter((r) => removingIds.includes(r.id));
  const selecting = selected !== null;
  const allSelected = selecting && shown.length > 0 && shown.every((r) => selected.has(r.id));

  const toggle = (id) =>
    setSelected((current) => {
      const next = new Set(current);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  // A long press starts selecting with that row ticked.
  const press = useLongPress((id) => setSelected((current) => new Set(current ?? []).add(id)));

  const saveReview = async (review) => {
    await diary.saveReview(editingId, review);
    setEditingId(null);
  };

  // Rejects with a message for the dialog to show. Once removed, the dialog
  // closes, and so does the details sheet if it was showing that title.
  const removeAnime = async () => {
    await diary.removeAnime(removingIds);
    setRemovingIds(null);
    setSelected(null);
    if (removingIds.includes(openId)) setOpenId(null);
  };

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <TopBar
          className={styles.bar}
          onBack={onBack}
          backLabel="잠수함 카페로 돌아가기"
          title={
            selecting ? (
              selected.size > 0 ? `${selected.size}편 선택` : '항목 선택'
            ) : (
              <>
                내 책장 <span className={styles.count}>{records.length}편</span>
              </>
            )
          }
          end={
            records.length > 0 && (
              <Button variant="outlined" size="s" onClick={() => setSelected(selecting ? null : new Set())}>
                {selecting ? '취소' : '선택'}
              </Button>
            )
          }
        />
        {records.length > 0 && (
          <div className={styles.controls}>
            <Button
              className={styles.filterButton}
              variant="outlined"
              size="s"
              data-on={picked > 0 || undefined}
              aria-label={picked > 0 ? `필터, ${picked}개 적용됨` : '필터'}
              onClick={() => setFilterOpen(true)}
            >
              <Icon name="filter" /> 필터{picked > 0 && <span className={styles.badge}>{picked}</span>}
            </Button>
            <Select label="정렬" options={SORTS} value={sort} onChange={setSort} />
            <div className={styles.views} role="group" aria-label="보기 방식">
              <IconButton
                icon="grid"
                label="포스터로 보기"
                size="m"
                aria-pressed={view === 'grid'}
                onClick={() => setView('grid')}
              />
              <IconButton
                icon="list"
                label="목록으로 보기"
                size="m"
                aria-pressed={view === 'list'}
                onClick={() => setView('list')}
              />
            </div>
          </div>
        )}
        {applied.length > 0 && (
          <div className={styles.applied} role="group" aria-label="적용한 필터">
            {applied.map((item) => (
              <Chip
                key={`${item.kind}:${item.value}`}
                accent
                aria-label={`${item.label} 조건 빼기`}
                onClick={() => changeFilter(toggleFilter(filter, item.kind, item.value))}
              >
                {item.kind === 'ratings' ? (
                  <>
                    <Icon name="star" /> {item.value}
                  </>
                ) : (
                  item.label
                )}
                <Icon name="close" className={styles.remove} />
              </Chip>
            ))}
            <Button variant="text" size="s" className={styles.clearAll} onClick={() => changeFilter(NO_FILTER)}>
              모두 지우기
            </Button>
          </div>
        )}
      </header>

      {records.length === 0 ? (
        <p className={styles.empty}>
          아직 꽂힌 애니가 없어요.
          <br />
          바다로 나가서 본 애니를 검색해 보세요.
        </p>
      ) : shown.length === 0 ? (
        <p className={styles.empty}>
          고른 조건에 맞는 애니가 없어요.
          <br />
          <Button variant="text" size="s" onClick={() => changeFilter(NO_FILTER)}>
            조건 지우기
          </Button>
        </p>
      ) : (
        <>
          {isFiltering(filter) && (
            <p className={styles.summary}>
              {records.length}편 중 {shown.length}편
            </p>
          )}
          {view === 'grid' ? (
            <ul className={styles.grid}>
              {shown.map((anime) => (
                <li key={anime.id}>
                  <PosterTile
                    anime={anime}
                    onOpen={() => (selecting ? toggle(anime.id) : setOpenId(anime.id))}
                    press={press(anime.id)}
                    selected={selecting ? selected.has(anime.id) : undefined}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <ul className={styles.list}>
              {shown.map((anime) => (
                <li key={anime.id}>
                  <AnimeCard
                    anime={anime}
                    size="l"
                    studio={facets[anime.id]?.studio}
                    onOpen={() => (selecting ? toggle(anime.id) : setOpenId(anime.id))}
                    press={press(anime.id)}
                    selected={selecting ? selected.has(anime.id) : undefined}
                  />
                </li>
              ))}
            </ul>
          )}
        </>
      )}
      {selecting && (
        <div className={styles.toolbar} role="toolbar" aria-label="선택한 애니">
          <Button
            variant="text"
            size="m"
            className={styles.toolbarButton}
            disabled={shown.length === 0}
            onClick={() => setSelected(new Set(allSelected ? [] : shown.map((r) => r.id)))}
          >
            {allSelected ? '선택 해제' : '전체 선택'}
          </Button>
          <Button
            variant="dangerText"
            size="m"
            className={styles.toolbarButton}
            disabled={selected.size === 0}
            onClick={() => setRemovingIds([...selected])}
          >
            삭제
          </Button>
        </div>
      )}

      {open && (
        <AnimeDetailSheet
          key={open.id}
          anime={open}
          onEditReview={() => setEditingId(open.id)}
          onRemove={() => setRemovingIds([open.id])}
          onClose={() => setOpenId(null)}
        />
      )}
      {editing && (
        <ReviewSheet
          key={editing.id}
          anime={editing}
          submitLabel="저장하기"
          onSubmit={saveReview}
          onCancel={() => setEditingId(null)}
        />
      )}
      {filterOpen && (
        <FilterSheet
          records={records}
          facets={facets}
          facetStatus={facetStatus}
          filter={filter}
          language={language}
          onApply={(next) => {
            changeFilter(next);
            setFilterOpen(false);
          }}
          onClose={() => setFilterOpen(false)}
        />
      )}
      {removing?.length > 0 && (
        <RemoveDialog
          animes={removing}
          onConfirm={removeAnime}
          onCancel={() => setRemovingIds(null)}
        />
      )}
    </div>
  );
}
