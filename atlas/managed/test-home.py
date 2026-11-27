"""Browser checks for the Atlas entry journey and old shared map links."""
import os
import sys
from playwright.sync_api import sync_playwright, expect

base=sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:8285'
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_BIN'),args=['--no-sandbox'])
    for w,h in [(320,844),(390,844),(820,1000),(1024,950),(1440,1050)]:
        page=browser.new_page(viewport={'width':w,'height':h})
        errors=[]
        page.on('pageerror',lambda e:errors.append(str(e)))
        page.goto(base+'/')
        expect(page.locator('h1')).to_have_text('The political geography of Latin America')
        expect(page.locator('#atlas-menu a[aria-current=page]')).to_have_text('Home')
        expect(page.get_by_role('img',name='Atlas geographic coverage')).to_be_visible()
        expect(page.locator('.home-regions li')).to_have_count(4)
        expect(page.locator('.home-election-list li')).to_have_count(3)
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth + 1')
        if w in (390,1440):
            page.screenshot(path=f'/tmp/atlas-home-after-{w}.png',full_page=True)
        page.keyboard.press('Tab')
        expect(page.locator('.bo-skip')).to_be_focused()
        page.keyboard.press('Enter')
        expect(page.locator('#main-content')).to_be_focused()
        page.get_by_role('link',name='Explore the map',exact=True).click()
        expect(page.locator('#map [data-country]')).to_have_count(23)
        page.go_back()
        page.locator('.home-regions').get_by_role('link',name='Central America 7 countries').click()
        expect(page.locator('#map [data-country]')).to_have_count(7)
        page.go_back()
        page.locator('.home-election-list li').first.get_by_role('link').click()
        expect(page.locator('#details h2')).not_to_have_text('Explore the region')
        assert '/regional?' in page.url and 'election=' in page.url
        page.goto(base+'/?country=MEX&view=pres#details')
        expect(page.locator('#details')).to_contain_text('Claudia Sheinbaum')
        assert '/regional?' in page.url and page.url.endswith('#details')
        page.goto(base+'/#atlas-methodology')
        expect(page.locator('#atlas-methodology details')).to_have_attribute('open','')
        page.goto(base+'/?utm_source=test')
        expect(page.locator('.home-intro')).to_be_visible()
        assert not errors, errors
        page.close()
    page=browser.new_page(java_script_enabled=False)
    page.goto(base+'/')
    expect(page.locator('.home-intro')).to_be_visible()
    expect(page.get_by_role('link',name='Explore the map',exact=True)).to_have_attribute('href','/regional')
    expect(page.locator('.home-election-list li')).to_have_count(3)
    browser.close()
print('Homepage verified at five widths: keyboard, map, region, election, legacy bookmarks, no-JS and no overflow.')
