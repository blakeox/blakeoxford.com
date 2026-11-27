(() => {
  'use strict';
  const selects = [...document.querySelectorAll('[data-country-control]')];
  if (!selects.length) return;
  const $ = id => document.getElementById(id);
  const htmlResults = [...document.querySelectorAll('.ct-result')];
  const district = $('districts');
  const fmt = new Intl.NumberFormat('en-US',{maximumFractionDigits:1});
  const num = new Intl.NumberFormat('en-US');
  const data = $('ct-district-json') ? JSON.parse($('ct-district-json').textContent) : {};
  const map = $('ct-district-map');
  const shapes = map ? [...map.querySelectorAll('path[data-shape]')] : [];
  const html = (tag,value) => {const a=document.createElement(tag);a.textContent=value;return a;};
  function presidential(key) {
    for (const result of htmlResults) {
      const show = result.dataset.contest === key;
      result.hidden = !show;
      result.open = show;
    }
  }
  function legislative(key) {
    const result = data[key];
    if (!result) return;
    const url = new URL('/regional',location.href);
    url.search = new URLSearchParams({country:district.dataset.country,view:'leg',election:key});
    url.hash = 'districts';
    const anchor=$('ct-district-link');
    anchor.href=url.pathname+url.search+url.hash;
    anchor.textContent='Explore all constituencies for '+result.year;
    $('ct-district-status').textContent=num.format(result.points.length)+' mapped of '+num.format(result.count)+' archived constituencies.'
      +(result.omitted ? ' '+num.format(result.omitted)+' additional records excluded by the archive’s validation rules.' : '')
      +(!result.points.length ? ' No one-to-one boundary matches are available for this election. Use the results link to read the constituency tables.' : '');
    if(map) map.hidden=!result.points.length;
    $('ct-mapped-data').hidden=!result.points.length;
    for(const shape of shapes){
      shape.removeAttribute('class');
      shape.replaceChildren();
      shape.append(Object.assign(document.createElementNS('http://www.w3.org/2000/svg','title'),{textContent:'No matched constituency with a comparable margin'}));
    }
    const trs=[];
    for (const [n,i,label,leader,gap] of result.points) {
      const shape=shapes[n];
      const margin=gap==null?'—':fmt.format(gap)+' pp';
      if(shape) {
        if(gap!=null) shape.classList.add(gap<10?'ct-gap-1':gap<25?'ct-gap-2':'ct-gap-3');
        shape.firstElementChild.textContent=label+' · '+leader+' · '+margin;
      }
      const tr=document.createElement('tr'), th=document.createElement('th'), link=html('a',label);
      const detail=new URL(url); detail.searchParams.set('district',i);
      link.href=detail.pathname+detail.search+detail.hash; th.scope='row';th.append(link);tr.append(th,html('td',leader),html('td',margin));trs.push(tr);
    }
    $('ct-mapped-rows').replaceChildren(...trs);
  }
  const callbacks={pres:presidential,leg:legislative};
  function restore() {
    const qs=new URLSearchParams(location.search);
    for(const select of selects) {
      const k=select.dataset.countryControl, value=qs.get(k);
      select.value=[...select.options].some(o=>o.value===value)?value:select.options[0].value;
      callbacks[k](select.value);
    }
  }
  for(const select of selects){
    select.closest('label').hidden=false;
    select.addEventListener('change',()=>{
      const k=select.dataset.countryControl, url=new URL(location.href);
      url.searchParams.set(k,select.value); history.replaceState(null,'',url);
      callbacks[k](select.value);
    });
  }
  addEventListener('popstate',restore);
  restore();
})();
