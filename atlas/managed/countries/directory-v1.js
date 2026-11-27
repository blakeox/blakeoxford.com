(() => {
  const finder=document.querySelector('.ct-find');
  if(!finder)return;
  const input=document.getElementById('ct-country-query');
  const regions=[...document.querySelectorAll('.ct-directory-region')];
  const jump=document.querySelector('.ct-directory .ct-jump');
  const form=(s)=>s.normalize('NFD').replace(/\p{Diacritic}/gu,'').trim().toLowerCase();
  const local={bra:'Brasil',mex:'México',dom:'República Dominicana',hti:'Haïti Ayiti',pry:'Paraguái',blz:'Belice'};
  const records=regions.map(region=>({region,items:[...region.querySelectorAll('li[data-country]')].map(node=>{
    const code=node.dataset.country;
    return {node,name:form(node.querySelector('strong').textContent+' '+code+' '+(local[code]||''))};
  })}));
  function render(){
    const q=form(input.value);
    let n=0;
    for(const {region,items} of records){
      let present=0;
      for(const {node,name} of items){node.hidden=!name.includes(q);if(!node.hidden)present++;}
      region.hidden=present===0;
      n+=present;
    }
    jump.hidden=Boolean(q);
    document.getElementById('ct-country-count').textContent=n+' '+(n===1?'country':'countries');
    document.getElementById('ct-country-empty').hidden=n!==0;
  }
  finder.hidden=false;
  input.addEventListener('input',render);
  input.addEventListener('keydown',ev=>{
    if(ev.key!=='Enter')return;
    const matches=records.flatMap(a=>a.items).filter(a=>!a.node.hidden);
    if(matches.length===1){ev.preventDefault();matches[0].node.querySelector('a').click();}
  });
  window.addEventListener('pageshow',render);
  render();
})();
