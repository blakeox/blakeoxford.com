"""Build supplemental Latin America data in staging only."""
import json,re,unicodedata
from collections import defaultdict
from pathlib import Path
from zipfile import ZipFile
from io import BytesIO
import pandas as pd
from openpyxl import load_workbook
here=Path(__file__).resolve().parent
raw=here.parent.parent/'argentina-election'/'raw'
country={'MEX':'Mexico','CUB':'Cuba','DOM':'Dominican Republic','HTI':'Haiti'}
def norm(s):return re.sub('[^a-z0-9]','',unicodedata.normalize('NFKD',str(s)).encode('ascii','ignore').decode().lower())
ids={norm(v):k for k,v in country.items()}
base={c:dict(name=n,region='Mexico' if c=='MEX' else 'Caribbean',blocs=[],leg=[],pres=[]) for c,n in country.items()}
def dump(name,d): (here/(name+'.json')).write_text(json.dumps(d,ensure_ascii=False,separators=(',',':'),allow_nan=False)+'\n')
w=load_workbook(BytesIO(ZipFile(raw/'baker.zip').read('Website Data 2.0.xlsx')),read_only=True,data_only=True)
ide=defaultdict(list)
for c,y,a,p,n,v,s,i,j,_,_ in w.active.iter_rows(min_row=2,max_col=11,values_only=True):
 if norm(c) in ids and isinstance(y,int) and y>=1990 and isinstance(s,(float,int)) and 0<s<=1:
  b=3 if not isinstance(i,(int,float)) or not 1<=i<=20 else (0 if i<9 else 1 if i<=13 else 2)
  ide[ids[norm(c)],y].append([str(n or p or a or 'Other'),str(p or a or ''),round(s*100,3),i if b!=3 else None,b])
for (c,y),rr in sorted(ide.items()):
 total=sum(x[2] for x in rr)
 if not 98.5<=total<=101.5: raise ValueError((c,y,total))
 base[c]['blocs'].append(dict(year=y, shares=[round(sum(x[2] for x in rr if x[4]==i)*100/total,2) for i in range(4)],rows=sorted(rr,key=lambda x:-x[2])))
cols='id ctr_n yr mn sub cst_n cst pty_n pty pv1 cv1 vv1'.split()
cache=here/'clea-extra.pkl'
if cache.exists():
 d=pd.read_pickle(cache)
else:
 d=pd.concat([t[t.yr.ge(1990)&t.ctr_n.isin(country.values())] for t in pd.read_stata(raw/'clea_lc_20251015.dta',columns=cols,chunksize=100000,convert_categoricals=False)])
 if not cache.exists(): d.to_pickle(cache)
for x in ['pv1','cv1','vv1']:d[x]=pd.to_numeric(d[x],errors='coerce')
def electoral(n):
 n=norm(n)
 return n and not n.isnumeric() and n not in {'blank','blankvote','blankvotes','votosblancos','votosenblanco','votosnulos','votosinvalidos','votoblanconulo','votosvalidos','nullvotes','invalidvotes','validvotes','nullblankvotes','votonulo','votoenblanco','votobranco','votosbrancos','votonuloebranco','noneoftheabove','notapplicable','notavailable','votosbrancosnulos'} and not n.startswith(('votosnulos','votosenblanco','invalidballot','blankballot','votoblanconulo'))
d['p_label']=d.pty_n.map(norm)
for (name,e),t in d.groupby(['ctr_n','id']):
 k=ids[norm(name)]; y=int(t.yr.iloc[0]); m=int(t.mn.iloc[0]); areas=[]; names={}; skip=0
 for (cst,area,sub),u in t.groupby(['cst','cst_n','sub'],dropna=False):
  p=[]
  for key,q in u.groupby('p_label',dropna=False):
   party=q.pty_n.iloc[0]
   if not electoral(party): continue
   pp=q.loc[q.pv1>0,'pv1'].unique()
   if len(pp)>1: continue # ambiguous competing values in nominally same party/area
   if len(pp)==1: v=round(pp[0])
   else: continue
   pc=key
   names[pc]=party
   p.append([pc,v])
  p=sorted(p,key=lambda a:-a[1]); tot=sum(x[1] for x in p)
  if not tot:skip+=1;continue
  valid=u.loc[u.vv1>0,'vv1'].unique()
  if len(valid)==1 and 0<tot<valid[0]*.97: flag='Partial party tallies relative to reported valid votes.'
  elif len(valid)==1 and tot>valid[0]*1.03: flag='Party tallies exceed reported valid ballots; may count list or preference votes.'
  else: flag=''
  area=str(area); sub=str(sub)
  areas.append([area,sub if not sub.startswith('-99') and norm(area)!=norm(sub) else '',p,flag,None])
 if areas:
  base[k]['leg'].append(dict(id=int(e),year=y,month=m,areas=sorted(areas,key=lambda a: norm(a[0])),parties=names,omitted=skip))
