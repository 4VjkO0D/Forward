import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import App from './App';

beforeEach(() => {
  // Each test starts from the freshly seeded state.
  localStorage.clear();

  // jsdom has no layout engine, so smooth scrolling is stubbed out.
  try {
    Object.defineProperty(Element.prototype, 'scrollTo', {
      value: () => {},
      writable: true,
      configurable: true,
    });
  } catch {
    /* a usable stub already exists */
  }
});

afterEach(() => {
  cleanup();
});

describe('Forward app', () => {
  it('renders every seeded page in the swipe deck', () => {
    render(<App />);

    expect(screen.getByText('Health')).toBeTruthy();
    expect(screen.getByText('School')).toBeTruthy();
    expect(screen.getByText('Get fit')).toBeTruthy();
  });

  it('turns a goal green when you reach it', () => {
    render(<App />);
    expect(screen.getByText('3 of 8 goals reached')).toBeTruthy();

    const toggle = screen.getByText('Walk 45 min').closest('button');
    expect(toggle?.getAttribute('aria-pressed')).toBe('false');

    fireEvent.click(toggle as HTMLButtonElement);

    expect(toggle?.getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByText('4 of 8 goals reached')).toBeTruthy();
  });

  it('lets you un-maintain a goal by toggling it back off', () => {
    render(<App />);

    const toggle = screen.getByText('Walk 15 min').closest('button');
    expect(toggle?.getAttribute('aria-pressed')).toBe('true');

    fireEvent.click(toggle as HTMLButtonElement);

    expect(toggle?.getAttribute('aria-pressed')).toBe('false');
    expect(screen.getByText('2 of 8 goals reached')).toBeTruthy();
  });

  it('adds a new page through the modal', () => {
    render(<App />);

    fireEvent.click(screen.getByText('+ Page'));
    fireEvent.change(screen.getByPlaceholderText('Health, School, Money…'), {
      target: { value: 'Money' },
    });
    fireEvent.click(screen.getByText('Create page'));

    expect(screen.getByText('Money')).toBeTruthy();
  });
});
