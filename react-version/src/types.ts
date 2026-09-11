/** One small goal on a road. Toggled by hand — green when reached. */
export type Step = {
  id: string;
  label: string;
  done: boolean;
  /** ISO timestamp of the last time it was toggled on. */
  doneAt?: string;
};

/** "The road I want to take" — an ordered list of small goals. */
export type Road = {
  id: string;
  name: string;
  steps: Step[];
};

/** One swipeable page — an area of life you want to move forward in. */
export type Category = {
  id: string;
  name: string;
  color: string;
  order: number;
  roads: Road[];
};

export type AppState = {
  version: number;
  categories: Category[];
};
