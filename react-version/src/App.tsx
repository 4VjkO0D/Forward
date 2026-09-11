import { useMemo, useState } from 'react';
import { CategoryPage } from './components/CategoryPage';
import { NewCategoryModal } from './components/NewCategoryModal';
import { SwipeDeck, type DeckPage } from './components/SwipeDeck';
import { StoreProvider, useStore } from './store/StoreContext';

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  );
}

function Shell() {
  const { state } = useStore();
  const [creating, setCreating] = useState(false);

  const pages = useMemo<DeckPage[]>(
    () =>
      state.categories.map((category) => ({
        key: category.id,
        node: <CategoryPage category={category} />,
      })),
    [state.categories],
  );

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-name">Forward</span>
          <span className="brand-tag">one step at a time</span>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setCreating(true)}>
          + Page
        </button>
      </header>

      {state.categories.length === 0 ? (
        <div className="empty">
          <h2>No pages yet</h2>
          <p>
            Create a page for an area of life you want to move forward in — health, school,
            anything. Then add the small goals you want to reach.
          </p>
          <button type="button" className="btn btn-primary" onClick={() => setCreating(true)}>
            Create your first page
          </button>
        </div>
      ) : (
        <SwipeDeck pages={pages} />
      )}

      <NewCategoryModal open={creating} onClose={() => setCreating(false)} />
    </div>
  );
}
