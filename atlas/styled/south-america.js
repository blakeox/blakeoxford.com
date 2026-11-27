'use strict';
(async()=>{
 const $=id=>document.getElementById(id), A=window.AtlasContext, qs=new URLSearchParams(location.search);
 const load=async f=>{const r=await fetch(f+'.json');if(!r.ok)throw Error(r.status);return r.json()};
 const optional=f=>load(f).catch(()=>null);
 const [geo,data,support,trade]=await Promise.all(['south-geography','south-data','south-support','south-trade'].map((f,i)=>i<2?load(f):optional(f)));
 const sovereign=geo.countries.filter(c=>c.capital).sort((a,b)=>a.name.localeCompare(b.name));
 const ids=new Set(sovereign.map(x=>x.id)), rows=sovereign.map(g=>({...g,...data.countries[g.id],id:g.id,support:support?.countries?.[g.id],trade:trade?.countries?.[g.id]}));
 const byId=Object.fromEntries(rows.map(x=>[x.id,x]));
 const palette=['#e3f3ef','#b0ddd5','#76bcb0','#318f80','#07594e'], absent='#c7cdd5';
 const svg=$('ctx-map'),ns='http://www.w3.org/2000/svg', metric=$('ctx-metric'),country=$('ctx-province');
 const usd=x=>'$'+A.num(Math.round(x)), bn=x=>'$'+A.dec(x/1e9)+' bn';
 const yr=data.year??2023;
 const modes={
   population:['Population · '+yr,x=>x.population,A.num],
   female:['Female share of population · '+yr,x=>x.femalePct,A.pct],
   male:['Male share of population · '+yr,x=>x.malePct,A.pct],
   youth:['Ages under 15 · '+yr,x=>x.under15Pct,A.pct],
   older:['Ages 65+ · '+yr,x=>x.age65PlusPct,A.pct],
   urban:['Urban population share · '+yr,x=>x.urbanPct,A.pct],
   gdp:['GDP · '+yr,x=>x.gdpUsd,bn],
   gdpPc:['GDP per person · '+yr,x=>x.gdpPerCapitaUsd,usd],
   growth:['Real GDP growth · '+yr,x=>x.gdpGrowthPct,A.pct],
   agriculture:['Agriculture, forestry & fishing · % of GDP',x=>x.agriculturePct,A.pct],
   industry:['Industry incl. construction · % of GDP',x=>x.industryPct,A.pct],
   manufacturing:['Manufacturing · % of GDP',x=>x.manufacturingPct,A.pct],
   services:['Services · % of GDP',x=>x.servicesPct,A.pct],
   concentration:['Top goods export’s share · '+(trade?.year??2024),x=>x.trade?.products?.[0]?.share,A.pct],
   support:['Fossil-fuel support · % of GDP',x=>sub(x,'gdp'),A.pct],
   supportPc:['Fossil-fuel support · USD per person',x=>sub(x,'perCapita'),usd],
   supportBn:['Fossil-fuel support · current USD billions',x=>sub(x,'total'),x=>'$'+A.dec(x)+' bn'],
   transfers:['Subsidies and other transfers · % of central-government expense',x=>x.subsidiesTransfersPct,A.pct]
 };
 function sub(x,k){
   const v=x.support?.subsidiesUsd;
   if(!Number.isFinite(v))return null;
   if(k==='gdp')return x.gdpUsd>0?100*v/x.gdpUsd:null;
   if(k==='perCapita')return x.population>0?v/x.population:null;
   return v/1e9;
 }
 const show=(v,f)=>Number.isFinite(v)?f(v):'Not available';
 const overlays=Object.fromEntries(['rivers','terrain','cities','names'].map(k=>[k,$('overlay-'+k)]));
 if(qs.has('layers'))for(const [k,b] of Object.entries(overlays))b.checked=(qs.get('layers')??'').split(',').includes(k);
 for(const [k,[label,get]] of Object.entries(modes))if(rows.some(x=>Number.isFinite(get(x))))metric.add(new Option(label,k));
 metric.value=Array.from(metric.options).some(o=>o.value===qs.get('metric'))?qs.get('metric'):'population';
 for(const row of rows)country.add(new Option(row.name,row.id));
 let id=ids.has(qs.get('d'))?qs.get('d'):'ARG';
 const el=(type,attrs={},root=svg)=>{const n=document.createElementNS(ns,type);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,v);root.append(n);return n};
 svg.setAttribute('viewBox','0 0 '+geo.w+' '+geo.h);
 const defs=el('defs'),clip=el('clipPath',{id:'south-land'},defs);
 for(const a of geo.countries)el('path',{d:a.path,'clip-rule':'evenodd'},clip);
 const paths=[];
 for(const c of geo.countries){
  const sovereign=ids.has(c.id),shape=el('path',{d:c.path,'fill-rule':'evenodd',class:'province',fill:absent});
  const t=el('title',{},shape);t.textContent=c.name;
  if(sovereign){shape.setAttribute('role','button');shape.setAttribute('tabindex','0');shape.onclick=()=>pick(c.id);shape.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();pick(c.id)}};}
  else shape.style.cursor='default';
  paths.push([c,shape,t]);
 }
 const groups={};
 for(const key of ['rivers','terrain','cities','names'])groups[key]=el('g',{'pointer-events':'none','aria-hidden':'true'});
 const rg=el('g',{'clip-path':'url(#south-land)'},groups.rivers);
 for(const p of geo.rivers)el('path',{d:p,fill:'none',class:'ctx-river'},rg);
 const geoLabel=(root,l,style,dy=0)=>{const t=el('text',{x:l.x,y:l.y+dy,'text-anchor':'middle',class:'ctx-geo-label '+style},root);t.textContent=l.name;};
 for(const l of geo.waters)geoLabel(groups.rivers,l,'ctx-river-label');
 for(const l of geo.terrain)geoLabel(groups.terrain,l,'ctx-terrain-label');
 for(const l of geo.capitals){el('circle',{cx:l.x,cy:l.y,r:2.7,class:'ctx-city'},groups.cities);geoLabel(groups.cities,l,'ctx-city-label',-6);}
 for(const row of sovereign)geoLabel(groups.names,row,'ctx-country-label');
 const stat=(v,n)=>'<div class="ctx-stat"><strong>'+A.esc(v)+'</strong><span>'+A.esc(n)+'</span></div>';
 const card=(name,xs,note='')=>'<section class="context-card"><h3>'+A.esc(name)+'</h3><div class="ctx-grid">'+xs.map(a=>stat(...a)).join('')+'</div>'+(note?'<p class="context-meta">'+A.esc(note)+'</p>':'')+'</section>';
 const gdpMeasures=[['gdpUsd','Nominal GDP · current USD',bn],['gdpPerCapitaUsd','GDP per person · current USD',usd],['gdpGrowthPct','Real GDP annual growth',A.pct]];
 const econMeasures=[['agriculturePct','Agriculture, forestry & fishing',A.pct],['industryPct','Industry incl. construction',A.pct],['manufacturingPct','Manufacturing (part of industry)',A.pct],['servicesPct','Services',A.pct]];
 const values=(p,fields)=>fields.map(([k,label,fmt])=>[show(p[k],fmt),label]);
 function profile(p){
   const pgeo=sovereign.find(x=>x.id===p.id), pop=[['population','Residents',A.num],['femalePct','Female share',A.pct],['malePct','Male share',A.pct],['under15Pct','Ages under 15',A.pct],['age65PlusPct','Ages 65+',A.pct],['urbanPct','Urban population',A.pct]];
   const general=card('Population · '+yr,values(p,pop))+card('Economy · '+yr,values(p,gdpMeasures))+card('Industry structure · '+yr,values(p,econMeasures),'Shares of GDP. Manufacturing is included in industry; these entries should not be added together.');
   const exports=p.trade?.products?.length?card('Top goods exports · '+trade.year,p.trade.products.map(x=>[show(x.share??x.sharePct,A.pct),x.label??x.name??x.code]),'Shares of reported or harmonized goods export value, not employment or total production. Services are excluded.'):'';
   const v=p.support?.breakdownUsd??{}, aid=card('Fossil-fuel support · '+(support?.year??yr),
      [[show(sub(p,'gdp'),A.pct),'Share of GDP'],[show(sub(p,'perCapita'),usd),'USD per person'],[show(sub(p,'total'),x=>'$'+A.dec(x)+' bn'),'Billion current USD'],
       ...[['directBudgetUsd','Direct budget transfers'],['taxExpenditureUsd','Tax expenditures'],['inducedTransferUsd','Induced price support']].map(([k,l])=>[show(v[k],x=>'$'+A.dec(x/1e6)+' m'),l])],
      (p.support?.subsidiesUsd===0?'The tracker reports no positive amount for this measure; this does not prove no support exists. ':'')+
      'OECD / IISD tracker. Methods and coverage vary by country; this is not total subsidy spending.'+
      (p.support?.sourceMethod?' Source method: '+p.support.sourceMethod+'.':''));
   const transfer=Number.isFinite(p.subsidiesTransfersPct)?card('Budget classification · '+yr,[[A.pct(p.subsidiesTransfersPct),'Subsidies and other transfers as share of central-government expense']],'Broader than subsidies and reported separately; do not add it to the fossil fuel measure.'):'';
   const capital=p.id==='BOL'?'Sucre (constitutional); La Paz (seat of government)':pgeo.capital;
   return '<p class="eyebrow">Country profile</p><h2>'+A.esc(pgeo.name)+'</h2><p>Capital: '+A.esc(capital)+'</p>'+(p.id==='ARG'?'<a class="context-link" href="context.html">Explore Argentina by province</a> <a class="context-link" href="./">Open the 2023 election map</a>':'')+general+exports+aid+transfer;
 }
 const sourceLink=(u,n)=>u?'<a href="'+A.esc(u)+'">'+A.esc(n)+'</a>':'';
 const sourceFor=(obj)=>typeof obj?.source==='string'?obj.source:obj?.source?.url;
 const topics=[
  sourceLink('https://databank.worldbank.org/source/world-development-indicators','World Bank · World Development Indicators'),
  sourceLink(sourceFor(support),'OECD / IISD Fossil Fuel Subsidy Tracker'),
  sourceLink(support?.source?.methodology,'Fossil-fuel support methods'),
  sourceLink(sourceFor(trade),'Goods export dataset'),
  sourceLink('https://www.naturalearthdata.com/downloads/50m-cultural-vectors/50m-admin-0-countries-2/','Natural Earth · country geometry'),
  sourceLink('https://www.naturalearthdata.com/downloads/50m-physical-vectors/50m-rivers-lake-centerlines/','Natural Earth · rivers')];
 $('ctx-sources').innerHTML='<p class="ctx-source">'+topics.join('')+'</p><p>Profiles cover all 12 sovereign South American countries. French Guiana and the Falkland Islands / Islas Malvinas are shown for orientation only, not in rankings; the map does not take a position on territorial claims.</p><p>GDP and GDP per person are current US dollars, not purchasing-power-adjusted. Industry breakdowns are different from merchandise export shares; neither is employment. Country subsidy figures are not comparable to the separate, program-specific data in the Argentina provincial map. The continent view does not combine national election results from different contests. Fossil-fuel support per person and as a share of GDP use the 2023 WDI denominators shown here. Argentina’s population in this comparison uses the WDI estimate; the provincial map uses the 2022 census.</p><p>Terrain labels mark approximate locations, not exact boundaries or elevation. Rivers are generalised at 1:50m; capital points are reference locations.</p>'+[data.notes,support?.notes,trade?.notes].flatMap(x=>Array.isArray(x)?x:typeof x==='string'?[x]:[]).map(x=>'<p>'+A.esc(x)+'</p>').join('');
 function pick(newId){id=newId;render();}
 function render(){
   const [label,get,format]=modes[metric.value], p=byId[id], fmt=x=>show(x,format);
   country.value=id;
   const url=new URL(location.href);url.searchParams.set('d',id);url.searchParams.set('metric',metric.value);url.searchParams.set('layers',Object.keys(overlays).filter(k=>overlays[k].checked).join(','));history.replaceState(null,'',url);
   for(const k in groups)groups[k].style.display=overlays[k].checked?'':'none';
   const v=rows.map(get).filter(Number.isFinite).sort((a,b)=>a-b), bounds=[.2,.4,.6,.8,1].map(q=>v[Math.max(0,Math.ceil(v.length*q)-1)]);
   const bin=x=>Math.max(0,bounds.findIndex(b=>x<=b));
   for(const [g,shape,t] of paths){const r=byId[g.id],x=r?get(r):null;shape.setAttribute('fill',Number.isFinite(x)?palette[bin(x)]:absent);shape.classList.toggle('selected',g.id===id);if(r){shape.setAttribute('aria-pressed',String(g.id===id));shape.setAttribute('aria-label',g.name+': '+fmt(x));}t.textContent=g.name+(r?' · '+fmt(x):' · map reference only');}
   const legend=(c,l)=>'<span><i class="swatch" style="background:'+c+'"></i>'+A.esc(l)+'</span>';
   $('ctx-legend').innerHTML=bounds.map((b,i)=>i&&b===bounds[i-1]?'':legend(palette[i],'≤ '+fmt(b))).join('')+legend(absent,'Not available / not ranked');
   $('ctx-status').textContent=v.length+' of 12 countries with data · groups based on this metric’s distribution';
   $('ctx-column').textContent=label;$('ctx-details').innerHTML=profile(p);
   $('ctx-ranking').innerHTML=rows.slice().sort((a,b)=>(Number.isFinite(get(b))?get(b):-Infinity)-(Number.isFinite(get(a))?get(a):-Infinity)).map(r=>'<tr class="'+(r.id===id?'active-row':'')+'"><td><button type="button" data-p="'+r.id+'">'+A.esc(r.name)+'</button></td><td>'+A.esc(fmt(get(r)))+'</td></tr>').join('');
 }
 country.onchange=()=>pick(country.value);metric.onchange=render;
 for(const b of Object.values(overlays))b.onchange=render;
 $('ctx-ranking').onclick=e=>{const b=e.target.closest('[data-p]');if(b){pick(b.dataset.p);$('ctx-ranking').querySelector('[data-p="'+b.dataset.p+'"]')?.focus({preventScroll:true});$('ctx-details').scrollIntoView({block:'nearest'})}};
 const csvQuote=x=>'"'+String(x??'').replace(/"/g,'""')+'"';
 const cols=Object.values(modes), csv=[['ISO3','Country',...cols.map(c=>c[0])],...rows.map(r=>[r.id,r.name,...cols.map(c=>c[1](r))])].map(row=>row.map(csvQuote).join(',')).join('\n');
 $('ctx-csv').href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
 render();
})().catch(e=>{document.getElementById('ctx-status').textContent='Country data could not load. Refresh to retry.';console.error(e)});