for v in base.values():v['leg'].sort(key=lambda e:(e['year'],e['month'],e['id']))
# Additional national election history is kept separate from the historical ideology scores.
ppeg=raw/'ppeg.zip'
if ppeg.exists():
 z=ZipFile(ppeg); src=[n for n in z.namelist() if n.lower().endswith('.csv') and not n.startswith('__')][0]
 t=pd.read_csv(BytesIO(z.read(src)))
 for (c,date),u in t[t.iso3c.isin(base)&t.edate.ge('1990')].groupby(['iso3c','edate']):
  if c=='VEN' and date[:4]=='2024':continue # Not used as a comparable tally.
  u=u.drop_duplicates(['candidate'])
  def readrows(col,votes):
   out=[]
   for a in u.itertuples():
    val=getattr(a,col);v=getattr(a,votes)
    if pd.isna(val) or not 0<val<=1 or pd.isna(a.candidate):continue
    n=next((str(n) for n in (a.pname_or,a.pname_en,a.pinitials) if pd.notna(n)),'')
    out.append([a.candidate,n,round(val*100,3),int(v) if pd.notna(v) and v>=0 else None])
   return sorted(out,key=lambda x:-x[2])
  a,b=readrows('v_share','votes'),readrows('v_share_lastround','votes_lastround')
  if a:base[c]['pres'].append(dict(year=int(date[:4]),date=date,runDate=str(u.edate_lastround.iloc[0]) if b else '',first=a,run=b,src='PPEG'))
def add_pres(code,date,rows,denominator,src,url,note):
 assert sum(x[2] for x in rows)<=denominator
 b=base[code]
 b['pres']=[e for e in b['pres'] if e['date']!=date]
 b['pres'].append(dict(year=int(date[:4]),date=date,runDate='', first=[[n,p,round(v/denominator*100,3),v] for n,p,v in rows],run=[],src=src,url=url,note=note))
add_pres('MEX','2024-06-02',[
 ('Claudia Sheinbaum Pardo','Sigamos Haciendo Historia',35924519),
 ('Xóchitl Gálvez Ruiz','Fuerza y Corazón por México',16502697),
 ('Jorge Álvarez Máynez','Movimiento Ciudadano',6204710),
 ('Unregistered candidates','',83114),
], 58715040, 'Mexico INE','https://igualdad.ine.mx/wp-content/uploads/2025/01/INFOGRAFIA_Resultados_Computos_2024.pdf',
 "Shares use votes excluding null ballots (58,715,040); on INE’s all-ballot basis, Sheinbaum received 59.7594%. National totals include votes cast abroad.")
add_pres('DOM','2024-05-19',[
 ('Luis Abinader','Partido Revolucionario Moderno and allies',2507297),
 ('Leonel Fernández','Fuerza del Pueblo and allies',1259427),
 ('Abel Martínez','Partido de la Liberación Dominicana',453468),
 ('Roque Espaillat','Partido Esperanza Democrática',59396),
 ('Carlos Peña','Partido Generación de Servidores',31566),
 ('Virginia Antares Rodríguez','Opción Democrática',25204),
 ('Miguel Vargas','Partido Revolucionario Dominicano',19790),
 ('María Teresa Cabrera','Frente Amplio',6255),
 ('Fulgencio Severino','Partido Patria Para Todos y Todas',2744),
],4365147,'Dominican Republic JCE','https://elecciones2024.jce.gob.do/documentos?Command=Core_Download&EntryId=52047&Method=attachment',
 "Shares use valid votes. Coalition totals aggregate votes cast for allied parties behind the same candidate.")
