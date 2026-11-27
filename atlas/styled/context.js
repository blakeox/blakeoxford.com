'use strict';
window.AtlasContext=(()=>{
const nf=new Intl.NumberFormat('en-US'), df=new Intl.NumberFormat('en-US',{maximumFractionDigits:1});
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=x=>Number.isFinite(x)?nf.format(x):'Not available', dec=x=>Number.isFinite(x)?df.format(x):'Not available', pct=x=>Number.isFinite(x)?df.format(x)+'%':'Not available';
const stat=(v,n)=>'<div class="ctx-stat"><strong>'+esc(v)+'</strong><span>'+esc(n)+'</span></div>';
const grid=xs=>'<div class="ctx-grid">'+xs.map(([v,n])=>stat(v,n)).join('')+'</div>';
const card=(name,body)=>'<section class="context-card"><h3>'+esc(name)+'</h3>'+body+'</section>';
const breakdown=(xs=[])=>'<ul class="ctx-breakdown">'+xs.filter(x=>Number.isFinite(x.sharePct)).map(({name,sharePct})=>'<li><span>'+esc(name)+'</span><strong>'+pct(sharePct)+'</strong><span aria-hidden="true" class="ctx-track"><i style="width:'+Math.min(100,Math.max(0,sharePct))+'%"></i></span></li>').join('')+'</ul>';
const sourceLink=s=>{
 if(!s?.url)return '';
 try {
  const u=new URL(s.url);
  return u.protocol==='https:'&&!u.username&&!u.password?'<a href="'+esc(u.href)+'">'+esc(s.label)+'</a>':esc(s.label);
 }catch(_){return esc(s.label);}
};
const data=()=>window._atlasContextPromise??=fetch('context-data.json').then(r=>{if(!r.ok)throw Error(r.status);return r.json();});
function demographic(d,heading){
 if(!d)return '';
 const s=[['total','Residents'],['female','Female'],['male','Male']].filter(([k])=>Number.isFinite(d[k])).map(([k,l])=>[num(d[k]),l]);
 if(Number.isFinite(d.medianAge))s.push([num(d.medianAge),'Median age · private dwellings']);
 if(d.ages)for(const [k,l] of [['age0to14','Age 0–14'],['age15to64','Age 15–64'],['age65plus','Age 65+']])s.push([pct(d.ages[k]),l]);
 if(Number.isFinite(d.density))s.push([dec(d.density),'People per km²']);
 return card(heading,grid(s)+'<p class="context-meta">2022 census residents, not voters. Counts follow INDEC’s published census tables.</p>');
}
function profile(db,id,sectionId='',circuit=false,includeFull=false){
 const p=db.provinces[id];if(!p)return '';
 const local=sectionId?p.sections?.[sectionId]:null, heading=local?.name||'administrative area';
 const d=demographic(local,heading+' · Population, 2022')+
   (sectionId&&!local?'<p class="context-meta">No verified census match for this section.</p>':'')+
   (circuit?'<p class="context-meta">Census counts below describe the surrounding section or province, not this voting circuit.</p>':'');
 const pv=demographic(p.demographics,p.name+' · Population, 2022');
 const e=p.economy;
 const ec=e?card('Economy · '+esc(db.economyYear??2023),grid([[dec(e.vabMillion/1000),'Billion constant 2004 ARS · GVA'],[pct(e.nationalSharePct),'Share of national GVA']])+
 '<h4>Largest industries by value added</h4>'+breakdown((e.subsectors?.length?e.subsectors:e.sectors).slice(0,includeFull?8:5))+
 (includeFull&&e.sectors?.length?'<details><summary>Broad industry groups</summary>'+breakdown(e.sectors)+'</details>':'')+
 '<p class="context-meta">Gross value added in constant 2004 pesos. Industry shares describe economic output, not jobs. '+sourceLink(db.sources.economy)+'</p>'):'';
 const fs=(p.fiscal??[]).map(f=>card(f.label+' · '+f.year,grid(f.values.map(v=>[v.display,v.label]))+'<p class="context-meta">'+esc(f.note)+' '+sourceLink(db.sources[f.source])+'</p>')).join('');
 const g=p.geography;
 const gc=g?card('Geography',grid([[g.capital,'Capital'],[Number.isFinite(g.areaKm2)?dec(g.areaKm2)+' km²':'Not shown','Area · IGN']])+'<p class="context-meta">'+(Number.isFinite(g.areaKm2)?'Population density uses this area.':'IGN’s full provincial figure includes Antarctic and South Atlantic claims outside this map.')+' '+sourceLink(db.sources.geography)+'</p>'):'';
 return d+pv+gc+ec+fs;
}
const link=(id,s='')=>'context.html?d='+encodeURIComponent(id)+(s?'&s='+encodeURIComponent(s):'');
return {data,profile,esc,num,dec,pct,sourceLink,link};
})();
