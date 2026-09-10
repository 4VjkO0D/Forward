import { useEffect, useRef, useState } from 'react';

type Props = {
  buttonLabel: string;
  placeholder?: string;
  onAdd: (value: string) => void;
};

/**
 * A dashed "+ Add …" button that unfolds into a text field.
 * Enter keeps the field open so several items can be added in a row.
 */
export function AddInline({ buttonLabel, placeholder, onAdd }: Props) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const commit = () => {
    const value = text.trim();
    if (!value) return;
    onAdd(value);
    setText('');
  };

  if (!open) {
    return (
      <button type="button" className="add-btn" onClick={() => setOpen(true)}>
        + {buttonLabel}
      </button>
    );
  }

  return (
    <div className="add-inline">
      <input
        ref={inputRef}
        className="input"
        value={text}
        placeholder={placeholder}
        aria-label={buttonLabel}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            commit();
          }
          if (event.key === 'Escape') {
            event.preventDefault();
            setText('');
            setOpen(false);
          }
        }}
        onBlur={() => {
          commit();
          setOpen(false);
        }}
      />
      <button
        type="button"
        className="btn btn-primary"
        // Keeping focus on the input avoids a blur/click race when tapping Add.
        onMouseDown={(event) => event.preventDefault()}
        onClick={commit}
      >
        Add
      </button>
    </div>
  );
}