haiti=[
 ('Jovenel Moïse','PHTK',590927),('Jude Célestin','LAPEH',207988),('Jean-Charles Moïse','Pitit Dessalines',117349),
 ('Maryse Narcisse','Fanmi Lavalas',95765),('Jean Henry Céant','Renmen Ayiti',8014),
 ('Edmonde Supplice Beauzile','Fusion',6770),('Maxo Joseph','Randevous',5336),('Amos André','FURH',2270),
 ('Jean Hervé Charles','PENH',1974),('Joseph Harry Brétous','KOPA',1803),('Marie Antoinette Gautier','PAC',1791),
 ('Jean Clarens Renois','UNIR-Ayiti INI',1681),('Daniel Dupiton','CONAPPH',1305),('Dalvius Gérard','PADH',1208),
 ('Kesler Dalmacy','MOPANOU',999),('Jean Bertin','MUR',984),('Jean Ronald Cornely','RPH',980),
 ('Marc-Arthur Drouillard','PUN',970),('Jean Poincy','Résultat',963),('Jacques Sampeur','KLE',953),
 ('Jean-Chavannes Jeune','Canaan',936),('Joseph G. Varnel Durandisse','PPRA',881),('Roland Magloire','PDI',817),
 ('Vilaire Cluny Duroseau','MEKSEPA',796),('Diony Monestime','Independent',751),('Luckner Désir','MPH',739),
 ('Nelson Flecourt','OLAHH Baton Jenes La',686),('No candidate','',7203),
]
assert sum(x[2] for x in haiti)==1062839
add_pres('HTI','2016-11-20',haiti,1062839,'Haiti CEP, final tally','https://www.haitinewstoday.com/wp-content/uploads/2017/02/official-results-2016.pdf',
 "The final CEP tally was issued January 3, 2017. Its 1,062,839 valid votes include 7,203 ‘no candidate’ choices.")
base['CUB']['note']="Cuba does not directly elect its president. In March 2023 all 470 candidates were elected to the 470-seat National Assembly (75.9% turnout); in April the Assembly re-elected Miguel Díaz-Canel. The parliamentary figures are not multiparty vote shares."
base['CUB']['url']='https://data.ipu.org/parliament/CU/CU-LC01/election/CU-LC01-E20230326/'
base['HTI']['note']="The 2016 presidential vote is historical, not a current mandate. Haiti’s electoral council published a revised 2026–27 calendar; planned contests are not results."
base['HTI']['url']='https://cephaiti.ht/publication-du-calendrier-electoral-actualise'
for b in base.values():
 covered={x['year'] for x in b['pres']}
 for e in b['blocs']:
  if e['year'] not in covered:b['pres'].append(dict(year=e['year'],date=str(e['year']),runDate='',first=[[r[0],r[1],r[2],None] for r in e['rows']],run=[],src='Baker & Greene'))
 b['pres'].sort(key=lambda a:a['date'])
ctx={c:{} for c in base}
for p in sorted((here/'inputs').glob('*.json')):
 rawvals=json.loads(p.read_text())
 assert len(rawvals)==2 and isinstance(rawvals[1],list) and len(rawvals[1])==4,p
 for a in rawvals[1]:
  assert a['date']=='2023' and a['countryiso3code'] in base
  if a['value'] is not None: ctx[a['countryiso3code']][p.stem]=a['value']
for c in ctx:
 assert ctx[c]['SP.POP.TOTL']>0 and abs(ctx[c]['SP.POP.TOTL.FE.ZS']+ctx[c]['SP.POP.TOTL.MA.ZS']-100)<0.005
dump('votes-extra',base)
dump('context-extra',ctx)
for c,b in base.items():
 print(c, list(ctx[c]),"pres",[v['date'] for v in b['pres']],"blocs",[v['year'] for v in b['blocs']],"leg",[(e['year'],len(e['areas'])) for e in b['leg']])
