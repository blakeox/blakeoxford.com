/** Validate rendering and politics-data states without browser dependencies. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(process.argv[2]||path.join(__dirname,'output'));
const html=fs.readFileSync(path.join(root,'regional.html'),'utf8');
const input=fs.readFileSync(path.join(root,'regional.js'),'utf8');
const files={}; for(const n of ['regional-votes','regional-geography','regional-context'])files[n+'.json']=JSON.parse(fs.readFileSync(path.join(root,n+'.json'),'utf8'));
const ids=[...html.matchAll(/ id="([\w-]+)"/g)].map(m=>m[1]);
async function get(query) {
 const elements={};
 function el(id){
  if(!elements[id]) elements[id]={id,innerHTML:'',textContent:'',checked:id==='names',classList:{toggle(){}},setAttribute(k,v){this[k]=v;},addEventListener(){}};
  return elements[id];
 }
 for(const id of ids)el(id);
 const location=new URL('https://atlas.test/'+query);
 await vm.runInNewContext(input,{
  console,Intl,URL,URLSearchParams,location,history:{},
  document:{getElementById:id=>elements[id]||(id==='csv'||id==='district-picker'||id==='local-party')&&el(id)||null,querySelectorAll:()=>[],addEventListener(){}},
  window:{addEventListener(){}},fetch:async name=>({ok:!!files[name],json:async()=>files[name]}),
 },{filename:'regional.js'});
 return elements;
}
(async()=>{
 let el=await get('');
 assert.match(el.summary.textContent,/of 23 countries/);
 assert.equal((el.map.innerHTML.match(/data-country=/g)||[]).length,23);
 assert.match(el.details.innerHTML,/Selected Caribbean · 3 countries/);
 assert.match(el.details.innerHTML,/Central America · 7 countries/);
 el=await get('?region=caribbean');
 assert.match(el.summary.textContent,/of 3 countries/);
 assert.deepEqual([...el.country.innerHTML.matchAll(/value="([^"]*)"/g)].map(x=>x[1]),['','CUB','DOM','HTI']);
 el=await get('?country=CUB&view=pres');
 assert.match(el.details.innerHTML,/does not directly elect its president/);
 assert.match(el.details.innerHTML,/https:\/\/data\.ipu\.org/);
 el=await get('?country=HTI&view=pres');
 assert.match(el.details.innerHTML,/1,062,839 valid votes/);
 assert.match(el.details.innerHTML,/Show all 28 first-round entries/);
 el=await get('?country=MEX&view=pres');
 assert.match(el.details.innerHTML,/Claudia Sheinbaum/);
 assert.match(el.details.innerHTML,/https:\/\/[^"]*\.ine\.mx/);
 assert.equal(el.region.value,'Mexico');
 el=await get('?region=mexico&view=leg');
 assert.match(el.districts.innerHTML,/Boundaries are not matched/);
 assert.equal((el.districts.innerHTML.match(/ data-district=/g)||[]).length,301);
 el=await get('?country=DOM&view=pres');
 assert.match(el.details.innerHTML,/Luis Abinader/);
 el=await get('?region=central');
 assert.match(el.summary.textContent,/of 7 countries/);
 assert.match(el.country.innerHTML,/Belize/);
 el=await get('?region=south');
 assert.match(el.summary.textContent,/of 12 countries/);
 assert.match(el.map.innerHTML,/data-country="ARG"/);
 console.log('All region and country-rendering assertions passed.');
})().catch(e=>{console.error(e);process.exit(1)});
