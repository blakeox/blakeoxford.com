'use strict';
(async()=>{
 const $=id=>document.getElementById(id), A=window.AtlasContext, qs=new URLSearchParams(location.search);
 const db=await A.data(), geo=db.geo, records=db.provinces, svg=$('ctx-map'), ns='http://www.w3.org/2000/svg';
 const metric=$('ctx-metric'), province=$('ctx-province'), order=Object.values(records).sort((a,b)=>a.name.localeCompare(b.name,'es'));
 const palette=['#e3f3ef','#b0ddd5','#76bcb0','#318f80','#07594e'], absent='#c7cdd5';
 let active=records[qs.get('d')]?qs.get('d'):'4', section=qs.get('s')??'';
 const lookup={
   population:{label:'Population · 2022', get:p=>p.demographics?.total, fmt:A.num},
   density:{label:'Population density · 2022', get:p=>p.demographics?.density, fmt:x=>A.dec(x)+' / km²'},
   age:{label:'Median age · 2022 (private dwellings)',get:p=>p.demographics?.medianAge,fmt:x=>A.dec(x)+' years'},
   area:{label:'Geographic area · IGN',get:p=>p.geography?.areaKm2,fmt:x=>A.dec(x)+' km²'},
   female:{label:'Female share of residents · 2022', get:p=>p.demographics?.female/p.demographics?.total*100, fmt:A.pct},
   gva:{label:'Gross value added · 2023',get:p=>p.economy?.vabMillion/1000,fmt:x=>A.dec(x)+' bn constant 2004 ARS'},
   gvaPerson:{label:'GVA per resident · 2023',get:p=>p.economy?.vabMillion*1e6/p.demographics?.total,fmt:x=>A.num(Math.round(x))+' constant 2004 ARS'},
   male:{label:'Male share of residents · 2022',get:p=>p.demographics?.male/p.demographics?.total*100,fmt:A.pct},
   runoff:{label:'Milei’s runoff vote share · 2023',get:p=>p.runoff,fmt:A.pct},
 };
 for(const f of db.fiscalMetrics??[])lookup[f.key]={label:f.label,get:p=>p.fiscalMetrics?.[f.key],fmt:x=>A.dec(x)+' '+f.unit};
 for(const [i,name] of [...new Set(order.flatMap(p=>p.economy?.sectors.map(s=>s.name)??[]))].sort().entries())lookup['sector'+i]={label:name+' · share of 2023 GVA',get:p=>p.economy?.sectors.find(x=>x.name===name)?.sharePct,fmt:A.pct};
 for(const [k,m] of Object.entries(lookup)){if(order.some(p=>Number.isFinite(m.get(p))))metric.add(new Option(m.label,k));}
 metric.value=Array.from(metric.options).some(o=>o.value===qs.get('metric'))?qs.get('metric'):'population';
 for(const p of order)province.add(new Option(p.name,p.id));
 $('ctx-sources').innerHTML='<p>Election returns are separate from census residence, industry and public finance data. This map cannot tell you how people of a given sex, age or industry voted, or establish an effect of government funding on voting.</p><p class="ctx-source">'+Object.values(db.sources).map(A.sourceLink).join('')+'</p>'+ (db.notes??[]).map(n=>'<p>'+A.esc(n)+'</p>').join('');
 const add=(type,attrs)=>{const e=document.createElementNS(ns,type);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,v);svg.append(e);return e};
 svg.setAttribute('viewBox','0 0 '+geo.w+' '+geo.h);
 const overlays=Object.fromEntries(['winners','rivers','terrain','cities'].map(k=>[k,$('overlay-'+k)]));
 if(qs.has('layers'))for(const [k,b] of Object.entries(overlays))b.checked=(qs.get('layers')??'').split(',').includes(k);
 const el=(type,attrs,root)=>{const n=document.createElementNS(ns,type);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,v);root.append(n);return n;};
 const defs=add('defs',{}), clip=el('clipPath',{id:'ctx-land'},defs);
 for(const a of geo.d)el('path',{d:a.p,'clip-rule':'evenodd'},clip);
 const paths=geo.d.filter(x=>x.id!=='1').map(x=>[x.id,add('path',{d:x.p,'fill-rule':'evenodd',class:'province'})]);
 paths.push(['1',add('circle',{cx:geo.c[0],cy:geo.c[1],r:8,class:'province'})]);
 for(const [id,p] of paths){p.setAttribute('role','button');p.setAttribute('tabindex','0');p.onclick=()=>select(id);p.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();select(id)}};p.append(document.createElementNS(ns,'title'));}
 const groups={};
 for(const key of ['winners','rivers','terrain','cities'])groups[key]=add('g',{'pointer-events':'none','aria-hidden':'true'});
 for(const d of geo.d.filter(x=>x.id!=='1'))el('path',{d:d.p,fill:'none',class:'ctx-election-outline',stroke:records[d.id].win===0?'#57218a':'#005b8a'},groups.winners);
 el('circle',{cx:geo.c[0],cy:geo.c[1],r:9,fill:'none',class:'ctx-election-outline',stroke:records['1'].win===0?'#57218a':'#005b8a'},groups.winners);
 const rg=el('g',{'clip-path':'url(#ctx-land)'},groups.rivers);
 for(const r of geo.physical.rivers)el('path',{d:r.path,fill:'none',class:'ctx-river'},rg);
 const label=(root,l,style,dy=0)=>{const t=el('text',{x:l.x,y:l.y+dy,'text-anchor':'middle',class:'ctx-geo-label '+style},root);t.textContent=l.name;};
 for(const r of geo.physical.riverLabels)label(groups.rivers,r,'ctx-river-label');
 for(const l of geo.physical.terrain)label(groups.terrain,l,'ctx-terrain-label');
 for(const c of geo.physical.cities){el('circle',{cx:c.x,cy:c.y,r:2.7,class:'ctx-city'},groups.cities);label(groups.cities,c,'ctx-city-label',-6);}
 for(const b of Object.values(overlays))b.onchange=render;
 function select(id){if(id!==active)section='';active=id;render();}
 function render(){
   const m=lookup[metric.value], p=records[active];
   province.value=active;const local='local.html?d='+active+(section?'&s='+encodeURIComponent(section):'');
   $('ctx-local-nav').href=local;
   const u=new URL(location.href);u.searchParams.set('d',active);u.searchParams.set('metric',metric.value);u.searchParams.set('layers',Object.keys(overlays).filter(k=>overlays[k].checked).join(','));for(const k in groups)groups[k].style.display=overlays[k].checked?'':'none';if(section)u.searchParams.set('s',section);else u.searchParams.delete('s');history.replaceState(null,'',u);
   const values=order.map(m.get).filter(Number.isFinite).sort((a,b)=>a-b);
   const bounds=[.2,.4,.6,.8].map(q=>values[Math.max(0,Math.ceil(values.length*q)-1)]);
   const sw=(color,label)=>'<span><i class="swatch" style="background:'+color+'"></i>'+A.esc(label)+'</span>';
   const bin=v=>{const idx=bounds.findIndex(b=>v<=b);return idx<0?4:idx;};
   const fmt=v=>Number.isFinite(v)?m.fmt(v):'Not available';
   for(const [id,shape] of paths){const v=m.get(records[id]);shape.setAttribute('fill',Number.isFinite(v)?palette[bin(v)]:absent);shape.classList.toggle('selected',id===active);shape.setAttribute('aria-pressed',String(id===active));shape.setAttribute('aria-label',records[id].name+': '+fmt(v));shape.firstChild.textContent=records[id].name+' · '+fmt(v);}
   const breaks=[...bounds, values.at(-1)];
   $('ctx-legend').innerHTML=breaks.map((b,i)=>i&&b===breaks[i-1]?'':sw(palette[i],i===0?'≤ '+fmt(b):'≤ '+fmt(b))).join('')+(values.length<order.length?sw(absent,'Not available'):'')+(overlays.winners.checked?sw('#57218a','Outline: Milei')+sw('#005b8a','Outline: Massa'):'')+(overlays.rivers.checked?sw('#087cba','Selected rivers'):'');
   $('ctx-status').textContent=values.length+' of '+order.length+' jurisdictions · groups based on the distribution of this metric';
   $('ctx-column').textContent=m.label;
   $('ctx-details').innerHTML='<p class="eyebrow">Selected jurisdiction</p><h2>'+A.esc(p.name)+'</h2><p class="ctx-inline">Milei runoff: <strong>'+A.pct(p.runoff)+'</strong></p><a class="context-link" href="'+local+'">See local election results</a>'+A.profile(db,active,section,false,true);
   $('ctx-ranking').innerHTML=order.slice().sort((a,b)=>(Number.isFinite(m.get(b))?m.get(b):-Infinity)-(Number.isFinite(m.get(a))?m.get(a):-Infinity)).map(x=>'<tr class="'+(x.id===active?'active-row':'')+'"><td><button type="button" data-p="'+x.id+'">'+A.esc(x.name)+'</button></td><td>'+A.esc(fmt(m.get(x)))+'</td><td>'+A.pct(x.runoff)+'</td></tr>').join('');
 }
 province.onchange=()=>select(province.value);metric.onchange=render;
 $('ctx-ranking').onclick=e=>{const b=e.target.closest('[data-p]');if(b){select(b.dataset.p);$('ctx-ranking').querySelector('[data-p="'+b.dataset.p+'"]')?.focus({preventScroll:true});$('ctx-details').scrollIntoView({block:'nearest'})}};
 $('ctx-csv').href='context-data.csv';render();
})().catch(e=>{document.getElementById('ctx-status').textContent='Regional data could not load. Refresh to retry; the election maps remain available.';console.error(e)});
