import {createMcpHandler} from 'agents/mcp/server';
import {McpServer} from '@modelcontextprotocol/server';
import {z} from 'zod';
const ATLAS='https://atlas.blakeoxford.com';
const SERVER={name:'atlas.blakeoxford.com',title:'Blake Oxford Election Atlas',version:'1.1.0',websiteUrl:ATLAS};
const disclaimer='Historical snapshot, not live results. Use the cited sources and distinguish aggregate place-level patterns from individual voter behavior. Missing values are not zero.';
const SR={
  bloc:{name:'Baker & Greene ideology data',url:'https://www.andybaker.org/data/index.html'},
  pres:{name:'PPEG 2025v1',url:'https://doi.org/10.7910/DVN/5OAH7P'},
  official:{name:'Argentina CNE definitive 2023 results',url:'https://www.electoral.gov.ar/nuevo/paginas/btn/elecc2023.php'},
  argentina:{name:'Argentina DINE provisional 2023 election returns',url:'https://datos.mininterior.gob.ar/dataset/resultados-provisionales-elecciones-2023'},
  leg:{name:'CLEA Lower Chamber Release 18',url:'https://electiondataarchive.org/data-and-documentation/clea-lower-chamber-elections-archive/'},
  wdi:{name:'World Bank World Development Indicators, 2023',url:'https://databank.worldbank.org/source/world-development-indicators'},
  maps:{name:'Natural Earth reference boundaries',url:'https://www.naturalearthdata.com/'}
};
const csvCtx={
 'SP.POP.TOTL':['Resident population','people'],
 'SP.POP.TOTL.FE.ZS':['Female share of resident population','%'],
 'SP.POP.TOTL.MA.ZS':['Male share of resident population','%'],
 'SP.URB.TOTL.IN.ZS':['Urban population','% of population'],
 'NY.GDP.PCAP.CD':['GDP per capita','current USD per person'],
 'NV.AGR.TOTL.ZS':['Agriculture, forestry and fishing value added','% of GDP'],
 'NV.IND.TOTL.ZS':['Industry value added, including manufacturing','% of GDP'],
 'NV.SRV.TOTL.ZS':['Services value added','% of GDP'],
 'GC.XPN.TRFT.ZS':['Subsidies and other transfers','% of expense']
};
const prop=(description,extra={})=>({type:'string',description,minLength:1,maxLength:120,...extra});
const int=(description,minimum,maximum)=>({type:'integer',description,minimum,maximum});
const country=prop('ISO alpha-3 code or country name, e.g. ARG or Argentina');
const id=description=>prop(description,{pattern:'^[A-Za-z0-9-]{1,18}$'});
const listPaging={offset:int('Zero-based offset',0,10000),limit:int('Maximum records; defaults to 15',1,25)};
const def=(name,title,description,properties,required=[])=>({name,title,description,inputSchema:{type:'object',properties,required,additionalProperties:false},annotations:{readOnlyHint:true,destructiveHint:false,idempotentHint:true,openWorldHint:false}});
const DEFS=[
 def('list_coverage','List Atlas coverage','Find countries, available presidential or bloc years, and lower-house election IDs. Use to distinguish missing coverage from missing results.',{country,region:prop('Filter region',{enum:['South America','Central America','Mexico','Caribbean']})}),
 def('presidential_results','Presidential results','Retrieve one national presidential election, including separate first round and runoff where published. With no year, returns the latest election in this Atlas, not a live result.',{country,year:int('Election year',1900,2100),date:prop('Exact first-round date if year contains multiple events',{pattern:'^\\d{4}(?:-\\d{2}-\\d{2})?$'}),...listPaging},['country']),
 def('voting_bloc_trend','Historical voting blocs','Compare historical first-round vote shares in ideological blocs; bulk historical results are not modern party labels or individual voter ideology. Filter by years, optionally include candidates for a single election.',{country,start_year:int('Inclusive start year',1900,2100),end_year:int('Inclusive end year',1900,2100),include_candidates:{type:'boolean',description:'Include candidate rows if the selection contains exactly one election'}},['country']),
 def('legislative_constituencies','Legislative constituencies','Page lower-house constituency leads for a given CLEA election. Filter by constituency text; use area_index from results for detailed party tallies.',{country,election_id:int('CLEA election ID from list_coverage; default latest available',1,1000000),constituency:prop('Filter constituency name, case/accent insensitive'),area_index:int('Exact zero-based constituency index in the election',0,10000),...listPaging},['country']),
 def('argentina_2023_local','Argentina 2023 local returns','Retrieve province, electoral section or voting circuit presidential results. Without a province, lists jurisdictions or ranks them by selected candidate share. With a province, pages sections; with a section, pages circuits. Use the IDs from parent results.',{province:prop('Province name or jurisdiction ID; e.g. Córdoba, CABA or 1'),section_id:id('Electoral section identifier'),circuit_id:id('Circuit identifier; needs section_id'),name_query:prop('Filter child section/circuit name or locality'),round:prop('Round used for optional ranking',{enum:['first','runoff']}),rank_candidate:prop('Rank child locations by share for this candidate',{enum:['Milei','Massa','Bullrich','Schiaretti','Bregman']}),...listPaging}),
 def('country_context','Country economic and population context','Retrieve comparable 2023 World Bank indicators for up to eight countries. Includes population by recorded sex, urbanization, GDP per person, broader industry and government transfers where reported. Not demographic voting data.',{countries:{type:'array',minItems:1,maxItems:8,uniqueItems:true,items:country}},['countries']),
 def('argentina_province_context','Argentina province profile','Retrieve 2022 census, 2023 industry and fiscal metrics, geography, and published vote shares for one province or census context for a matched section. Does not infer how demographic groups voted.',{province:prop('Province name or jurisdiction ID'),section_id:id('Electoral section identifier; optional')},['province']),
 def('atlas_methodology','Sources and methodology','Explain data provenance, coverage limits, cutoffs, and safe interpretation before comparing election, economic, or demographic data.',{})
];
const normalize=s=>String(s).normalize('NFD').replace(/\p{Diacritic}/gu,'').trim().toLowerCase();
const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const round=n=>Number(n.toFixed(4));
const valid=(votes,total)=>total>0?round(100*votes/total):null;
const page=(rows,a)=>{const offset=a.offset??0,limit=a.limit??15;return {total:rows.length,offset,nextOffset:offset+limit<rows.length?offset+limit:null,items:rows.slice(offset,offset+limit)}};
function schema(s) {
 let out;
 if(s.type==='string'){
  out=s.enum?z.enum(s.enum):z.string().min(s.minLength).max(s.maxLength);
  if(s.pattern)out=out.regex(new RegExp(s.pattern));
  if(!s.enum)out=out.refine(v=>v.trim().length>=s.minLength,'Value cannot be blank');
 } else if(s.type==='integer')out=z.number().int().min(s.minimum).max(s.maximum);
 else if(s.type==='boolean')out=z.boolean();
 else if(s.type==='array'){
  out=z.array(schema(s.items)).min(s.minItems).max(s.maxItems);
  if(s.uniqueItems)out=out.refine(v=>new Set(v).size===v.length,'Values must be distinct');
 } else throw Error('Unsupported tool schema');
 return out.describe(s.description??'');
}
const tools=DEFS.map(({name,inputSchema,...definition})=>{
 const {properties,required}=inputSchema;
 return {name,definition:{...definition,inputSchema:z.strictObject(Object.fromEntries(Object.entries(properties).map(([key,value])=>[key,required.includes(key)?schema(value):schema(value).optional()])))}};
});
class Input extends Error {}
const problem=(msg)=>{throw new Input(msg)};
const cand=['Javier Milei','Sergio Massa','Patricia Bullrich','Juan Schiaretti','Myriam Bregman'];
const localRounds=(a,b)=>Object.fromEntries([['first',a],['runoff',b]].map(([k,row])=>{
 if(!row)return [k,null];
 const n=row.slice(0,-2).reduce((x,y)=>x+y,0);
 return [k,{candidateVotes:n,nonCandidateBallots:row.at(-2),reportedBallots:row.at(-1),candidates:row.slice(0,-2).map((votes,i)=>({candidate:cand[i],votes,sharePct:valid(votes,n)})).sort((x,y)=>y.votes-x.votes)}];
}));
const mapUrl=(country,view,extra={})=>ATLAS+'/?'+new URLSearchParams({country,view,...extra});
const localUrl=(p,s,c)=>ATLAS+'/local?'+new URLSearchParams({d:p,...(s?{s}:{}),...(c?{c}:{}),m:'b'});
const parties=(row)=>({candidate:row[0],party:row[1],sharePct:row[2],votes:Number.isFinite(row[3])?row[3]:null});
const arrRank=(rows,a)=>{
 if(!a.rank_candidate)return rows;
 const who=cand.find(c=>c.endsWith(a.rank_candidate)), phase=a.round??'runoff';
 if(phase==='runoff'&&!cand.slice(0,2).includes(who)) return problem('Only Milei and Massa contested the runoff; choose round first.');
 const share=(r)=>r.results?.[phase]?.candidates.find(c=>c.candidate===who)?.sharePct??-1;
 return [...rows].filter(r=>share(r)>=0).sort((x,y)=>share(y)-share(x));
};
async function runTool(name,a,load){
 const countryMatch=(db,input)=>{const match=Object.entries(db).find(([k,v])=>normalize(k)===normalize(input)||normalize(v.name)===normalize(input));return match??problem('Country not covered. Use list_coverage for available countries.');};
 const provinceMatch=(idx,input)=>{
  const aliases={'caba':'1','buenos aires city':'1','ciudad autonoma de buenos aires':'1','buenos aires province':'2'};
  const p=idx.find(x=>x.id===(aliases[normalize(input)]??input)||normalize(x.n)===normalize(input));
  return p??problem('Province not found. Call argentina_2023_local without province to list jurisdictions.');
 };
 if(name==='atlas_methodology')return {scope:'Sovereign countries in South and Central America, Mexico, and the Latin Caribbean (Cuba, the Dominican Republic, and Haiti). Territories and the rest of the Caribbean are not covered.',atlas:ATLAS,sources:Object.values(SR),caveats:[disclaimer,'Historical ideology uses published scores on a 1–20 scale: below 9 left, 9–13 center, above 13 right. Uncoded votes remain uncoded; covered elections end by 2018.','Presidential rounds are separate. Venezuela 2024 is omitted; not every latest national election is included.','Legislative shares use available positive party/list tallies, not necessarily all valid ballots, seats or a national vote. Historical electoral constituencies may not correspond to current provinces or cities.','Argentina province totals below national level are the Atlas’s provisional DINE tabulation; the national 2023 result is sourced separately from definitive CNE results.','Census population, demographic shares, industry and fiscal context do not establish how anyone voted. Fiscal measures differ between layers.']};
 if(name==='argentina_2023_local'||name==='argentina_province_context'){
  const idx=await load('local/index.json');
  const p=a.province?provinceMatch(idx,a.province):null;
  if(name==='argentina_province_context'){
   const d=await load('context-data.json'), x=d.provinces[p.id];
   if(!x)return problem('No context for that jurisdiction.');
   if(a.section_id&&!Object.hasOwn(x.sections,a.section_id))return problem('No matched census section for that ID. Use argentina_2023_local to find electoral sections.');
   const {sections,...profile}=x;
   return {province:{id:p.id,name:p.n},year:{census:2022,economy:d.economyYear,fiscal:2023},data:a.section_id?sections[a.section_id]:profile,sourceLinks:d.sources,notes:a.section_id?[d.censusNote]:d.notes,atlas:ATLAS+'/context?'+new URLSearchParams({d:p.id,...(a.section_id?{s:a.section_id}:{})}),caveat:disclaimer};
  }
  if((!p&&a.section_id)||(a.circuit_id&&!a.section_id))return problem('Specify province with section_id, and section_id with circuit_id.');
  const base={year:2023,sources:[SR.argentina],caveats:['Candidate share uses reported candidate votes, excluding blank/invalid and other non-candidate ballots. Provisional subnational totals can differ from certified national figures.','Circuits are electoral geographies, not street blocks. Missing mapped boundaries do not imply missing votes.',disclaimer]};
  if(!p){
   const csv=await load('results.csv',true);
   const byName=new Map(csv.trim().split(/\r?\n/).slice(1).map(l=>{const [n,...v]=l.split(',');return [n,v.map(Number)]}));
   const rows=idx.map(z=>{const v=byName.get(z.n);return {id:z.id,name:z.n,sectionCount:z.s,circuitCount:z.c,results:v?localRounds(v.slice(0,7),v.slice(7)):null,atlas:localUrl(z.id)}});
   return {...base,level:'province',...page(arrRank(rows,a),a)};
  }
  const d=await load('local/'+p.id+'.json'), s=a.section_id?d.s.find(x=>x.id===a.section_id):null;
  if(a.section_id&&!s)return problem('Section ID not in this province. Omit section_id to list sections.');
  const circuits=s?(d.c[s.id]??[]):[];
  const row=(x,isCircuit)=>({id:x.id,name:x.n,locality:x.z||null,mapped:!!x.p,results:localRounds(x.a,x.b),atlas:localUrl(p.id,isCircuit?s.id:x.id,isCircuit?x.id:null)});
  const place={id:p.id,name:p.n};
  if(a.circuit_id){const c=circuits.find(x=>x.id===a.circuit_id);if(!c)return problem('Circuit ID not in this section. Omit circuit_id to list circuits.');return {...base,level:'circuit',province:place,section:{id:s.id,name:s.n},circuit:row(c,true)};}
  const rows=(s?circuits:d.s).filter(x=>!a.name_query||normalize(x.n+' '+(x.z||'')).includes(normalize(a.name_query))).map(x=>row(x,!!s));
  return {...base,level:s?'circuit':'section',province:place,...(s?{section:row(s,false)}:{}),...page(arrRank(rows,a),a)};
 }
 const db=await load('regional-votes.json');
 if(name==='list_coverage'){
  const entries=a.country?[countryMatch(db,a.country)]:Object.entries(db);
  return {countries:entries.filter(([,d])=>!a.region||d.region===a.region).map(([code,d])=>({code,name:d.name,region:d.region,presidential:d.pres.map(e=>({year:e.year,date:e.date})),ideologyYears:d.blocs.map(e=>e.year),legislative:d.leg.map(e=>({id:e.id,year:e.year,month:e.month,constituencies:e.areas.length})),argentinaCircuitDetail:code==='ARG',...(d.note?{coverageNote:d.note}:{}),...(d.url?{coverageSource:d.url}:{}),atlas:mapUrl(code,'blocs')})),atlas:ATLAS,caveat:disclaimer};
 }
 if(name==='country_context'){
  const [simple,south]=await Promise.all([load('regional-context.json'),load('south-data.json')]);
  return {year:2023,countries:a.countries.map(k=>{const [code,d]=countryMatch(db,k);const extra=south.countries[code];return {code,name:d.name,indicators:Object.entries(csvCtx).map(([key,[label,unit]])=>({key,label,unit,value:simple[code]?.[key]??null,source:'https://data.worldbank.org/indicator/'+key})),additionalIndicators:extra?Object.entries(south.indicators).filter(([,o])=>!Object.hasOwn(csvCtx,o.id)).map(([key,o])=>({key:o.id,label:o.label,unit:o.unit,value:extra[key]??null,source:o.url})):[],atlas:mapUrl(code,'blocs')};}),sources:[SR.wdi],caveats:south.notes.filter((_,i)=>i>0).concat(disclaimer)};
 }
 const [code,d]=countryMatch(db,a.country), place={code,name:d.name};
 if(name==='presidential_results'){
  const matches=d.pres.filter(e=>(!a.year||e.year===a.year)&&(!a.date||e.date===a.date));
  if((a.year||a.date)&&matches.length>1)return problem('Several records match; use the exact date from list_coverage.');
  const e=matches.at(-1);
  if(!e)return {country:place,status:'not_in_atlas',availableYears:[...new Set(d.pres.map(x=>x.year))],...(d.note?{coverageNote:d.note}:{}),...(d.url?{sources:[{name:'Country coverage source',url:d.url}]}:{}),atlas:mapUrl(code,'pres'),caveat:disclaimer};
  const src=e.url?{name:e.src,url:e.url}:e.src==='Argentina CNE'?SR.official:/baker|greene/i.test(e.src)?SR.bloc:SR.pres;
  return {country:place,year:e.year,firstRound:{date:e.date,...page(e.first.map(parties),a)},runoff:e.run.length?{date:e.runDate==='nan'?null:e.runDate,...page(e.run.map(parties),a)}:null,sources:[src],dataset:e.src,atlas:mapUrl(code,'pres',{election:e.date}),caveats:[disclaimer,'First-round leader is not necessarily final winner.',...(e.note?[e.note]:[]),...(code==='VEN'?['Venezuela 2024 disputed result omitted.']:[])]};
 }
 if(name==='voting_bloc_trend'){
  const start=a.start_year??1900,end=a.end_year??2100;
  if(start>end)return problem('start_year must not exceed end_year.');
  const groups=['left','center','right','uncoded'];
  const shares=x=>Object.fromEntries(groups.map((b,i)=>[b,x.shares[i]]));
  const records=d.blocs.filter(e=>e.year>=start&&e.year<=end);
  const compare=(x,y)=>Object.fromEntries(groups.map((b,i)=>[b,round(y.shares[i]-x.shares[i])]));
  return {country:place,observations:records.map((e,i)=>({year:e.year,sharesPct:shares(e),changeFromPreviousSelectedElectionPp:i?compare(records[i-1],e):null,...(a.include_candidates&&records.length===1?{candidates:e.rows.map(([candidate,party,sharePct,ideology,bloc])=>({candidate,party,sharePct,ideology,bloc:groups[bloc]}))}:{})})),firstToLastChangePp:records.length>1?compare(records[0],records.at(-1)):null,atlas:mapUrl(code,'blocs',records.length?{election:String(records.at(-1).year)}:{}),sources:[SR.bloc],caveats:[disclaimer,'First-round shares only. Published ideology scores below 9 are left; 9–13 center; above 13 right; missing scores remain uncoded. Coverage ends no later than 2018.']};
 }
 if(name==='legislative_constituencies'){
  const e=a.election_id?d.leg.find(x=>x.id===a.election_id):d.leg.at(-1);
  if(!e)return {country:place,status:'not_in_atlas',atlas:mapUrl(code,'leg'),caveat:disclaimer};
  const row=(x,i,detail)=>{
   const total=x[2].reduce((n,r)=>n+r[1],0);
   const top=x[2][0], tied=!!top&&top[1]===x[2][1]?.[1];
   return {areaIndex:i,constituency:x[0],qualifier:x[1]||null,reportedPartyTallies:total,leadingParty:!top||tied?null:e.parties[top[0]]??top[0],tie:tied,topTwoMarginPp:x[2].length>=2?valid(top[1]-x[2][1][1],total):null,coverageNote:x[3]||null,...(detail?{parties:page(x[2].map(([k,votes])=>({party:e.parties[k]??k,votes,sharePct:valid(votes,total)})),a)}:{}),atlas:mapUrl(code,'leg',{election:String(e.id),district:String(i)})};
  };
  if(a.area_index!==undefined&&!e.areas[a.area_index]) return problem('area_index not in this election.');
  return {country:place,election:{id:e.id,year:e.year,month:e.month,coveredAreas:e.areas.length,omittedAreas:e.omitted},...(a.area_index!==undefined?{result:row(e.areas[a.area_index],a.area_index,true)}:page(e.areas.map((x,i)=>row(x,i,false)).filter(x=>!a.constituency||normalize(x.constituency).includes(normalize(a.constituency))),a)),sources:[SR.leg],caveats:[disclaimer,'Constituencies may not be city boundaries. Local shares use covered positive party/list tallies, not necessarily ballots or seat winners. Do not sum to a national total.']};
 }
 return problem('Tool not available.');
}
const MAX=32768;
async function input(req){
 if(Number(req.headers.get('content-length'))>MAX)throw new RangeError();
 if(!req.body)throw new SyntaxError();
 const rd=req.body.getReader();let bytes=0, str='';const dec=new TextDecoder('utf-8',{fatal:true});
 try{for(;;){const {value,done}=await rd.read();if(done)break;bytes+=value.byteLength;if(bytes>MAX)throw new RangeError();str+=dec.decode(value,{stream:true});}return JSON.parse(str+dec.decode());}
 catch(e){void rd.cancel().catch(()=>{});throw e;}
}
export async function atlasMcp(req,load){
 const origin=req.headers.get('Origin');
 const method=req.method;
 const headers=new Headers({'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Vary':'Origin'});
 const failure=(status,code,message)=>Response.json({jsonrpc:'2.0',id:null,error:{code,message}},{status,headers});
 if(origin!==null&&origin!==ATLAS)return failure(403,-32600,'Origin is not allowed.');
 if(origin){headers.set('Access-Control-Allow-Origin',ATLAS);headers.set('Access-Control-Allow-Methods','POST, OPTIONS');headers.set('Access-Control-Allow-Headers','Content-Type, MCP-Protocol-Version, Mcp-Method, Mcp-Name');}
 if(method==='OPTIONS')return new Response(null,{status:204,headers});
 if(method!=='POST'){headers.set('Allow','POST, OPTIONS');return failure(405,-32600,'Use POST for MCP; see /connect for setup.');}
 if(!/^application\/json(?:\s*;|$)/i.test(req.headers.get('content-type')??''))return failure(415,-32600,'Content-Type must be application/json.');
 let parsedBody;
 try{parsedBody=await input(req);}
 catch(e){return failure(e instanceof RangeError?413:400,-32700,e instanceof RangeError?'Request exceeds 32 KiB.':'Malformed JSON.');}
 const route=new URL(req.url).pathname;
 const handler=createMcpHandler(()=>{
  const server=new McpServer(SERVER,{instructions:disclaimer});
  for(const {name,definition} of tools)server.registerTool(name,definition,async args=>{
   try{
    const result=await runTool(name,args,load);
    return {structuredContent:result,content:[{type:'text',text:JSON.stringify(result)}]};
   }catch(e){
    return {isError:true,content:[{type:'text',text:e instanceof Input?e.message:'Atlas data was temporarily unavailable. Try again.'}]};
   }
  });
  return server;
 },{route,legacy:'stateless',corsOptions:false,allowedHostnames:['atlas.blakeoxford.com'],allowedOriginHostnames:['atlas.blakeoxford.com']});
 const res=await handler.fetch(req,{parsedBody});
 const out=new Headers(res.headers);
 for(const [k,v] of headers)out.set(k,v);
 return new Response(res.body,{status:res.status,statusText:res.statusText,headers:out});
}
