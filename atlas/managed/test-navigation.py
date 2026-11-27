"""Browser smoke tests for global navigation and its phone layout."""
import argparse
import os
from playwright.sync_api import sync_playwright, expect
parser=argparse.ArgumentParser()
parser.add_argument('base',nargs='?',default='http://127.0.0.1:8278')
parser.add_argument('--screenshots')
args=parser.parse_args()
paths={'/':'Home','/regional':'Map','/countries':'Countries','/elections':'Recent elections',
       '/argentina':'2023 election results','/local':'Voting circuits','/context':'Data overlays','/connect':'Connect AI'}
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_BIN'),args=['--no-sandbox'])
    for width in (320,390,1050,1051,1280):
        page=browser.new_page(viewport={'width':width,'height':844},reduced_motion='reduce')
        errors=[]
        page.on('pageerror',lambda e:errors.append(str(e)))
        page.goto(args.base+'/')
        nav=page.locator('#atlas-menu')
        quick=page.locator('.atlas-quicknav')
        menu=page.locator('#atlas-menu-toggle')
        argentina=nav.locator('summary',has_text='Argentina 2023')
        if width<=1050:
            assert menu.is_visible() and not nav.is_visible() and quick.is_visible()
            assert quick.get_by_role('link').all_text_contents()==['Map','Countries','Recent elections']
            quick.get_by_role('link',name='Countries',exact=True).click()
            expect(page.locator('h1')).to_have_text('Country profiles')
            menu.click()
            assert menu.get_attribute('aria-expanded')=='true'
        else:
            assert nav.is_visible() and not menu.is_visible() and not quick.is_visible()
            nav.get_by_role('link',name='Countries',exact=True).click()
            expect(page.locator('h1')).to_have_text('Country profiles')
        argentina.click()
        local=nav.get_by_role('link',name='Voting circuits')
        expect(local).to_be_visible()
        if args.screenshots and width in (390,1280):
            page.screenshot(path=f'{args.screenshots}-{width}.png')
        local.focus()
        page.keyboard.press('Escape')
        assert argentina.evaluate('(e)=>e===document.activeElement && !e.parentElement.open')
        if width<=1050:
            page.keyboard.press('Escape')
            assert not nav.is_visible()
            expect(menu).to_be_focused()
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth+1')
        if width in (390,1280):
            for path,label in paths.items():
                response=page.goto(args.base+path)
                assert response and response.ok,path
                current=nav.locator('[aria-current=page]')
                assert current.count()==1 and current.locator('span').text_content()==label
            if width<=1050:
                menu.click()
            nav.locator('#bo-theme').select_option('dark')
            expect(page.locator('html')).to_have_attribute('data-theme','dark')
            page.reload()
            expect(page.locator('html')).to_have_attribute('data-theme','dark')
            for path,key in [('/local?d=2','local-context'),('/context?d=2','ctx-local-nav')]:
                page.goto(args.base+path)
                assert nav.locator('#'+key).count()==1
        assert not errors,errors
        page.close()
    page=browser.new_page(java_script_enabled=False,viewport={'width':390,'height':844})
    page.goto(args.base+'/')
    page.locator('#atlas-menu summary',has_text='Argentina 2023').click()
    expect(page.locator('#atlas-menu').get_by_role('link',name='Voting circuits')).to_be_visible()
    expect(page.locator('.atlas-quicknav').get_by_role('link',name='Countries')).to_be_visible()
    browser.close()
print('Navigation verified at 320–1280px: visible phone shortcuts, menu keyboard, active links, theme and no-JS fallback.')
