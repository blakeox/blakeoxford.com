(() => {
  const form = document.getElementById('recent-filters');
  if (!form) return;
  const filterNames = ['region','country','type','year'];
  const select = k => form.elements.namedItem(k);
  const cards = [...document.querySelectorAll('.recent-entry')];
  const years = [...document.querySelectorAll('.recent-year')];
  function read() {
    const q = new URLSearchParams(location.search);
    for (const k of filterNames) {
      const value = q.get(k) || '';
      select(k).value = [...select(k).options].some(option => option.value === value) ? value : '';
    }
    render();
  }
  function render() {
    const [region, country, type, year] = filterNames.map(k => select(k).value);
    const countries = new Set();
    let n = 0;
    for (const card of cards) {
      const d = card.dataset;
      card.hidden = (region && d.region !== region) || (country && d.code !== country) ||
        (type && d.kind !== type) || (year && d.year !== year) || false;
      if (!card.hidden) { n++; countries.add(d.code); }
    }
    for (const year of years) year.hidden = !year.querySelector('.recent-entry:not([hidden])');
    document.getElementById('recent-summary').textContent =
      n + ' ' + (n === 1 ? 'election' : 'elections') + ' across ' + countries.size + ' ' + (countries.size === 1 ? 'country' : 'countries');
    document.getElementById('recent-empty').hidden = n !== 0;
  }
  function write() {
    const url = new URL(location.href);
    for (const k of filterNames) {
      const value = select(k).value;
      if (value) url.searchParams.set(k,value); else url.searchParams.delete(k);
    }
    if (url.href !== location.href) history.pushState(null,'',url);
    render();
  }
  form.addEventListener('change',write);
  form.addEventListener('submit',event=>event.preventDefault());
  document.getElementById('recent-clear').onclick = () => { form.reset(); write(); };
  addEventListener('popstate',read);
  form.hidden = false;
  read();
})();
