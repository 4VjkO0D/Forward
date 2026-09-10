import type { CSSProperties } from 'react';
import type { Category } from '../types';
import { useStore } from '../store/StoreContext';
import { AddInline } from './AddInline';
import { InlineEdit } from './InlineEdit';
import { RoadCard } from './RoadCard';

export function CategoryPage({ category }: { category: Category }) {
  const { dispatch } = useStore();

  const total = category.roads.reduce((sum, road) => sum + road.steps.length, 0);
  const done = category.roads.reduce(
    (sum, road) => sum + road.steps.filter((step) => step.done).length,
    0,
  );
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);

  return (
    <div className="cat" style={{ '--accent': category.color } as CSSProperties}>
      <header className="cat-head">
        <InlineEdit
          className="cat-title"
          inputClassName="cat-title-input"
          value={category.name}
          ariaLabel="Rename page"
          onSave={(name) => dispatch({ type: 'renameCategory', id: category.id, name })}
        />
        <p className="cat-meta">
          {total === 0 ? 'No goals yet' : `${done} of ${total} goals reached`}
        </p>
        <div className="cat-bar">
          <span style={{ width: `${percent}%` }} />
        </div>
      </header>

      <div className="roads">
        {category.roads.map((road) => (
          <RoadCard key={road.id} categoryId={category.id} road={road} />
        ))}
      </div>

      <AddInline
        buttonLabel="Add road"
        placeholder="e.g. Get fit"
        onAdd={(name) => dispatch({ type: 'addRoad', categoryId: category.id, name })}
      />

      <div className="cat-foot">
        <button
          type="button"
          className="danger-ghost"
          onClick={() => {
            if (window.confirm(`Delete the page "${category.name}" and everything on it?`)) {
              dispatch({ type: 'deleteCategory', id: category.id });
            }
          }}
        >
          Delete this page
        </button>
      </div>
    </div>
  );
}
