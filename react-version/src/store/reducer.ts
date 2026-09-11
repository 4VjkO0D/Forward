import type { AppState, Category, Road, Step } from '../types';
import { uid } from '../lib/id';

export const APP_VERSION = 1;

/** Accent colours offered when creating a page. */
export const PALETTE = [
  '#7c5cff',
  '#22d3ee',
  '#22c55e',
  '#f59e0b',
  '#ef4444',
  '#ec4899',
  '#8b5cf6',
  '#14b8a6',
];

export type Action =
  | { type: 'hydrate'; state: AppState }
  | { type: 'addCategory'; name: string; color?: string }
  | { type: 'renameCategory'; id: string; name: string }
  | { type: 'deleteCategory'; id: string }
  | { type: 'addRoad'; categoryId: string; name: string }
  | { type: 'renameRoad'; categoryId: string; roadId: string; name: string }
  | { type: 'deleteRoad'; categoryId: string; roadId: string }
  | { type: 'addStep'; categoryId: string; roadId: string; label: string }
  | { type: 'updateStep'; categoryId: string; roadId: string; stepId: string; label: string }
  | { type: 'toggleStep'; categoryId: string; roadId: string; stepId: string }
  | { type: 'deleteStep'; categoryId: string; roadId: string; stepId: string }
  | {
      type: 'moveStep';
      categoryId: string;
      roadId: string;
      stepId: string;
      direction: 'up' | 'down';
    };

/* ------------------------------- helpers ------------------------------- */

function mapCategory(state: AppState, id: string, fn: (category: Category) => Category): AppState {
  return {
    ...state,
    categories: state.categories.map((category) => (category.id === id ? fn(category) : category)),
  };
}

function mapRoad(
  state: AppState,
  categoryId: string,
  roadId: string,
  fn: (road: Road) => Road,
): AppState {
  return mapCategory(state, categoryId, (category) => ({
    ...category,
    roads: category.roads.map((road) => (road.id === roadId ? fn(road) : road)),
  }));
}

function toggleStep(stepId: string, steps: Step[]): Step[] {
  return steps.map((step) => {
    if (step.id !== stepId) return step;
    const done = !step.done;
    return { ...step, done, doneAt: done ? new Date().toISOString() : undefined };
  });
}

function moveStep(steps: Step[], stepId: string, direction: 'up' | 'down'): Step[] {
  const from = steps.findIndex((step) => step.id === stepId);
  const to = direction === 'up' ? from - 1 : from + 1;
  if (from < 0 || to < 0 || to >= steps.length) return steps;
  const next = steps.slice();
  const a = next[from];
  const b = next[to];
  next[from] = b;
  next[to] = a;
  return next;
}

/** A friendly starting point so a brand new install isn't a blank wall. */
export function createSeedState(): AppState {
  const now = new Date().toISOString();

  return {
    version: APP_VERSION,
    categories: [
      {
        id: uid('cat'),
        name: 'Health',
        color: PALETTE[2],
        order: 0,
        roads: [
          {
            id: uid('road'),
            name: 'Get fit',
            steps: [
              { id: uid('step'), label: 'Walk 15 min', done: true, doneAt: now },
              { id: uid('step'), label: 'Walk 30 min', done: true, doneAt: now },
              { id: uid('step'), label: 'Walk 45 min', done: false },
              { id: uid('step'), label: 'Run 2 km', done: false },
              { id: uid('step'), label: 'Run 5 km', done: false },
            ],
          },
          {
            id: uid('road'),
            name: 'Sleep better',
            steps: [
              { id: uid('step'), label: 'In bed by 01:00', done: true, doneAt: now },
              { id: uid('step'), label: 'In bed by 00:00', done: false },
              { id: uid('step'), label: 'In bed by 23:00', done: false },
            ],
          },
        ],
      },
      {
        id: uid('cat'),
        name: 'School',
        color: PALETTE[1],
        order: 1,
        roads: [
          {
            id: uid('road'),
            name: 'Study rhythm',
            steps: [
              { id: uid('step'), label: 'Review notes 15 min', done: true, doneAt: now },
              { id: uid('step'), label: 'Review notes 30 min', done: false },
              { id: uid('step'), label: 'Finish one practice test', done: false },
            ],
          },
        ],
      },
    ],
  };
}

/* ------------------------------- reducer ------------------------------- */

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'hydrate':
      return action.state;

    case 'addCategory': {
      const category: Category = {
        id: uid('cat'),
        name: action.name.trim() || 'New page',
        color: action.color ?? PALETTE[state.categories.length % PALETTE.length],
        order: state.categories.length,
        roads: [],
      };
      return { ...state, categories: [...state.categories, category] };
    }

    case 'renameCategory':
      return mapCategory(state, action.id, (category) => ({
        ...category,
        name: action.name.trim() || category.name,
      }));

    case 'deleteCategory':
      return {
        ...state,
        categories: state.categories.filter((category) => category.id !== action.id),
      };

    case 'addRoad':
      return mapCategory(state, action.categoryId, (category) => ({
        ...category,
        roads: [
          ...category.roads,
          { id: uid('road'), name: action.name.trim() || 'New road', steps: [] },
        ],
      }));

    case 'renameRoad':
      return mapRoad(state, action.categoryId, action.roadId, (road) => ({
        ...road,
        name: action.name.trim() || road.name,
      }));

    case 'deleteRoad':
      return mapCategory(state, action.categoryId, (category) => ({
        ...category,
        roads: category.roads.filter((road) => road.id !== action.roadId),
      }));

    case 'addStep':
      return mapRoad(state, action.categoryId, action.roadId, (road) => ({
        ...road,
        steps: [
          ...road.steps,
          { id: uid('step'), label: action.label.trim() || 'New goal', done: false },
        ],
      }));

    case 'updateStep':
      return mapRoad(state, action.categoryId, action.roadId, (road) => ({
        ...road,
        steps: road.steps.map((step) =>
          step.id === action.stepId ? { ...step, label: action.label.trim() || step.label } : step,
        ),
      }));

    case 'toggleStep':
      return mapRoad(state, action.categoryId, action.roadId, (road) => ({
        ...road,
        steps: toggleStep(action.stepId, road.steps),
      }));

    case 'deleteStep':
      return mapRoad(state, action.categoryId, action.roadId, (road) => ({
        ...road,
        steps: road.steps.filter((step) => step.id !== action.stepId),
      }));

    case 'moveStep':
      return mapRoad(state, action.categoryId, action.roadId, (road) => ({
        ...road,
        steps: moveStep(road.steps, action.stepId, action.direction),
      }));

    default:
      return state;
  }
}
