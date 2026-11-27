/** Smoke test of the staged or published website. Defaults to the local complete preview. */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const url = process.argv[2] || 'http://127.0.0.1:8262';
(async () => {
 const browser = await chromium.launch({executablePath: process.env.CHROMIUM_BIN || undefined, headless: true, args:['--no-sandbox']});
 try {
  for (const viewport of [{width:1280,height:900},{width:390,height:844}]) {
   const p = await browser.newPage({viewport});
   const errors=[]; p.on('pageerror', e=>errors.push(e.message));
   const ready=async path=>{
    await p.goto(url+path);
    await p.waitForFunction(()=>/\bof \d+ countries/.test(document.querySelector('#summary')?.textContent || ''));
   };
   const first = await p.goto(url+'/');
   assert.equal(first.status(),200);
   await p.waitForFunction(()=>/\bof 23 countries/.test(document.querySelector('#summary')?.textContent || ''));
   assert.equal(await p.locator('h1').textContent(),'Latin America Election Atlas');
   assert.equal(await p.locator('#country option').count(),24);
   assert.equal(await p.locator('#map [data-country]').count(),23);
   assert.equal(await p.getByRole('button',{name:'Central America · 7 countries',exact:true}).count(),1);
   await p.getByRole('button',{name:'Selected Caribbean · 3 countries',exact:true}).click();
   assert.match(p.url(), /region=caribbean/);
   assert.deepEqual(await p.locator('#country option').evaluateAll(x=>x.map(i=>i.value)),['','CUB','DOM','HTI']);
   await p.selectOption('#country','CUB');
   assert.match(await p.locator('#details').textContent(),/does not directly elect its president/);
   assert.equal(await p.locator('#details a[href*="data.ipu.org"]').count(),1);
   await p.selectOption('#country','HTI');
   await p.getByRole('button',{name:'National election results'}).click();
   assert.match(await p.locator('#details').textContent(),/1,062,839 valid votes/);
   assert.equal(await p.locator('#details summary').filter({hasText:'Show all 28 first-round entries'}).count(),1);
   await ready('/?country=MEX&view=pres');
   assert.equal(await p.locator('#region').inputValue(),'Mexico');
   assert.match(await p.locator('#details').textContent(),/Claudia Sheinbaum/);
   assert.match(await p.locator('#details a[href*="ine.mx"]').count().then(String),/1/);
   await p.getByRole('button',{name:'Explore constituencies'}).click();
   assert.match(await p.locator('#districts h2').textContent(),/Constituency strongholds/);
   assert.equal(await p.locator('#district-picker option').count(),302);
   assert.match(await p.locator('#districts').textContent(),/Boundaries are not matched/);
   await ready('/?country=DOM&view=pres');
   assert.match(await p.locator('#details').textContent(),/Luis Abinader/);
   await ready('/?region=central');
   assert.match(await p.locator('#country').textContent(),/Belize/);
   assert.equal(await p.locator('#country option').count(),8);
   await ready('/?region=south');
   assert.equal(await p.locator('#country option').count(),13);
   assert.equal(await p.locator('#map [data-country="ARG"]').count(),1);
   const w = await p.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
   assert(w[0]<=w[1]+1, 'Horizontal overflow: ' + w.join('/'));
   assert.deepEqual(errors, []);
   console.log(viewport.width+'px: homepage scope, zooms, latest returns, caveats, links, Mexico districts, Central/South legacy URLs pass.');
   await p.close();
  }
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
