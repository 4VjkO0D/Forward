import { useState } from 'react';
import type { Step } from '../types';
import { useStore } from '../store/StoreContext';

type Props = {
  categoryId: string;
  roadId: string;
  step: Step;
  index: number;
  count: number;
};

/** One goal: tap it to turn it green, tap again if you didn't hold the level. */
export function StepRow({ categoryId, roadId, step, index, count }: Props) {
  const { dispatch } = useStore();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(step.label);

  const startEdit = () => {
    setDraft(step.label);
    setEditing(true);
  };

  const save = () => {
    const next = draft.trim();
    if (next && next !== step.label) {
      dispatch({ type: 'updateStep', categoryId, roadId, stepId: step.id, label: next });
    }
    setEditing(false);
  };

  const move = (direction: 'up' | 'down') =>
    dispatch({ type: 'moveStep', categoryId, roadId, stepId: step.id, direction });

  return (
    <li className={step.done ? 'step done' : 'step'}>
      {editing ? (
        <input
          className="input step-edit"
          value={draft}
          autoFocus
          aria-label="Goal text"
          onChange={(event) => setDraft(event.target.value)}
          onBlur={save}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              save();
            }
            if (event.key === 'Escape') {
              event.preventDefault();
              setEditing(false);
            }
          }}
        />
      ) : (
        <button
          type="button"
          className="step-toggle"
          aria-pressed={step.done}
          onClick={() => dispatch({ type: 'toggleStep', categoryId, roadId, stepId: step.id })}
        >
          <span className="check" aria-hidden="true">
            {step.done ? '✓' : ''}
          </span>
          <span className="step-label">{step.label}</span>
        </button>
      )}

      <div className="step-actions">
        <button
          type="button"
          className="icon-btn ghost"
          aria-label="Rename goal"
          onClick={startEdit}
        >
          ✎
        </button>
        <button
          type="button"
          className="icon-btn ghost"
          aria-label="Move goal up"
          disabled={index === 0}
          onClick={() => move('up')}
        >
          ↑
        </button>
        <button
          type="button"
          className="icon-btn ghost"
          aria-label="Move goal down"
          disabled={index === count - 1}
          onClick={() => move('down')}
        >
          ↓
        </button>
        <button
          type="button"
          className="icon-btn ghost"
          aria-label="Delete goal"
          onClick={() => dispatch({ type: 'deleteStep', categoryId, roadId, stepId: step.id })}
        >
          ✕
        </button>
      </div>
    </li>
  );
}
