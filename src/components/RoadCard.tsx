import type { Road } from '../types';
import { useStore } from '../store/StoreContext';
import { AddInline } from './AddInline';
import { InlineEdit } from './InlineEdit';
import { StepRow } from './StepRow';

type Props = {
  categoryId: string;
  road: Road;
};

/** A road: the ordered goals you walk from where you are to where you want to be. */
export function RoadCard({ categoryId, road }: Props) {
  const { dispatch } = useStore();
  const total = road.steps.length;
  const done = road.steps.filter((step) => step.done).length;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);

  return (
    <article className="road">
      <div className="road-head">
        <InlineEdit
          className="road-title"
          value={road.name}
          ariaLabel="Rename road"
          onSave={(name) => dispatch({ type: 'renameRoad', categoryId, roadId: road.id, name })}
        />
        <span className="road-count">
          {done}/{total}
        </span>
        <button
          type="button"
          className="icon-btn ghost"
          aria-label="Delete road"
          onClick={() => {
            if (window.confirm(`Delete the road "${road.name}"?`)) {
              dispatch({ type: 'deleteRoad', categoryId, roadId: road.id });
            }
          }}
        >
          🗑
        </button>
      </div>

      <div className="road-bar">
        <span style={{ width: `${percent}%` }} />
      </div>

      <ul className="steps">
        {road.steps.map((step, i) => (
          <StepRow
            key={step.id}
            categoryId={categoryId}
            roadId={road.id}
            step={step}
            index={i}
            count={total}
          />
        ))}
      </ul>

      {total === 0 && <p className="road-hint">No goals yet — add the first small step.</p>}

      <AddInline
        buttonLabel="Add goal"
        placeholder="e.g. Walk 30 min"
        onAdd={(label) => dispatch({ type: 'addStep', categoryId, roadId: road.id, label })}
      />
    </article>
  );
}
