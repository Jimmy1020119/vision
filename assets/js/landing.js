(() => {
  'use strict';
  const tools = document.querySelector('.writing-tools');
  const section = document.querySelector('.writing');
  const rows = [...document.querySelectorAll('.post-row')];
  const buttons = [...document.querySelectorAll('button[data-filter]')];
  const cards = [...document.querySelectorAll('[data-writing-category]')];
  const input = document.querySelector('.search input');
  const status = document.querySelector('#results-status');
  const empty = document.querySelector('.empty-state');
  if (!tools || !section || !input || !status || !empty) return;
  const categories = new Map(
    buttons.map((button) => [button.dataset.filter, button.dataset.filterSlug]),
  );
  let category = 'all';

  function filterWriting() {
    const query = input.value.trim().toLocaleLowerCase('en');
    let count = 0;
    rows.forEach((row) => {
      const matchesCategory =
        category === 'all' ||
        row.dataset.categories.split('|').includes(category);
      row.hidden = !(
        matchesCategory &&
        row.textContent.toLocaleLowerCase('en').includes(query)
      );
      if (!row.hidden) count++;
    });
    empty.hidden = count !== 0;
    status.textContent = `${count} ${count === 1 ? 'article' : 'articles'}${category === 'all' ? '' : ` in ${category}`} found`;
    buttons.forEach((button) =>
      button.setAttribute(
        'aria-pressed',
        String(button.dataset.filter === category),
      ),
    );
    cards.forEach((card) => {
      if (card.dataset.writingCategory === category)
        card.setAttribute('aria-current', 'true');
      else card.removeAttribute('aria-current');
    });
  }

  function selectCategory(
    value,
    { clearSearch = false, scroll = false, updateHistory = true } = {},
  ) {
    category = categories.has(value) ? value : 'all';
    if (clearSearch) input.value = '';
    filterWriting();
    if (updateHistory) {
      const url = new URL(location.href);
      if (category === 'all') url.searchParams.delete('category');
      else url.searchParams.set('category', categories.get(category));
      if (scroll) url.hash = section.id;
      if (url.href !== location.href) history.pushState(null, '', url);
    }
    if (scroll) {
      section.scrollIntoView({
        behavior: matchMedia('(prefers-reduced-motion: reduce)').matches
          ? 'auto'
          : 'smooth',
      });
      section.focus({ preventScroll: true });
    }
  }

  function restoreCategory() {
    const slug = new URL(location.href).searchParams.get('category');
    const match = buttons.find((button) => button.dataset.filterSlug === slug);
    selectCategory(match?.dataset.filter || 'all', { updateHistory: false });
  }

  tools.hidden = false;
  buttons.forEach((button) =>
    button.addEventListener('click', () =>
      selectCategory(button.dataset.filter),
    ),
  );
  input.addEventListener('input', filterWriting);
  document.addEventListener('writing:select', (event) => {
    selectCategory(event.detail.category, { clearSearch: true, scroll: true });
  });
  // The arm intercepts normal clicks while animating. This fallback also works
  // before the rig loads, without WebGL, and with reduced motion enabled.
  document.addEventListener('click', (event) => {
    const card = event.target.closest('[data-writing-category]');
    if (
      !card ||
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      card.target === '_blank'
    )
      return;
    event.preventDefault();
    selectCategory(card.dataset.writingCategory, {
      clearSearch: true,
      scroll: true,
    });
  });
  window.addEventListener('popstate', restoreCategory);
  window.addEventListener('pageshow', restoreCategory);
  restoreCategory();
})();
