import styles from './SegmentedControl.module.css';

// A choice of one among a few, all visible: `options` are
// `[{ value, label, lang? }]`. Name the group with `aria-label` or
// `aria-labelledby`. `grow` spreads it across the row, as tabs.
export default function SegmentedControl({ options, value, onChange, disabled, grow = false, ...rest }) {
  return (
    <div className={styles.group} role="radiogroup" data-grow={grow || undefined} {...rest}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={option.value === value}
          lang={option.lang}
          disabled={disabled}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
