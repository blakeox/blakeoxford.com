(() => {
  const nav = document.querySelector('#atlas-menu');
  const toggle = document.querySelector('#atlas-menu-toggle');
  if (!nav || !toggle) return;
  const mobile = matchMedia('(max-width: 850px)');
  const groups = [...nav.querySelectorAll('details')];
  const closeGroups = () => groups.forEach(group => { group.open = false; });
  function setMobile(open) {
    nav.hidden = mobile.matches && !open;
    toggle.setAttribute('aria-expanded', String(mobile.matches && open));
    if (!open) closeGroups();
  }
  toggle.hidden = false;
  setMobile(false);
  mobile.addEventListener('change', () => {
    const focusHidden = mobile.matches && nav.contains(document.activeElement);
    const focusToggle = !mobile.matches && document.activeElement === toggle;
    setMobile(false);
    if (focusHidden) toggle.focus();
    if (focusToggle) nav.querySelector('a').focus();
  });
  toggle.addEventListener('click', () => setMobile(nav.hidden));
  for (const group of groups) group.addEventListener('toggle', () => {
    if (group.open && !mobile.matches) groups.forEach(other => { if (other !== group) other.open = false; });
  });
  document.addEventListener('click', event => {
    if (!mobile.matches && !nav.contains(event.target)) closeGroups();
  });
  nav.addEventListener('focusout', event => {
    if (!mobile.matches && event.relatedTarget && !nav.contains(event.relatedTarget)) closeGroups();
  });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || (!nav.contains(event.target) && event.target !== toggle)) return;
    const open = groups.find(group => group.open && group.contains(event.target));
    if (open) {
      open.open = false;
      open.querySelector('summary').focus();
      event.preventDefault();
    } else if (mobile.matches && !nav.hidden) {
      setMobile(false);
      toggle.focus();
      event.preventDefault();
    }
  });
})();
