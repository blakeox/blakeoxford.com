import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {request as httpRequest} from 'node:http';
const live=process.argv.includes('--live');
const base=process.env.ATLAS_TEST_URL??'https://atlas.blakeoxford.com';
const http=live||!!process.env.ATLAS_TEST_URL;
const worker=http?null:(await import('../mcp-release/bundle.mjs')).default;
const manifest=http?{}:JSON.parse(await readFile(new URL('../mcp-release/manifest.json',import.meta.url)));
const env={ATLAS_ASSETS:{async get(name){
 const entry=Object.entries(manifest).find(([p,v])=>(v.key??p)===name);
 if(!entry)return null;
 const [p,v]=entry;
 const b=await readFile(new URL((v.key?.startsWith('mcp-v1/')?'../mcp-release/objects/':'../styled/')+p,import.meta.url));
 return {body:new Blob([v.key?.startsWith('mcp-v1/')?b:await new Response(new Blob([b]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer()]).stream()};
}}};
function testLocal(url,options){
 return new Promise((resolve,reject)=>{
  const req=httpRequest(url,{method:options.method,headers:options.headers,timeout:15000},res=>{
   const parts=[];
   res.on('data',d=>parts.push(d));
   res.on('end',()=>resolve(new Response([202,204,304].includes(res.statusCode)?null:Buffer.concat(parts),{status:res.statusCode,headers:res.headers})));
   res.on('error',reject);
  });
  req.on('timeout',()=>req.destroy(Error('Local request timed out.')));
  req.on('error',reject);
  req.end(options.body);
 });
}
const f=(path,opt={})=>{
 const options={...opt,headers:{...(live?{}:{host:'atlas.blakeoxford.com'}),...opt.headers}};
 return live?fetch(base+path,{...options,signal:AbortSignal.timeout(35000)}):http?testLocal(base+path,options):worker.fetch(new Request(base+path,options),env);
};
let seq=0;
async function rpc(method, params={}, {modern=false, notification=false, ...extraHeaders}={}){
 const h={'content-type':'application/json',accept:'application/json, text/event-stream',...extraHeaders};
 if(modern){h['MCP-Protocol-Version']='2026-07-28';h['Mcp-Method']=method;if(method==='tools/call')h['Mcp-Name']=params.name;params={...params,_meta:{'io.modelcontextprotocol/protocolVersion':'2026-07-28','io.modelcontextprotocol/clientInfo':{name:'atlas-test',version:'1'},'io.modelcontextprotocol/clientCapabilities':{}}};}
 const r=await f('/mcp',{method:'POST',headers:h,body:JSON.stringify({jsonrpc:'2.0',...(!notification?{id:++seq}:{}),method,params})});
 if(r.status===202)return {status:202};
 if(r.headers.get('content-type')?.includes('text/event-stream')){
  const events=(await r.text()).split(/\r?\n/).filter(x=>x.startsWith('data:')).map(x=>JSON.parse(x.slice(5)));
  return events.find(x=>Object.hasOwn(x,'id'));
 }
 return r.json();
}
assert.equal((await f('/mcp')).status,405);
assert.equal((await f('/mcp',{method:'POST',headers:{origin:'https://example.org'}})).status,403);
assert.equal((await f('/mcp',{method:'POST',headers:{'content-type':'application/json'},body:'x'.repeat(33000)})).status,413);
assert.equal((await f('/mcp',{method:'POST',headers:{'content-type':'application/json'},body:'{'})).status,400);
for(const v of ['2025-03-26','2025-06-18','2025-11-25'])assert.equal((await rpc('initialize',{protocolVersion:v,clientInfo:{name:'fixture-test',version:'1.0.0'},capabilities:{}})).result.protocolVersion,v);
assert.equal((await rpc('notifications/initialized',{}, {notification:true})).status,202);
assert.equal((await rpc('server/discover',{},{modern:true})).result.supportedVersions[0],'2026-07-28');
assert.equal((await rpc('tools/list',{}, {modern:true})).result.resultType,'complete');
const tools=(await rpc('tools/list')).result.tools;assert.equal(tools.length,8);assert.ok(tools.every(x=>x.annotations.readOnlyHint));
const call=async (name,args={},modern=false)=>{const res=await rpc('tools/call',{name,arguments:args},{modern});assert.ok(res.result?.structuredContent,JSON.stringify(res));return res.result.structuredContent;};
assert.equal((await call('list_coverage')).countries.length,23);
assert.equal((await call('list_coverage',{region:'Central America'})).countries.length,7);
assert.equal((await call('list_coverage',{region:'Caribbean'})).countries.length,3);
assert.equal((await call('presidential_results',{country:'Mexico',year:2024})).firstRound.items[0].sharePct,61.185);
assert.equal((await call('presidential_results',{country:'Haiti',year:2016})).firstRound.total,28);
assert.match((await call('presidential_results',{country:'Cuba'})).coverageNote,/Assembly|Asamblea/i);
const arg=await call('presidential_results',{country:'argentina',year:2023},true);assert.equal(arg.runoff.items[0].sharePct,55.651);assert.equal(arg.firstRound.items[0].candidate,'Sergio Massa');assert.match(arg.sources[0].url,/electoral.gov.ar/);
assert.equal((await call('presidential_results',{country:'VEN',year:2024})).status,'not_in_atlas');
assert.ok((await call('voting_bloc_trend',{country:'Chile',start_year:1993,end_year:2018})).observations.length>4);
const elec=await call('legislative_constituencies',{country:'SLV',limit:1});assert.equal(elec.items.length,1);assert.equal(elec.nextOffset,1);
const area=await call('legislative_constituencies',{country:'SLV',election_id:elec.election.id,area_index:0,limit:1});assert.ok(area.result.parties.items[0].votes>0);
const top=await call('argentina_2023_local',{rank_candidate:'Milei',limit:3});assert.equal(top.total,24);assert.equal(top.items[0].name,'Córdoba');assert.ok(top.items[0].results.runoff.candidates[0].sharePct>74);
const prov=await call('argentina_2023_local',{province:'CABA',section_id:'13',limit:1});assert.ok(prov.items[0].results.runoff.reportedBallots>0);
const circuit=await call('argentina_2023_local',{province:'1',section_id:'13',circuit_id:prov.items[0].id});assert.equal(circuit.level,'circuit');
const context=await call('country_context',{countries:['Argentina','Brazil','Belize']});assert.equal(context.countries[0].indicators.find(x=>x.key==='NY.GDP.PCAP.CD').value.toFixed(2),'14261.85');assert.equal(context.countries[2].indicators.find(x=>x.key==='GC.XPN.TRFT.ZS').value,null);
assert.ok((await call('argentina_province_context',{province:'Cordoba'})).data.economy);
assert.ok((await call('atlas_methodology')).sources.length>4);
assert.ok((await rpc('tools/call',{name:'country_context',arguments:{countries:['ARG'],extra:'x'}})).result.isError);
assert.ok((await rpc('tools/call',{name:'argentina_2023_local',arguments:{province:'../../private'}})).result.isError);
for(const u of ['/','/regional','/argentina','/local','/context','/south-america','/connect','/elections','/countries','/countries/arg','/countries/cub']){
 const r=await f(u);assert.equal(r.status,200,u);const html=await r.text();assert.match(html,/href="\/connect"/);if(u==='/'){assert.match(html,/The political geography of Latin America/);assert.match(html,/href="\/regional"/);} if(u==='/countries'){assert.match(html,/href="\/countries\/arg"/);assert.match(html,/href="\/countries\/cub"/);} if(u==='/elections'){assert.match(html,/<h1>Recent elections<\/h1>/);} if(u==='/connect'){assert.match(html,/Streamable HTTP/);assert.match(html,/https:\/\/atlas\.blakeoxford\.com\/mcp/);}
}
console.log('MCP transport, all 8 tools, input safety, and 11 Atlas paths passed',live?'(live)':http?'(local Cloudflare runtime)':'(legacy R2 fixture)');
