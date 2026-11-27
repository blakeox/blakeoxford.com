'use strict';
const $=id=>document.getElementById(id), qs=new URLSearchParams(location.search);
const colors=['#a87ed1','#6cb5cc','#e8bc62','#91b897','#d68998'], ink=['#743bab','#167e9e','#a66a00','#517155','#a33c50'];
const gainBins=['#abcbd9','#e5def5','#d2bbed','#b48bda','#935dc5','#673296'];
const people=['Javier Milei','Sergio Massa','Patricia Bullrich','Juan Schiaretti','Myriam Bregman'];
const ns='http://www.w3.org/2000/svg', nf=new Intl.NumberFormat('en-US');
const pct=v=>v==null?'—':v.toFixed(1)+'%', delta=v=>v==null?'—':(v>=0?'+':'')+v.toFixed(1)+' pp';
const rates=(x,key)=>{const a=x?.[key];if(!a)return null;const counts=a.slice(0,-2), total=counts.reduce((x,y)=>x+y,0);return total?counts.map(x=>100*x/total):null;};
const vote=(x,key)=>rates(x,key)?.[0]??null,gain=x=>vote(x,'a')==null||vote(x,'b')==null?null:vote(x,'b')-vote(x,'a');
const winner=(x,key)=>{const r=rates(x,key);if(!r)return -1;const max=Math.max(...r);return r.filter(x=>x===max).length>1?-2:r.indexOf(max);};
const leaders=(x,key)=>{const w=winner(x,key);return w===-2?'Tie':w<0?'—':people[w].split(' ').at(-1);};
const bins=[10000,50000,100000,250000], popInk=['#e3f3ef','#b0ddd5','#76bcb0','#318f80','#07594e'], pop=x=>regional?.provinces[data?.id]?.sections[x?.id]?.total;
const fill=(x,key)=>{if(key==='p'){const n=pop(x),i=bins.findIndex(b=>n<b);return Number.isFinite(n)?popInk[i<0?4:i]:'#c7cdd5';}if(key!=='g')return colors[winner(x,key)]||'#c7cdd5';const g=gain(x);return g==null?'#c7cdd5':gainBins[g<0?0:Math.min(5,1+Math.floor(g/10))];};
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let dataset=[], data, sec='', circ='', mode=({first:'a',run:'b',gain:'g',a:'a',b:'b',g:'g',p:'p'})[qs.get('m')]||'b', base, box, req=0,regional=null;
const svg=$('map');
function el(tag,attrs={}){const p=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))p.setAttribute(k,v);return p;}
function path(x,type,select){if(!x.p)return;const p=el('path',{d:x.p,fill:fill(x,mode),'fill-rule':'evenodd',class:'province',role:'button',tabindex:'0','aria-pressed':String(select),'aria-label':x.n+(x.z?' • '+x.z:'')});if(select)p.classList.add('selected');const t=el('title');t.textContent=x.n+(x.z?' · '+x.z:'')+' · '+(mode==='p'?AtlasContext.num(pop(x))+' residents':mode==='g'?delta(gain(x)):leaders(x,mode)+' leads · Milei '+pct(vote(x,mode)));p.append(t);const pick=()=>{if(type==='s'){sec=x.id;circ='';render(true);}else{circ=x.id;render(false);}};p.onclick=pick;p.onkeydown=e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();pick();}};svg.append(p);}
function setBox(v){box=v;svg.setAttribute('viewBox',v.join(' '));}
function fit(section){const q=section?.q;if(!q)return data.bounds;const w=q[2]-q[0],h=q[3]-q[1],p=Math.max(w,h)*.08;return [q[0]-p,q[1]-p,Math.max(1,w+2*p),Math.max(1,h+2*p)];}
function zoom(k){if(!box)return;const [x,y,w,h]=box, f=Math.max(.08,Math.min(2,w/base[2]*k))/(w/base[2]);setBox([x+(w-w*f)/2,y+(h-h*f)/2,w*f,h*f]);}
$('zoomIn').onclick=()=>zoom(.7);$('zoomOut').onclick=()=>zoom(1/.7);$('reset').onclick=()=>base&&setBox(base);
let start;svg.addEventListener('pointerdown',e=>{if(e.pointerType!=='mouse'&&!e.shiftKey)return;start=[e.clientX,e.clientY,...box||[]];});svg.addEventListener('pointermove',e=>{if(!start||!e.buttons||!box||Math.hypot(e.clientX-start[0],e.clientY-start[1])<5)return;const [, ,x,y,w,h]=start;if(!w)return;const f=Math.max(w/svg.clientWidth,h/svg.clientHeight);setBox([x-(e.clientX-start[0])*f,y-(e.clientY-start[1])*f,w,h]);});window.addEventListener('pointerup',()=>start=null);
const options=(node,rows,label,any)=>{node.replaceChildren();if(any)node.add(new Option(any,''));rows.forEach(x=>node.add(new Option(label(x),x.id)));};
const params=()=>{const u=new URL(location.href);u.search='';u.searchParams.set('d',data.id);if(sec)u.searchParams.set('s',sec);if(circ)u.searchParams.set('c',circ);u.searchParams.set('m',mode);history.replaceState(null,'',u);};
function buildDetail(item,section,isCircuit){
  if(!item){$('detail').innerHTML='<p class="eyebrow">District overview</p><h2>'+escape(data.n)+'</h2><p class="line">Tap an electoral section to see its candidate totals and drill into individual voting circuits.</p><p class="line muted">'+data.s.length+' sections have results. Circuit boundaries are approximate where mapped.</p>';return;}
  const lines=(key,date)=>{const r=rates(item,key);if(!r)return '<div class="group"><h3>'+date+'</h3><p class="muted">No reported candidate votes</p></div>';return '<div class="group"><h3>'+date+'</h3>'+r.map((v,i)=>({v,i})).sort((a,b)=>b.v-a.v).map(({v,i})=>'<div class="candidate"><span>'+people[i]+'</span><b>'+pct(v)+' <span class="muted small">· '+nf.format(item[key][i])+'</span></b><span class="bar" aria-hidden="true"><i style="width:'+v+'%;background:'+ink[i]+'"></i></span></div>').join('')+'<p class="small muted">'+nf.format(item[key].at(-1))+' ballots reported, including '+nf.format(item[key].at(-2))+' non-candidate ballots.</p></div>';};
  $('detail').innerHTML='<p class="eyebrow">'+(isCircuit?escape(section.n)+' · voting circuit':'Electoral section')+'</p><h2>'+escape(item.n)+'</h2>'+(item.z?'<p class="muted">'+escape(item.z)+'</p>':'')+'<div class="stats">'+[[pct(vote(item,'a')),'Milei · October'],[pct(vote(item,'b')),'Milei · November'],[delta(gain(item)),'Vote share gain']].map(([v,n])=>'<div class="stat"><strong>'+v+'</strong><span>'+n+'</span></div>').join('')+'</div>'+lines('a','October 22 · First round')+lines('b','November 19 · Runoff')+(isCircuit?'<p class="line muted small">'+(item.y?'Approximate boundary from '+item.y+'.':'No confidently matched boundary; results are in the table only.')+'</p>':'');
}
function render(reframe){
 const section=data.s.find(x=>x.id===sec), circuits=section?data.c[sec]||[]:[], found=circuits.find(x=>x.id===circ),k=mode==='a'?'a':'b';
 const localTrail=$('local-trail'); const link=(name,href)=>'<a href="'+href+'">'+escape(name)+'</a>';
 const where=(name)=>'<span aria-current="page">'+escape(name)+'</span>';
 const baseUrl='/local?d='+encodeURIComponent(data.id)+'&amp;m='+encodeURIComponent(mode);
 localTrail.innerHTML=link('All regions','/')+link('South America','/?region=south')+link('Argentina','/argentina')+(section?link(data.n,baseUrl):where(data.n))+(section?(found?link(section.n,baseUrl+'&amp;s='+encodeURIComponent(section.id)):where(section.n)):'')+(found?where(found.n):'');
 $('s').value=sec;options($('c'),circuits,x=>x.n+(x.z?' · '+x.z:''),'All circuits');$('c').value=circ;$('c').disabled=!section;
 $('back').disabled=!section;
 document.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===mode)));
 if(reframe||!base){base=fit(mode==='p'?null:section);setBox(base);}
 svg.replaceChildren();
 if(section&&mode!=='p'){if(section.p)svg.append(el('path',{d:section.p,fill:'#dbe2ee',stroke:'#aebbd0','stroke-width':1,'vector-effect':'non-scaling-stroke'}));for(const x of circuits)path(x,'c',x.id===circ);}
 else for(const x of data.s)path(x,'s',x.id===sec);
 $('status').textContent=mode==='p'?'2022 census residents by matched section. Select a section for details.':section?section.n+' · '+circuits.filter(x=>x.p).length+' of '+circuits.length+' circuits mapped'+(section.id==='13'&&data.id==='1'?' · Monumental stadium and Chinatown are in Belgrano.':''):data.n+' · '+data.s.filter(x=>x.p).length+' of '+data.s.length+' sections mapped';
 const sw=(c,n)=>'<span><i class="swatch" style="background:'+c+'"></i>'+n+'</span>';
 $('legend').innerHTML=(mode==='p'?popInk.map((c,i)=>sw(c,['Below 10,000','10,000–49,999','50,000–99,999','100,000–249,999','250,000+'][i])):mode==='g'?gainBins.map((c,i)=>sw(c,['Below 0 pp','0–9.9 pp','10–19.9 pp','20–29.9 pp','30–39.9 pp','40+ pp'][i])):people.slice(0,k==='a'?5:2).map((n,i)=>sw(colors[i],n.split(' ').at(-1)))).join('')+sw('#c7cdd5',mode==='p'?'Not available':'Tie / no data');
 buildDetail(found||section,section,!!found);
 $('local-context').href=AtlasContext.link(data.id,sec);
 if(regional)$('detail').insertAdjacentHTML('beforeend',AtlasContext.profile(regional,data.id,sec,!!found));
 $('tableTitle').textContent=section?'Voting circuits in '+section.n:'Electoral sections in '+data.n;
 $('leadLabel').textContent=k==='a'?'October leader':'Runoff leader';
 $('listHint').textContent=section?'Unmapped circuits still have results. Select a row for the full count.':'Select a section to drill into its voting circuits.';
 const items=(section?circuits:data.s).slice().sort((x,y)=>mode==='g'?(gain(y)??-999)-(gain(x)??-999):(vote(y,k)??-1)-(vote(x,k)??-1));
 $('rows').innerHTML=items.map(x=>'<tr class="'+(x.id===circ?'active-row':'')+'"><td><button type="button" data-row="'+escape(x.id)+'">'+escape(x.n)+(x.p?'':' <span class="muted small">(unmapped)</span>')+'</button></td><td>'+leaders(x,k)+'</td><td>'+pct(vote(x,'a'))+'</td><td>'+pct(vote(x,'b'))+'</td><td>'+delta(gain(x))+'</td></tr>').join('');
 params();
}
$('rows').onclick=e=>{const b=e.target.closest('[data-row]');if(!b)return;if(sec){circ=b.dataset.row;render(false);}else{sec=b.dataset.row;circ='';render(true);}$('detail').scrollIntoView({block:'nearest'});};
$('s').onchange=e=>{sec=e.target.value;circ='';render(true);};$('c').onchange=e=>{circ=e.target.value;render(false);};
$('back').onclick=()=>{sec='';circ='';render(true);};
document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{mode=b.dataset.mode;if(data)render(true);});
async function get(path){const r=await fetch(path);if(!r.ok)throw Error(r.status);return r.json();}
async function openDistrict(id,s='',c='',n=''){const seq=++req;$('status').textContent='Loading local results…';$('s').disabled=true;$('c').disabled=true;try{const latest=await get('local/'+id+'.json');if(seq!==req)return;data=latest;sec=data.s.find(x=>x.id===s||x.n.toLowerCase()===n.toLowerCase())?.id||'';circ=(data.c[sec]||[]).find(x=>x.id===c)?.id||'';options($('s'),data.s,x=>x.n+(x.z&&x.id==='13'?' · '+x.z:''),'All sections');$('d').value=id;$('s').disabled=false;render(true);}catch(e){if(seq===req)$('status').textContent='Could not load this district. Try selecting another district or reload.';}}
$('d').onchange=e=>openDistrict(e.target.value);
(async()=>{try{dataset=await get('local/index.json');options($('d'),dataset,x=>x.n);$('d').disabled=false;const id=dataset.some(x=>x.id===qs.get('d'))?qs.get('d'):'1';await openDistrict(id,qs.get('s')||'',qs.get('c')||'',qs.get('name')||'');}catch(e){$('status').textContent='Could not load the atlas. Try reloading.';}})();

AtlasContext.data().then(x=>{regional=x;$('population-mode').disabled=false;if(data)render(true);}).catch(()=>{if(mode==='p'){mode='b';if(data)render(true);}});
