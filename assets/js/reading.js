(() => {
  const article = document.querySelector('#article-content');
  if (!article) return;
  // Kramdown can emit math script nodes; the local preview preserves delimiters.
  if (window.katex) {
    article.querySelectorAll('script[type^="math/tex"]').forEach((source) => {
      const output = document.createElement('span');
      katex.render(source.textContent, output, {
        displayMode: source.type.includes('mode=display'),
        throwOnError: false,
      });
      source.replaceWith(output);
    });
  }
  if (window.renderMathInElement)
    renderMathInElement(article, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '\\[', right: '\\]', display: true },
        { left: '$', right: '$', display: false },
        { left: '\\(', right: '\\)', display: false },
      ],
      throwOnError: false,
    });
  article.querySelectorAll('table:not(.rouge-table)').forEach((table) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'table-scroll';
    wrapper.tabIndex = 0;
    wrapper.setAttribute('role', 'region');
    wrapper.setAttribute('aria-label', 'Scrollable table');
    table.before(wrapper);
    wrapper.append(table);
  });
  if (navigator.clipboard)
    article.querySelectorAll('pre').forEach((pre) => {
      if (pre.closest('.rouge-gutter')) return;
      const wrapper = document.createElement('div');
      wrapper.className = 'code-shell';
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'copy-code';
      button.textContent = 'Copy code';
      button.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(pre.textContent);
          button.textContent = 'Copied';
        } catch {
          button.textContent = 'Select to copy';
        }
        setTimeout(() => {
          button.textContent = 'Copy code';
        }, 1800);
      });
      pre.before(wrapper);
      wrapper.append(button, pre);
    });
  const toc = document.querySelector('#table-of-contents');
  const headings = [...article.querySelectorAll('h2, h3')];
  if (!toc || !headings.length) return;
  const ids = new Set(
    [...document.querySelectorAll('[id]')].map((el) => el.id),
  );
  headings.forEach((heading, index) => {
    if (!heading.id) {
      const base =
        heading.textContent
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '') || `section-${index + 1}`;
      let id = base,
        suffix = 2;
      while (ids.has(id)) id = `${base}-${suffix++}`;
      heading.id = id;
      ids.add(id);
    }
    const link = document.createElement('a');
    link.href = `#${heading.id}`;
    link.textContent = heading.textContent;
    if (heading.tagName === 'H3') link.className = 'subheading';
    toc.append(link);
  });
  document.querySelector('.article-sidebar').hidden = false;
  const links = [...toc.querySelectorAll('a')];
  let queued = false;
  const update = () => {
    let active = 0;
    headings.forEach((heading, index) => {
      if (heading.getBoundingClientRect().top <= 120) active = index;
    });
    links.forEach((link, index) =>
      index === active
        ? link.setAttribute('aria-current', 'location')
        : link.removeAttribute('aria-current'),
    );
    queued = false;
  };
  addEventListener(
    'scroll',
    () => {
      if (!queued) {
        queued = true;
        requestAnimationFrame(update);
      }
    },
    { passive: true },
  );
  update();
})();
