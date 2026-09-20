/*
 * Forward — plain HTML + CSS + JS. No build step, no framework, no dependencies.
 *
 * Open index.html in a browser (double-click works). Data is kept in
 * localStorage, so it stays on this device.
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'forward.state.v1';
  var PALETTE = [
    '#7c5cff',
    '#22d3ee',
    '#22c55e',
    '#f59e0b',
    '#ef4444',
    '#ec4899',
    '#8b5cf6',
    '#14b8a6',
  ];

  var deck = document.getElementById('deck');
  var dotsEl = document.getElementById('dots');
  var modal = document.getElementById('modal');
  var modalName = document.getElementById('modal-name');
  var swatchesEl = document.getElementById('modal-swatches');

  /* -------------------------------- state -------------------------------- */

  var state = loadState();
  var ui = { openAdd: null, editing: null, color: PALETTE[0] };

  function uid(prefix) {
    return (
      prefix + '_' + Date.now().toString(36).slice(-5) + Math.random().toString(36).slice(2, 8)
    );
  }

  function seedState() {
    var now = new Date().toISOString();
    return {
      version: 1,
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

  function loadState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return seedState();
      var parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.categories)) return seedState();
      return parsed;
    } catch (err) {
      return seedState();
    }
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      /* Private mode or storage disabled: keep working in memory only. */
    }
  }

  /* ------------------------------- lookups ------------------------------- */

  function getCategory(id) {
    return state.categories.filter(function (c) {
      return c.id === id;
    })[0];
  }

  function getRoad(categoryId, roadId) {
    var category = getCategory(categoryId);
    if (!category) return undefined;
    return category.roads.filter(function (r) {
      return r.id === roadId;
    })[0];
  }

  function esc(value) {
    return String(value).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }

  /* ------------------------------ rendering ------------------------------ */

  function attrs(ctx) {
    var out = '';
    if (ctx.cat) out += ' data-cat="' + ctx.cat + '"';
    if (ctx.road) out += ' data-road="' + ctx.road + '"';
    if (ctx.step) out += ' data-step="' + ctx.step + '"';
    return out;
  }

  /** A name you can rename: text + a pencil, or an input while editing. */
  function titleBlock(kind, id, ctx, value, className, inputClass) {
    var editing = ui.editing && ui.editing.kind === kind && ui.editing.id === id;

    if (editing) {
      return (
        '<input class="input ' + inputClass + '" data-input="edit" data-kind="' + kind + '"' +
        attrs(ctx) + ' data-focus-key="edit-' + kind + '-' + id + '" value="' + esc(value) + '">'
      );
    }

    return (
      '<span class="' + className + '">' +
      '<span class="inline-edit-text">' + esc(value) + '</span>' +
      '<button type="button" class="icon-btn ghost" aria-label="Rename" data-action="edit"' +
      ' data-kind="' + kind + '"' + attrs(ctx) + '>✎</button>' +
      '</span>'
    );
  }

  /** "+ Add …" that unfolds into a text field. */
  function addBlock(action, key, ctx, label, placeholder) {
    if (ui.openAdd === key) {
      return (
        '<div class="add-inline">' +
        '<input class="input" data-input="add" data-key="' + key + '"' + attrs(ctx) +
        ' data-focus-key="' + key + '" placeholder="' + esc(placeholder) + '">' +
        '<button type="button" class="btn btn-primary" data-action="commit-add" data-key="' +
        key + '">Add</button>' +
        '</div>'
      );
    }

    return (
      '<button type="button" class="add-btn" data-action="' + action + '"' + attrs(ctx) + '>' +
      '+ ' + esc(label) +
      '</button>'
    );
  }

  function stepHTML(categoryId, roadId, item, index, count) {
    var ctx = { cat: categoryId, road: roadId, step: item.id };
    var editing = ui.editing && ui.editing.kind === 'step' && ui.editing.id === item.id;

    var head = editing
      ? '<input class="input step-edit" data-input="edit" data-kind="step"' + attrs(ctx) +
        ' data-focus-key="edit-step-' + item.id + '" value="' + esc(item.label) + '">'
      : '<button type="button" class="step-toggle" aria-pressed="' + item.done + '"' +
        ' data-action="toggle-step"' + attrs(ctx) + '>' +
        '<span class="check" aria-hidden="true">' + (item.done ? '✓' : '') + '</span>' +
        '<span class="step-label">' + esc(item.label) + '</span>' +
        '</button>';

    var actions =
      '<div class="step-actions">' +
      '<button type="button" class="icon-btn ghost" aria-label="Rename goal" data-action="edit"' +
      ' data-kind="step"' + attrs(ctx) + '>✎</button>' +
      '<button type="button" class="icon-btn ghost" aria-label="Move goal up"' +
      ' data-action="move-up"' + attrs(ctx) + (index === 0 ? ' disabled' : '') + '>↑</button>' +
      '<button type="button" class="icon-btn ghost" aria-label="Move goal down"' +
      ' data-action="move-down"' + attrs(ctx) + (index === count - 1 ? ' disabled' : '') + '>↓</button>' +
      '<button type="button" class="icon-btn ghost" aria-label="Delete goal"' +
      ' data-action="delete-step"' + attrs(ctx) + '>✕</button>' +
      '</div>';

    return '<li class="step' + (item.done ? ' is-done' : '') + '">' + head + actions + '</li>';
  }

  function roadHTML(category, r) {
    var total = r.steps.length;
    var done = 0;
    r.steps.forEach(function (s) {
      if (s.done) done++;
    });
    var pct = total ? Math.round((done / total) * 100) : 0;
    var ctx = { cat: category.id, road: r.id };

    var steps = r.steps
      .map(function (s, i) {
        return stepHTML(category.id, r.id, s, i, total);
      })
      .join('');

    return (
      '<article class="road">' +
      '<div class="road-head">' +
      titleBlock('road', r.id, ctx, r.name, 'road-title', 'road-title-input') +
      '<span class="road-count">' + done + '/' + total + '</span>' +
      '<button type="button" class="icon-btn ghost" aria-label="Delete road"' +
      ' data-action="delete-road"' + attrs(ctx) + '>🗑</button>' +
      '</div>' +
      '<div class="road-bar"><span style="width:' + pct + '%"></span></div>' +
      '<ul class="steps">' + steps + '</ul>' +
      (total === 0 ? '<p class="road-hint">No goals yet — add the first small step.</p>' : '') +
      addBlock('add-goal', 'add-goal:' + r.id, ctx, 'Add goal', 'e.g. Walk 30 min') +
      '</article>'
    );
  }

  function pageHTML(category) {
    var total = 0;
    var done = 0;
    category.roads.forEach(function (r) {
      r.steps.forEach(function (s) {
        total++;
        if (s.done) done++;
      });
    });
    var pct = total ? Math.round((done / total) * 100) : 0;
    var ctx = { cat: category.id };

    var roads = category.roads
      .map(function (r) {
        return roadHTML(category, r);
      })
      .join('');

    return (
      '<section class="page">' +
      '<div class="cat" style="--accent:' + category.color + '">' +
      '<header class="cat-head">' +
      titleBlock('category', category.id, ctx, category.name, 'cat-title', 'cat-title-input') +
      '<p class="cat-meta">' +
      (total === 0 ? 'No goals yet' : done + ' of ' + total + ' goals reached') +
      '</p>' +
      '<div class="cat-bar"><span style="width:' + pct + '%"></span></div>' +
      '</header>' +
      '<div class="roads">' + roads + '</div>' +
      addBlock('add-road', 'add-road:' + category.id, ctx, 'Add road', 'e.g. Get fit') +
      '<div class="cat-foot">' +
      '<button type="button" class="danger-ghost" data-action="delete-category"' +
      attrs(ctx) + '>Delete this page</button>' +
      '</div>' +
      '</div></section>'
    );
  }

  /* -------------------------------- render -------------------------------- */

  function render() {
    var prevLeft = deck.scrollLeft;
    var prevTops = [];
    var oldPages = deck.querySelectorAll('.page');
    for (var i = 0; i < oldPages.length; i++) prevTops.push(oldPages[i].scrollTop);

    var focus = captureFocus();

    if (state.categories.length === 0) {
      deck.classList.add('is-empty');
      deck.innerHTML =
        '<div class="empty">' +
        '<h2>No pages yet</h2>' +
        '<p>Create a page for an area of life you want to move forward in — health, school, ' +
        'anything. Then add the small goals you want to reach.</p>' +
        '<button type="button" class="btn btn-primary" data-action="new-page">' +
        'Create your first page</button>' +
        '</div>';
    } else {
      deck.classList.remove('is-empty');
      deck.innerHTML = state.categories.map(pageHTML).join('');
    }

    // Put the pager (and each page's scroll position) back where it was.
    deck.scrollLeft = prevLeft;
    var newPages = deck.querySelectorAll('.page');
    for (var j = 0; j < newPages.length; j++) {
      if (prevTops[j] != null) newPages[j].scrollTop = prevTops[j];
    }

    renderDots();
    restoreFocus(focus);
    save();
  }

  function currentIndex() {
    var width = deck.clientWidth || 1;
    return Math.max(0, Math.min(state.categories.length - 1, Math.round(deck.scrollLeft / width)));
  }

  function renderDots() {
    if (state.categories.length < 2) {
      dotsEl.innerHTML = '';
      return;
    }

    var active = currentIndex();
    dotsEl.innerHTML = state.categories
      .map(function (category, i) {
        return (
          '<button type="button" class="dot' + (i === active ? ' is-active' : '') + '"' +
          ' aria-label="Page ' + (i + 1) + '"' +
          (i === active ? ' aria-current="true"' : '') +
          ' data-action="go-page" data-index="' + i + '"></button>'
        );
      })
      .join('');
  }

  function goToPage(index) {
    var clamped = Math.max(0, Math.min(state.categories.length - 1, index));
    deck.scrollTo({ left: clamped * deck.clientWidth, behavior: 'smooth' });
  }

  /* --------------------------- focus bookkeeping ---------------------------
   * The whole deck is re-rendered after every change, so remember which box
   * the user was typing in and put the caret back afterwards.
   * ---------------------------------------------------------------------- */

  function captureFocus() {
    var el = document.activeElement;
    if (!el || !el.dataset || !el.dataset.focusKey) return null;
    return { key: el.dataset.focusKey, start: el.selectionStart, end: el.selectionEnd };
  }

  function restoreFocus(snapshot) {
    if (!snapshot) return;
    var el = deck.querySelector('[data-focus-key="' + snapshot.key + '"]');
    if (!el) return;
    el.focus();
    try {
      el.setSelectionRange(snapshot.start, snapshot.end);
    } catch (err) {
      /* not every input type supports selection ranges */
    }
  }

  /* ------------------------------- changes ------------------------------- */

  function indexOfId(list, id) {
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) return i;
    }
    return -1;
  }

  /**
   * Goals on a road are cumulative — they are levels, not a checklist.
   *
   *   tap the 4th  ->  1st, 2nd, 3rd and 4th all turn green
   *   untap the 2nd -> 2nd, 3rd, 4th … all go grey again
   *
   * Reaching only ever *adds* the goals before it, and letting go only ever
   * *removes* the goals after it — so it never invents a level you didn't reach.
   */
  function toggleStepDone(categoryId, roadId, stepId) {
    var r = getRoad(categoryId, roadId);
    if (!r) return;

    var at = indexOfId(r.steps, stepId);
    if (at < 0) return;

    var reaching = !r.steps[at].done;
    var now = new Date().toISOString();

    r.steps.forEach(function (item, index) {
      if (reaching) {
        // You've reached this level: everything up to it comes with it.
        if (index <= at && !item.done) {
          item.done = true;
          item.doneAt = now;
        }
      } else {
        // You've dropped back to this level: everything above it goes.
        if (index >= at && item.done) {
          item.done = false;
          delete item.doneAt;
        }
      }
    });
  }

  function moveStepItem(categoryId, roadId, stepId, direction) {
    var r = getRoad(categoryId, roadId);
    if (!r) return;
    var from = indexOfId(r.steps, stepId);
    var to = direction === 'up' ? from - 1 : from + 1;
    if (from < 0 || to < 0 || to >= r.steps.length) return;
    var moved = r.steps.splice(from, 1)[0];
    r.steps.splice(to, 0, moved);
  }

  function removeStep(categoryId, roadId, stepId) {
    var r = getRoad(categoryId, roadId);
    if (!r) return;
    var i = indexOfId(r.steps, stepId);
    if (i >= 0) r.steps.splice(i, 1);
  }

  function removeRoad(categoryId, roadId) {
    var c = getCategory(categoryId);
    if (!c) return;
    var i = indexOfId(c.roads, roadId);
    if (i >= 0) c.roads.splice(i, 1);
  }

  function removeCategory(categoryId) {
    var i = indexOfId(state.categories, categoryId);
    if (i >= 0) state.categories.splice(i, 1);
    if (ui.openAdd && ui.openAdd.indexOf(categoryId) >= 0) ui.openAdd = null;
    if (ui.editing && ui.editing.id === categoryId) ui.editing = null;
  }

  /** Enter, blur or "Add" — turn whatever is typed into state. */
  function commitInput(el) {
    if (el.dataset.committed === '1') return;
    el.dataset.committed = '1';

    var value = el.value.trim();

    if (el.dataset.input === 'add') {
      if (!value) {
        ui.openAdd = null;
        render();
        return;
      }

      if (el.dataset.key.indexOf('add-goal:') === 0) {
        var targetRoad = getRoad(el.dataset.cat, el.dataset.road);
        if (targetRoad) {
          targetRoad.steps.push({ id: uid('step'), label: value, done: false });
        }
      } else {
        var targetCategory = getCategory(el.dataset.cat);
        if (targetCategory) {
          targetCategory.roads.push({ id: uid('road'), name: value, steps: [] });
        }
      }

      // ui.openAdd is left alone, so the field stays open for the next goal.
      render();
      return;
    }

    if (value) {
      if (el.dataset.kind === 'category') {
        var category = getCategory(el.dataset.cat);
        if (category) category.name = value;
      } else if (el.dataset.kind === 'road') {
        var road = getRoad(el.dataset.cat, el.dataset.road);
        if (road) road.name = value;
      } else if (el.dataset.kind === 'step') {
        var owner = getRoad(el.dataset.cat, el.dataset.road);
        if (owner) {
          var i = indexOfId(owner.steps, el.dataset.step);
          if (i >= 0) owner.steps[i].label = value;
        }
      }
    }

    ui.editing = null;
    render();
  }

  /* -------------------------------- events -------------------------------- */

  function closestAction(node) {
    return node && node.closest ? node.closest('[data-action]') : null;
  }

  function onClick(event) {
    // Clicking the dark backdrop closes the dialog.
    if (event.target === modal) {
      closeModal();
      return;
    }

    var el = closestAction(event.target);
    if (!el) return;

    var catId = el.dataset.cat;
    var roadId = el.dataset.road;
    var stepId = el.dataset.step;
    var action = el.dataset.action;

    if (action === 'toggle-step') {
      toggleStepDone(catId, roadId, stepId);
      render();
    } else if (action === 'move-up') {
      moveStepItem(catId, roadId, stepId, 'up');
      render();
    } else if (action === 'move-down') {
      moveStepItem(catId, roadId, stepId, 'down');
      render();
    } else if (action === 'delete-step') {
      removeStep(catId, roadId, stepId);
      render();
    } else if (action === 'edit') {
      ui.editing = { kind: el.dataset.kind, id: stepId || roadId || catId };
      render();
    } else if (action === 'delete-road') {
      if (confirm('Delete this road and its goals?')) {
        removeRoad(catId, roadId);
        render();
      }
    } else if (action === 'add-goal') {
      ui.openAdd = 'add-goal:' + roadId;
      render();
    } else if (action === 'add-road') {
      ui.openAdd = 'add-road:' + catId;
      render();
    } else if (action === 'commit-add') {
      var box = deck.querySelector('[data-focus-key="' + el.dataset.key + '"]');
      if (box) commitInput(box);
    } else if (action === 'delete-category') {
      if (confirm('Delete this page and everything on it?')) {
        removeCategory(catId);
        render();
      }
    } else if (action === 'new-page') {
      openModal();
    } else if (action === 'close-modal') {
      closeModal();
    } else if (action === 'create-page') {
      createPage();
    } else if (action === 'pick-color') {
      ui.color = el.dataset.color;
      renderSwatches();
    } else if (action === 'go-page') {
      goToPage(Number(el.dataset.index));
    }
  }

  /** Keep the text box focused when the "Add" button is pressed. */
  function onMouseDown(event) {
    var el = closestAction(event.target);
    if (el && el.dataset.action === 'commit-add') event.preventDefault();
  }

  function onKeyDown(event) {
    var el = event.target;
    var isTyping = el && el.dataset && (el.dataset.input === 'add' || el.dataset.input === 'edit');

    if (isTyping) {
      if (event.key === 'Enter') {
        event.preventDefault();
        commitInput(el);
      } else if (event.key === 'Escape') {
        event.preventDefault();
        if (el.dataset.input === 'add') {
          ui.openAdd = null;
        } else {
          ui.editing = null;
        }
        render();
      }
      return;
    }

    if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) return;
    if (!modal.hidden) return;

    // Arrow keys move between pages.
    if (event.key === 'ArrowRight') goToPage(currentIndex() + 1);
    if (event.key === 'ArrowLeft') goToPage(currentIndex() - 1);
  }

  function onFocusOut(event) {
    var el = event.target;
    if (el && el.dataset && (el.dataset.input === 'add' || el.dataset.input === 'edit')) {
      commitInput(el);
    }
  }

  var scrollFrame = 0;
  function onScroll() {
    if (scrollFrame) cancelAnimationFrame(scrollFrame);
    scrollFrame = requestAnimationFrame(renderDots);
  }

  /* -------------------------------- dialog -------------------------------- */

  function renderSwatches() {
    swatchesEl.innerHTML = PALETTE.map(function (color) {
      return (
        '<button type="button" class="swatch' + (color === ui.color ? ' is-active' : '') +
        '" style="background:' + color + '" aria-label="Use colour ' + color +
        '" data-action="pick-color" data-color="' + color + '"></button>'
      );
    }).join('');
  }

  function openModal() {
    ui.color = PALETTE[Math.floor(Math.random() * PALETTE.length)];
    renderSwatches();
    modalName.value = '';
    modal.hidden = false;
    modalName.focus();
  }

  function closeModal() {
    modal.hidden = true;
  }

  function createPage() {
    state.categories.push({
      id: uid('cat'),
      name: modalName.value.trim() || 'New page',
      color: ui.color,
      order: state.categories.length,
      roads: [],
    });
    closeModal();
    render();
    goToPage(state.categories.length - 1);
  }

  /* --------------------------------- start -------------------------------- */

  modalName.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      createPage();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      closeModal();
    }
  });

  document.addEventListener('click', onClick);
  document.addEventListener('mousedown', onMouseDown);
  document.addEventListener('keydown', onKeyDown);
  deck.addEventListener('focusout', onFocusOut);
  deck.addEventListener('scroll', onScroll, { passive: true });

  render();

  // A service worker only works over http(s) — never from file://.
  if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () {
        /* offline caching is a bonus, not a requirement */
      });
    });
  }
})();
