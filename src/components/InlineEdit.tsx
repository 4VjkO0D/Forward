import { useEffect, useRef, useState } from 'react';

type Props = {
  value: string;
  onSave: (next: string) => void;
  /** Class applied to the read-only label (e.g. `cat-title`). */
  className?: string;
  /** Class applied to the input while editing. */
  inputClassName?: string;
  ariaLabel: string;
};

/** Shows text with a small pencil; tapping it swaps in an input. */
export function InlineEdit({ value, onSave, className, inputClassName, ariaLabel }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const settled = useRef(false);

  useEffect(() => {
    if (editing) {
      setDraft(value);
      settled.current = false;
    }
  }, [editing, value]);

  const commit = () => {
    if (settled.current) return;
    settled.current = true;
    const next = draft.trim();
    if (next && next !== value) onSave(next);
    setEditing(false);
  };

  const cancel = () => {
    settled.current = true;
    setEditing(false);
  };

  if (!editing) {
    return (
      <span className={className}>
        <span className="inline-edit-text">{value}</span>
        <button
          type="button"
          className="icon-btn ghost"
          aria-label={ariaLabel}
          onClick={() => setEditing(true)}
        >
          ✎
        </button>
      </span>
    );
  }

  return (
    <input
      className={`input ${inputClassName ?? ''}`.trim()}
      value={draft}
      autoFocus
      aria-label={ariaLabel}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          commit();
        }
        if (event.key === 'Escape') {
          event.preventDefault();
          cancel();
        }
      }}
    />
  );
}
