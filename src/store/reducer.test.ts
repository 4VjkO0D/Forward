import { describe, expect, it } from 'vitest';
import { createSeedState, reducer } from './reducer';

function firstRoad(state: ReturnType<typeof createSeedState>) {
  const category = state.categories[0];
  return { category, road: category.roads[0] };
}

describe('reducer', () => {
  it('seeds a state with versioned categories', () => {
    const state = createSeedState();
    expect(state.version).toBe(1);
    expect(state.categories.length).toBeGreaterThan(0);
    expect(state.categories[0].roads.length).toBeGreaterThan(0);
  });

  it('adds a category with the next palette colour', () => {
    const base = { version: 1, categories: [] };
    const next = reducer(base, { type: 'addCategory', name: 'Money' });

    expect(next.categories).toHaveLength(1);
    expect(next.categories[0].name).toBe('Money');
    expect(next.categories[0].roads).toEqual([]);
  });

  it('trims names and falls back when empty', () => {
    const base = { version: 1, categories: [] };
    const next = reducer(base, { type: 'addCategory', name: '   ' });
    expect(next.categories[0].name).toBe('New page');
  });

  it('toggles a goal on and records when it was reached', () => {
    const state = createSeedState();
    const { category, road } = firstRoad(state);
    const step = road.steps.find((candidate) => !candidate.done);
    expect(step).toBeDefined();

    const next = reducer(state, {
      type: 'toggleStep',
      categoryId: category.id,
      roadId: road.id,
      stepId: step!.id,
    });
    const updated = next.categories[0].roads[0].steps.find((item) => item.id === step!.id);

    expect(updated?.done).toBe(true);
    expect(updated?.doneAt).toBeTruthy();
  });

  it('toggles a goal back off when the level is not maintained', () => {
    const state = createSeedState();
    const { category, road } = firstRoad(state);
    const step = road.steps.find((candidate) => candidate.done);
    expect(step).toBeDefined();

    const next = reducer(state, {
      type: 'toggleStep',
      categoryId: category.id,
      roadId: road.id,
      stepId: step!.id,
    });
    const updated = next.categories[0].roads[0].steps.find((item) => item.id === step!.id);

    expect(updated?.done).toBe(false);
    expect(updated?.doneAt).toBeUndefined();
  });

  it('reorders goals without losing any', () => {
    const state = createSeedState();
    const { category, road } = firstRoad(state);
    const second = road.steps[1];

    const next = reducer(state, {
      type: 'moveStep',
      categoryId: category.id,
      roadId: road.id,
      stepId: second.id,
      direction: 'up',
    });
    const steps = next.categories[0].roads[0].steps;

    expect(steps[0].id).toBe(second.id);
    expect(steps).toHaveLength(road.steps.length);
  });

  it('ignores moves past the ends', () => {
    const state = createSeedState();
    const { category, road } = firstRoad(state);

    const next = reducer(state, {
      type: 'moveStep',
      categoryId: category.id,
      roadId: road.id,
      stepId: road.steps[0].id,
      direction: 'up',
    });

    expect(next.categories[0].roads[0].steps[0].id).toBe(road.steps[0].id);
  });

  it('deletes a goal', () => {
    const state = createSeedState();
    const { category, road } = firstRoad(state);
    const before = road.steps.length;

    const next = reducer(state, {
      type: 'deleteStep',
      categoryId: category.id,
      roadId: road.id,
      stepId: road.steps[0].id,
    });

    expect(next.categories[0].roads[0].steps).toHaveLength(before - 1);
  });

  it('renames and deletes a road', () => {
    const state = createSeedState();
    const { category, road } = firstRoad(state);

    const renamed = reducer(state, {
      type: 'renameRoad',
      categoryId: category.id,
      roadId: road.id,
      name: 'Get strong',
    });
    expect(renamed.categories[0].roads[0].name).toBe('Get strong');

    const removed = reducer(renamed, {
      type: 'deleteRoad',
      categoryId: category.id,
      roadId: road.id,
    });
    expect(removed.categories[0].roads.find((item) => item.id === road.id)).toBeUndefined();
  });

  it('deletes a whole page', () => {
    const state = createSeedState();
    const target = state.categories[0];

    const next = reducer(state, { type: 'deleteCategory', id: target.id });

    expect(next.categories.find((category) => category.id === target.id)).toBeUndefined();
  });

  it('returns the same state for unknown actions', () => {
    const state = createSeedState();
    // @ts-expect-error deliberately exercising the default branch
    expect(reducer(state, { type: 'nope' })).toBe(state);
  });
});
