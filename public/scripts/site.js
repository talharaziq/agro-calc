(() => {
  const toggle = document.querySelector('.mobile-nav-toggle');
  const nav = document.querySelector('#primary-navigation');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') !== 'true';
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Закрити меню' : 'Відкрити меню');
      nav.dataset.open = String(open);
    });
  }

  const search = document.querySelector('[data-tool-search]');
  if (search) {
    const cards = Array.from(document.querySelectorAll('[data-tool-card]'));
    const count = document.querySelector('[data-tool-count]');
    const empty = document.querySelector('[data-tool-empty]');
    const update = () => {
      const query = search.value.trim().toLocaleLowerCase('uk-UA');
      let shown = 0;
      cards.forEach((card) => {
        const matches = !query || (card.getAttribute('data-search') || '').toLocaleLowerCase('uk-UA').includes(query);
        card.hidden = !matches;
        if (matches) shown++;
      });
      if (count) count.textContent = `Показано калькуляторів: ${shown}`;
      if (empty) empty.hidden = shown > 0;
    };
    search.addEventListener('input', update);
    update();
  }
})();
