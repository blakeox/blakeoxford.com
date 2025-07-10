import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  const pages = ['/', '/about', '/projects', '/contact'];
  
  for (const pagePath of pages) {
    console.log(`\n=== Checking page: ${pagePath} ===`);
    await page.goto(`http://localhost:4321${pagePath}`);
    
    // Get all headings
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    const headingData = await Promise.all(
      headings.map(async h => ({
        level: parseInt((await h.evaluate(el => el.tagName)).slice(1)),
        text: (await h.textContent()).trim(),
        visible: await h.isVisible()
      }))
    );

    const visibleHeadings = headingData.filter(h => h.visible);
    
    console.log('Visible headings:');
    visibleHeadings.forEach((h, i) => {
      console.log(`  ${i + 1}. h${h.level}: "${h.text}"`);
    });
    
    // Check for problematic jumps
    for (let i = 1; i < visibleHeadings.length; i++) {
      const current = visibleHeadings[i];
      const previous = visibleHeadings[i - 1];
      
      if (current.level > previous.level) {
        const jump = current.level - previous.level;
        if (jump > 1) {
          console.log(`❌ PROBLEM: Jump from h${previous.level} to h${current.level} (jump: ${jump})`);
          console.log(`   Previous: "${previous.text}"`);
          console.log(`   Current: "${current.text}"`);
        }
      }
    }
  }
  
  await browser.close();
})();
