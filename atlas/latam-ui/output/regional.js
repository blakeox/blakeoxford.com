'use strict';
(async()=>{
const $=id=>document.getElementById(id), esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=new Intl.NumberFormat('en-US',{maximumFractionDigits:1}), num=new Intl.NumberFormat('en-US'), pct=v=>Number.isFinite(v)?fmt.format(v)+'%':'Not available';
const date=v=>v?.date?(v.date.length===4?v.date:new Intl.DateTimeFormat('en-US',{dateStyle:'medium',timeZone:'UTC'}).format(new Date(v.date+'T12:00Z'))):v?new Date(Date.UTC(v.year,Math.max(0,v.month-1),1)).toLocaleString('en-US',{month:'short',year:'numeric',timeZone:'UTC'}):'—';
const labels=['Left','Center','Right','Uncoded'], inks=['#076a77','#88721e','#713592','#687282'], pale=['#b5dfe4','#e3cd80','#d9b9ed','#bac2ce'];
const specs={
 blocs:[['balance','Left minus right'],['left','Left vote share'],['center','Center vote share'],['right','Right vote share'],['swing','Left change vs. previous election']],
 pres:[['lead','First-round leader share'],['gap','First-round top-two margin'],['runoff','Runoff top-two margin']],
 leg:[['local','Median local top-two margin'],['coverage','Constituencies in the archive']],
 };
const overlays=[['ctxUrban','Context · Urban population'],['ctxGdp','Context · GDP per person'],['ctxPop','Context · Residents']];
const O={ctxUrban:['SP.URB.TOTL.IN.ZS',100,'%'],ctxGdp:['NY.GDP.PCAP.CD',25000,'USD'],ctxPop:['SP.POP.TOTL',220000000,'residents']};
const ranges=[['2015–2018',2015,2018],['2010–2014',2010,2014],['2005–2009',2005,2009],['2000–2004',2000,2004],['1995–1999',1995,1999],['1990–1994',1990,1994]];
let db,geo,ctx;
try{[db,geo,ctx]=await Promise.all(['regional-votes','regional-geography','regional-context'].map(n=>fetch(n+'.json').then(r=>{if(!r.ok)throw Error(n);return r.json()})));}
catch(e){$('summary').textContent='Election data did not load. Try reloading the page.';return;}
const sorted=Object.keys(db).sort((a,b)=>db[a].name.localeCompare(db[b].name));
let mode, country, metric, region, windowId, electionId, district, localParty;
const regions = [
 ['south','South America','South America'],
 ['central','Central America','Central America'],
 ['mexico','Mexico','Mexico'],
 ['caribbean','Caribbean','Selected Caribbean'],
];
const regionKey=Object.fromEntries([['both',''],...regions.map(([short,name])=>[name,short])]);
const regionName=Object.fromEntries(regions.map(([short,name])=>[short,name]));
const displayRegion = r => regions.find(x=>x[1]===r)?.[2] || 'All regions';
const sourceLink = (name, url) => {
 const label=esc(name||'Source');
 if(typeof url!=='string')return label;
 try {
  const checked=new URL(url);
  return checked.protocol==='https:' && !checked.username && !checked.password ? '<a href="'+esc(checked.href)+'">'+label+'</a>' : label;
 } catch (_) { return label; }
};
function loadState(){
 const q=new URLSearchParams(location.search);
 mode=Object.hasOwn(specs,q.get('view'))?q.get('view'):'blocs';
 const k=q.get('country');
 country=Object.hasOwn(db,k)?k:'';
 region=(Object.hasOwn(regionName,q.get('region'))?regionName[q.get('region')]:'both');
 if(country && region!=='both' && db[country].region!==region) region=db[country].region;
 if(country && !q.has('region')) region=db[country].region;
 if(!country && region==='Mexico') country='MEX';
 const requestedWindow=q.get('window')||'0';
 windowId=(mode==='blocs'?/^[0-5]$/.test(requestedWindow):/^(?:0|1995|2000|2005|2010|2015|2020|2025)$/.test(requestedWindow))?requestedWindow:'0';
 metric=[...specs[mode],...overlays].some(x=>x[0]===q.get('metric'))?q.get('metric'):specs[mode][0][0];
 electionId=q.get('election')||'';district=/^\d{1,4}$/.test(q.get('district')||'')?Number(q.get('district')):-1;
 localParty=q.get('party')||'';
}
loadState();
function writeState(push=false){
 const u=new URL(location.href); u.search=''; u.hash='';
 if(region!=='both')u.searchParams.set('region',regionKey[region]);else if(country)u.searchParams.set('region','all');
 if(country)u.searchParams.set('country',country);
 if(mode!=='blocs')u.searchParams.set('view',mode);
 if(windowId!=='0')u.searchParams.set('window',windowId);
 if(metric!==specs[mode][0][0])u.searchParams.set('metric',metric);
 if(electionId)u.searchParams.set('election',electionId);
 if(district>=0)u.searchParams.set('district',district);
 if(localParty)u.searchParams.set('party',localParty);
 if(u.href!==location.href)history[push?'pushState':'replaceState'](null,'',u);
}
function crumbs(){
 const clear='<button type="button" data-region="both">All regions</button>';
 const r=country&&region==='both'?db[country].region:region;
 const level=r!=='both'&&r!=='Mexico'?'<button type="button" data-region="'+esc(r)+'">'+esc(displayRegion(r))+'</button>':'';
 const e=country?selected():null, area=mode==='leg'&&e?.areas[district];
 const nation=country?(area?'<button type="button" data-country="'+country+'">'+esc(db[country].name)+'</button>':'<span aria-current="page">'+esc(db[country].name)+'</span>'):'';
 $('atlas-trail').innerHTML=clear+level+nation+(area?'<span aria-current="page">'+esc(area[0])+'</span>':'');
}
const countries=()=>sorted.filter(k=>region==='both'||db[k].region===region);
const pick=k=>{
 const es=db[k][mode];
 if(mode==='blocs'){ const [,a,b]=ranges[Number(windowId)]||ranges[0];return es.filter(e=>e.year>=a&&e.year<=b).at(-1); }
 const cutoff=Number(windowId)||2100;return es.filter(e=>e.year<=cutoff).at(-1);
};
const selected=()=>country?(db[country][mode].find(e=>String(e.id??e.date??e.year)===electionId)||pick(country)||db[country][mode].at(-1)):null;
const shares=a=>{const s=a[2].reduce((x,p)=>x+p[1],0);return a[2].map(([p,v])=>[p,100*v/s,v]);};
const localMargin=a=>{const xs=shares(a);return xs.length>=2?xs[0][1]-xs[1][1]:null;};
const median=a=>{a=a.filter(Number.isFinite).sort((x,y)=>x-y);let i=Math.floor(a.length/2);return a.length?(a[i]+a[Math.floor((a.length-1)/2)])/2:null;};
function value(k,e){
 if(O[metric])return ctx[k]?.[O[metric][0]]??null;
 if(!e)return null;
 if(metric==='balance')return e.shares[0]-e.shares[2];
 if(metric==='swing'){const prev=db[k].blocs.filter(x=>x.year<e.year).at(-1);return prev?e.shares[0]-prev.shares[0]:null;}
 if(['left','center','right'].includes(metric))return e.shares[['left','center','right'].indexOf(metric)];
 if(metric==='lead')return e.first[0]?.[2]??null;
 if(metric==='gap'||metric==='runoff'){const rr=metric==='gap'?e.first:e.run;return rr.length>1?rr[0][2]-rr[1][2]:null;}
 if(metric==='coverage')return e.areas.length;
 return median(e.areas.map(localMargin));
}
const option=(v,t,s)=>'<option value="'+esc(v)+'"'+(String(v)===String(s)?' selected':'')+'>'+esc(t)+'</option>';
const sw=(c,t)=>'<span><i aria-hidden="true" class="swatch region-swatch" style="background:'+c+'"></i>'+esc(t)+'</span>';
const div=()=>metric==='balance'||metric==='swing';
const signed=x=>(x>0?'+':'')+fmt.format(x)+' pp';
const vfmt=v=>!Number.isFinite(v)?'—':div()?signed(v):metric==='coverage'||metric==='ctxPop'?num.format(v):metric==='ctxGdp'?'$'+num.format(Math.round(v)):metric==='local'||metric==='gap'||metric==='runoff'?fmt.format(v)+' pp':pct(v);
function fill(v){
 if(!Number.isFinite(v))return 'url(#missing)';
 if(div())return (metric==='balance'?(v>=0?['#cde6ea','#6db7bf','#086572']:['#e5d3f2','#b987d2','#633088']):(v>=0?['#d3ead8','#75b787','#1b6a41']:['#f0d9d3','#d99683','#8f4231']))[Math.min(2,Math.floor(Math.abs(v)/(metric==='balance'?16:6)))];
 const max=O[metric]?.[1]??(metric==='coverage'?70:metric==='local'||metric==='gap'||metric==='runoff'?50:100);
 return ['#e3e9f8','#bbc9ee','#8e9fdb','#5b63b4','#383879'][Math.min(4,Math.floor(Math.max(0,v)/max*5))];
}
function options(){
 document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.view===mode));
 $('period-label').textContent=mode==='blocs'?'Election window':'Latest in atlas as of';
 $('period').innerHTML=mode==='blocs'?ranges.map(([s],i)=>option(i,s,windowId)).join(''):[['0','Latest available'],...[2025,2020,2015,2010,2005,2000,1995].map(v=>[v,v])].map(([v,t])=>option(v,t,windowId)).join('');
 $('region').value=region;
 $('country').innerHTML=option('','Choose a country',country)+countries().map(k=>option(k,db[k].name,country)).join('');
 $('metric').innerHTML=[...specs[mode],...overlays].map(([v,t])=>option(v,t,metric)).join('');
}
const def='<defs><pattern id="missing" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="#eef1f5"/><path d="M0 0L0 6" stroke="#aebac9" stroke-width="2"/></pattern></defs>';
const crowd=new Set(['BLZ','GTM','HND','SLV','NIC','CRI','PAN','GUY','SUR','HTI','DOM']);
const physicalFor={
 both:new Set(['Andes','Amazon Basin','Pampas','Patagonia','Guiana Highlands','Caribbean Sea']),
 'South America':new Set(['Andes','Amazon Basin','Pampas','Patagonia','Guiana Highlands']),
 'Central America':new Set(['Central American Cordillera']),
 'Mexico':new Set(['Sierra Madre Occidental','Sierra Madre Oriental']),
 'Caribbean':new Set(['Caribbean Sea']),
};
function map(){
 const keys=new Set(countries()), frame=geo.frames?.[region]||geo.frames?.both||'-206 -124 675 686';
 $('map').setAttribute('viewBox',frame);
 $('map').classList.toggle('map-central',region==='Central America');
 $('map').classList.toggle('map-overview',region==='both');
 $('map').classList.toggle('map-caribbean',region==='Caribbean');
 $('map').classList.toggle('map-mexico',region==='Mexico');
 $('map').setAttribute('aria-label','Select a country on the map: '+displayRegion(region));
 $('map').innerHTML=def+Object.entries(geo.countries).sort(([k],[j])=>Number(k===country)-Number(j===country)).map(([k,g])=>{
  const active=keys.has(k), e=active?pick(k):null, v=active?value(k,e):null, s=active?db[k].name+', '+(e&&!O[metric]?e.year+', ':'')+vfmt(v):'';
  const t=active?' data-country="'+k+'" class="province '+(k===country?'selected':'')+'" tabindex="0" role="button" aria-label="'+esc(s)+'"':'';
  return '<path fill-rule="evenodd" d="'+g.d+'" fill="'+(active?fill(v):'#d1d9e4')+'" stroke="#fff" stroke-width=".6"'+t+'>'+(active?'<title>'+esc(s)+'</title>':'')+'</path>';
 }).join('')+($('physical').checked?'<g aria-hidden="true" pointer-events="none">'+geo.rivers.map(d=>'<path d="'+d+'" stroke="#205c81" stroke-opacity=".46" stroke-width=".6" fill="none"/>').join('')+geo.terrain.filter(x=>physicalFor[region]?.has(x[0])).map(([n,x,y])=>'<text class="terrain-label" x="'+x+'" y="'+y+'" text-anchor="middle">'+esc(n)+'</text>').join('')+'</g>':'')+($('names').checked?countries().map(k=>{
 const g=geo.countries[k];return g?.xy?'<text class="region-label" x="'+g.xy[0]+'" y="'+g.xy[1]+'" text-anchor="middle">'+esc(region==='both'&&crowd.has(k)?k:region==='Caribbean'&&k==='DOM'?'Dom. Republic':db[k].name)+'</text>':'';
 }).join(''):'');
 $('legend').innerHTML=div()?sw(fill(-80),metric==='swing'?'Left lost share':'Right larger')+sw('#d8e5ec','Near even')+sw(fill(80),metric==='swing'?'Left gained share':'Left larger')+sw('repeating-linear-gradient(45deg,#eef1f5,#eef1f5 2px,#aebac9 3px,#eef1f5 4px)','No data'):sw('#e3e9f8','Lower')+sw('#5b63b4','Higher')+sw('repeating-linear-gradient(45deg,#eef1f5,#eef1f5 2px,#aebac9 3px,#eef1f5 4px)','No data');
}
function bars(items, max=12){
 return items.slice(0,max).map(([name,sub,p,col])=>'<div class="candidate"><span>'+esc(name)+(sub?'<small class="muted"> · '+esc(sub)+'</small>':'')+'</span><b>'+pct(p)+'</b><span class="bar" aria-hidden="true"><i style="width:'+Math.min(100,Math.max(0,p))+'%;background:'+col+'"></i></span></div>').join('');
}
function context(k){
 const x=ctx[k]||{}, rr=[['SP.POP.TOTL','Residents',v=>num.format(v)],['SP.POP.TOTL.FE.ZS','Female share',pct],['SP.POP.TOTL.MA.ZS','Male share',pct],['SP.URB.TOTL.IN.ZS','Urban population',pct],['NY.GDP.PCAP.CD','GDP per person',v=>'$'+num.format(Math.round(v))],['NV.AGR.TOTL.ZS','Agriculture / GDP',pct],['NV.IND.TOTL.ZS','Industry / GDP',pct],['NV.SRV.TOTL.ZS','Services / GDP',pct],['GC.XPN.TRFT.ZS','Subsidies & transfers / expense',pct]];
 const extra=db[k].region==='South America'?'<p><a href="south-america.html">Industry, fiscal support and geography atlas</a></p>':'';
 return '<details><summary>Population and economy · 2023</summary><div class="context-micro">'+rr.map(([v,l,f])=>'<div class="stat"><strong>'+esc(Number.isFinite(x[v])?f(x[v]):'—')+'</strong><span>'+esc(l)+'</span></div>').join('')+'</div><p class="regional-mini muted">Resident and economy measures, not voter demographics. Missing data is not zero.</p>'+extra+'</details>';
}
const partyColors=['#713592','#087889','#ad5013','#255f9f','#a03652','#4d743d','#5c547c','#6a551c'];
const tied=a=>a[2][0]?.[1]===a[2][1]?.[1];
function colors(e){const tally={};for(const a of e.areas)if(a[2][0]&&!tied(a))tally[a[2][0][0]]=(tally[a[2][0][0]]||0)+1;return Object.fromEntries(Object.keys(e.parties).sort((a,b)=>(tally[b]||0)-(tally[a]||0)).map((x,i)=>[x,partyColors[i]||'#707b8c']));}
const pRow=(name,sub,p)=>[name,sub,p,'#713592'];
function drillLinks(d){
 const args=[];
 if(country==='ARG')args.push('<a class="context-link" href="/argentina">Argentina 2023: provinces</a>','<a class="context-link" href="/local">Municipalities &amp; voting circuits</a>');
 if(mode!=='pres'&&d.pres.length)args.push('<button type="button" data-drill="pres">National election results</button>');
 if(mode!=='leg'&&d.leg.length)args.push('<button type="button" data-drill="leg">Explore constituencies</button>');
 const scope=country==='ARG'?'Argentina 2023 goes deeper where official section and circuit returns exist.':d.leg.length?'Local results follow electoral constituencies, which may not match provinces or city limits.':'No verified constituency or city-level returns are available here.';
 return '<div class="bo-drill-actions">'+args.join('')+'</div><p class="regional-mini muted">'+scope+'</p>';
}
function details(){
 if(!country){
  const title=region==='both'?'Choose a region or country':displayRegion(region);
  const regionButtons=regions.map(([key,name,label])=>{
   const n=sorted.filter(k=>db[k].region===name).length;
   return '<button data-region="'+esc(name)+'" type="button">'+esc(label)+' · '+n+' '+(n===1?'country':'countries')+'</button>';
  }).join('');
  $('details').innerHTML='<h2>'+esc(title)+'</h2><p class="regional-note">Select a country on the map or from the country list to see its election history and available local results.</p>'+(region==='both'?'<div class="bo-drill-actions">'+regionButtons+'</div>':'')+'<p class="regional-mini muted">Local coverage varies by country. City and voting-circuit returns are available in the Argentina 2023 atlas.</p>';
  return;
 }
 const d=db[country], e=selected(), detail=$('details');
 const es=d[mode], matched=e&&e===pick(country);
 let h='<p class="eyebrow">'+esc(displayRegion(d.region))+'</p><h2>'+esc(d.name)+'</h2>';
 if(d.note)h+='<p class="regional-note">'+esc(d.note)+(d.url?' '+sourceLink('Source',d.url):'')+'</p>';
 if(!e){const why=mode==='blocs'?'No comparable ideology scores in this dataset.':mode==='pres'?'No direct presidential vote returns are available here.':'No comparable local party vote totals are available here.';detail.innerHTML=h+drillLinks(d)+'<p class="regional-note">'+why+'</p>'+context(country);return;}
 h+=drillLinks(d);
 if(!matched)h+='<p class="regional-note">Showing a different election from the regional map window.</p>';
 if(mode==='blocs'){
  const prev=es.filter(x=>x.year<e.year).at(-1);
  h+='<h3>'+e.year+' · First-round vote by bloc</h3>'+bars(labels.map((n,i)=>[n,'',e.shares[i],inks[i]]),4);
  if(prev)h+='<p class="delta">Since '+prev.year+': '+labels.slice(0,3).map((n,i)=>n+' '+signed(e.shares[i]-prev.shares[i])).join(' · ')+'</p>';
  h+='<h3>Bloc history</h3>'+es.map(b=>'<div class="trend"><button type="button" data-election="'+b.year+'" aria-pressed="'+(b===e)+'">'+b.year+'</button><span class="trend-bar" title="'+esc(b.shares.map((p,i)=>labels[i]+' '+pct(p)).join(', '))+'">'+b.shares.map((p,i)=>'<i style="width:'+p+'%;background:'+pale[i]+'"></i>').join('')+'</span></div>').join('');
  h+='<details><summary>Candidates, parties and ideology scores</summary>'+bars(e.rows.map(([n,p,s,i,b])=>[n,[p,i===null?'Uncoded':i+' / 20'].filter(Boolean).join(' · '),s,inks[b]]),99)+'</details>';
 }else{
  h+='<label class="chooser">Inspect election<select class="regional-chevron" id="election">'+es.slice().reverse().map(x=>option(x.id??x.date,date(x),e.id??e.date)).join('')+'</select></label>';
  if(mode==='pres'){
   h+='<h3>First round</h3>'+bars(e.first.map(x=>pRow(...x)),12);
   if(e.run.length)h+='<h3>Runoff '+(e.runDate&&e.runDate!=='nan'?'· '+esc(e.runDate):'')+'</h3>'+bars(e.run.map(x=>pRow(...x)),12);
   if(country==='VEN')h+='<p class="regional-note">The disputed 2024 result is omitted.</p>';
   if(e.note)h+='<p class="regional-note">'+esc(e.note)+'</p>';
   h+='<p class="regional-mini muted">National candidate vote shares · '+sourceLink(e.src,e.url)+'</p>';
   if(e.first.length>12)h+='<details><summary>Show all '+e.first.length+' first-round entries</summary>'+bars(e.first.map(x=>pRow(...x)),e.first.length)+'</details>';
  }else{
   const cc=colors(e), lead={};for(const a of e.areas){if(tied(a))continue;const p=a[2][0][0];lead[p]=(lead[p]||0)+1;}
   const top=Object.entries(lead).sort((a,b)=>b[1]-a[1]);
   h+='<h3>Where each party led</h3>'+top.slice(0,12).map(([id,n])=>'<div class="candidate"><span><i class="swatch" style="background:'+cc[id]+'"></i>'+esc(e.parties[id]||id)+'</span><b>'+n+' of '+e.areas.length+'</b></div>').join('');
   h+='<p class="regional-mini muted">Constituencies with usable party tallies. They vary in size; a local lead does not imply a seat win.'+(e.src?' '+sourceLink(e.src,e.url)+'.':'')+'</p><a href="#districts">Explore constituency results</a>';
  }
 }

 detail.innerHTML=h+context(country);
 $('election')?.addEventListener('change',ev=>{electionId=ev.target.value;district=-1;localParty='';writeState();render();$('election')?.focus();});
}
function districtTable(){
 const out=$('districts'), e=selected();
 if(mode!=='leg'||!e){out.hidden=true;out.innerHTML='';return;}
 out.hidden=false;
 if(district>=e.areas.length)district=-1;
 const cc=colors(e), pOpts=Object.entries(e.parties).sort((a,b)=>a[1].localeCompare(b[1]));
 const shapes=geo.districts[country]||[], mapped=e.areas.map((a,i)=>[i,a,shapes[a[4]]]).filter(x=>x[2]);
 const used=new Map();for(const [,a,g] of mapped)used.set(g,(used.get(g)||0)+1);
 const clean=mapped.filter(([,a,g])=>used.get(g)===1);
 const filtered=e.areas.map((a,i)=>[i,a,shares(a)]).filter(([i,a,s])=>!localParty||s.some(r=>r[0]===localParty));
 filtered.sort((x,y)=>localParty?(y[2].find(r=>r[0]===localParty)?.[1]||0)-(x[2].find(r=>r[0]===localParty)?.[1]||0):(localMargin(y[1])??-1)-(localMargin(x[1])??-1));
 let svg='';
 if(clean.length){
  const a=shapes.map(x=>x.box), x=Math.min(...a.map(x=>x[0])), y=Math.min(...a.map(x=>x[1])), w=Math.max(...a.map(x=>x[2]))-x,h=Math.max(...a.map(x=>x[3]))-y;
  svg='<div class="district-map"><svg viewBox="'+[x-3,y-3,w+6,h+6].join(' ')+'" role="group" aria-label="Mapped constituencies">'+shapes.map(g=>'<path d="'+g.d+'" fill="#d4dce7" stroke="#fff" stroke-width=".3" fill-rule="evenodd"/>').join('')+
  clean.map(([i,a,g])=>{
   const s=shares(a), p=s.find(r=>r[0]===localParty)?.[1], label=a[0]+', '+(localParty?'Selected party: '+pct(p):(tied(a)?'Tied lead':e.parties[s[0][0]])+' '+pct(s[0][1]));
   const col=localParty?(Number.isFinite(p)?['#e3e9f8','#bbc9ee','#8e9fdb','#5b63b4','#383879'][Math.min(4,Math.floor(p/20))]:'#d4dce7'):tied(a)?'#606973':cc[s[0][0]];
   return '<path fill-rule="evenodd" class="province '+(i===district?'selected':'')+'" data-district="'+i+'" tabindex="0" role="button" aria-label="'+esc(label)+'" d="'+g.d+'" fill="'+col+'"><title>'+esc(label)+'</title></path>';
  }).join('')+'</svg><p class="regional-mini muted">'+clean.length+' of '+e.areas.length+' archive areas mapped to present-day boundaries.</p></div>';
 }
 const a=e.areas[district];
 out.innerHTML='<div class="rank-head"><h2>Constituency strongholds</h2><span class="muted">'+esc(db[country].name)+' · '+esc(date(e))+'</span></div><div class="district-controls"><label>Track a party<select id="local-party">'+option('','All parties · local leads',localParty)+pOpts.map(([p,n])=>option(p,n,localParty)).join('')+'</select></label><label>Inspect a constituency<select id="district-picker">'+option(-1,'Choose a constituency',district)+e.areas.map((a,i)=>option(i,a[0]+(a[1]?' · '+a[1]:''),district)).join('')+'</select></label></div>'+
 '<div class="district-grid '+(svg?'':'table-only')+'">'+svg+'<div id="district-result">'+(a?'<h3>'+esc(a[0])+'</h3>'+bars(shares(a).map(([p,s,v])=>[e.parties[p],num.format(v)+' tallies',s,cc[p]]),99)+(a[3]?'<p class="regional-note">'+esc(a[3])+'</p>':''):'<p class="muted">'+(svg?'Select a shape or a constituency below.':'Boundaries are not matched for this election; use the constituency table.')+'</p>')+'</div></div>'+
 '<div class="table-wrap"><table><thead><tr><th scope="col">Constituency</th><th scope="col">Local leader</th><th scope="col">'+(localParty?'Selected party':'Top-two gap')+'</th></tr></thead><tbody>'+filtered.map(([i,a,s])=>{
 const v=localParty?pct(s.find(r=>r[0]===localParty)?.[1]):Number.isFinite(localMargin(a))?fmt.format(localMargin(a))+' pp':'—';
 return '<tr class="'+(i===district?'active-row':'')+'"><td><button type="button" data-district="'+i+'">'+esc(a[0])+(a[1]?' · '+esc(a[1]):'')+'</button></td><td>'+esc(tied(a)?'Tied lead':e.parties[s[0][0]])+' · '+pct(s[0][1])+'</td><td>'+esc(v)+'</td></tr>';
 }).join('')+'</tbody></table></div>';
 $('local-party').onchange=ev=>{localParty=ev.target.value;writeState();districtTable();$('local-party').focus();};
 $('district-picker').onchange=ev=>{district=Number(ev.target.value);writeState(true);districtTable();crumbs();$('district-picker').focus();};
}
function compare(){
 const a=countries().map(k=>[k,pick(k),value(k,pick(k))]).sort((a,b)=>(b[2]??-Infinity)-(a[2]??-Infinity));
 const rows=a.map(([k,e,v])=>'<tr class="'+(country===k?'active-row':'')+'"><td><button type="button" data-country="'+k+'">'+esc(db[k].name)+'</button></td><td>'+(O[metric]?'2023':e?e.year:'—')+'</td><td>'+vfmt(v)+'</td></tr>').join('');
 const m=[...specs[mode],...overlays].find(x=>x[0]===metric)[1];
 $('compare').innerHTML='<div class="rank-head"><h2>Compare countries</h2><button id="csv" type="button">Download this view</button></div><p class="muted regional-mini">'+(O[metric]?'2023 country context from World Bank WDI.':'Countries without a result for the selected window or metric remain unshaded.')+'</p><div class="table-wrap"><table><thead><tr><th scope="col">Country</th><th scope="col">Year</th><th scope="col">'+esc(m)+'</th></tr></thead><tbody>'+rows+'</tbody></table></div>';
 $('csv').onclick=()=>{const q=x=>'"'+String(x??'').replaceAll('"','""')+'"';const terms=[['Country','Year',m],...a.map(([k,e,v])=>[db[k].name,O[metric]?2023:e?.year,v])];const url=URL.createObjectURL(new Blob([terms.map(r=>r.map(q).join(',')).join('\n')],{type:'text/csv'}));const l=document.createElement('a');l.href=url;l.download='latin-america-voting-view.csv';l.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
}
function render(){
 options();map();details();districtTable();compare();crumbs();
 const n=countries().filter(k=>Number.isFinite(value(k,pick(k)))).length;
 $('summary').textContent=n+' of '+countries().length+' countries have data for this map. '+(O[metric]?'Context only; country panel keeps election results.':mode==='blocs'?'Historical presidential first-round blocs, 1990–2018.':mode==='pres'?'National presidential return coverage varies by country.':'Reported lower-house constituency coverage varies by country.');
}
function resetSelection(){electionId='';district=-1;localParty='';}
function setRegion(value){region=value;country=value==='Mexico'?'MEX':'';resetSelection();writeState(true);render();}
function setCountry(value){country=value; if(country)region=db[country].region;resetSelection();writeState(true);render();}
function setMode(value){mode=value;windowId='0';metric=specs[mode][0][0];resetSelection();writeState(true);render();}
function moveFocus(target){
 target?.focus({preventScroll:true});
 if(target && innerWidth<761)target.scrollIntoView({block:'start'});
}
function navigate(ev){
 const c=ev.target.closest('[data-country]'), k=ev.target.closest('[data-election]'), a=ev.target.closest('[data-district]'), b=ev.target.closest('[data-view]'), r=ev.target.closest('[data-region]'), deeper=ev.target.closest('[data-drill]');
 if(r){setRegion(r.dataset.region);moveFocus($('details'));return;}
 if(c){setCountry(c.dataset.country);moveFocus($('details'));return;}
 if(deeper){setMode(deeper.dataset.drill);if(mode==='leg'){const t=$('districts');t.tabIndex=-1;t.focus({preventScroll:true});t.scrollIntoView({block:'start'});} else moveFocus($('details'));return;}
 if(b){setMode(b.dataset.view);return;}
 if(k){electionId=k.dataset.election;writeState();render();document.querySelector('[data-election="'+electionId+'"]')?.focus();return;}
 if(a){district=Number(a.dataset.district);writeState(true);districtTable();crumbs();$('district-result').tabIndex=-1;$('district-result').focus();}
}
document.addEventListener('click',navigate);
document.addEventListener('keydown',ev=>{if((ev.key==='Enter'||ev.key===' ')&&ev.target.matches('path[role="button"]')){ev.preventDefault();navigate(ev);}});
window.addEventListener('popstate',()=>{loadState();render();});
$('country').onchange=ev=>setCountry(ev.target.value);
$('region').onchange=ev=>setRegion(ev.target.value);
$('metric').onchange=ev=>{metric=ev.target.value;writeState();render();};
$('period').onchange=ev=>{windowId=ev.target.value;resetSelection();writeState();render();};
$('names').onchange=map;$('physical').onchange=map;
render();
})();
