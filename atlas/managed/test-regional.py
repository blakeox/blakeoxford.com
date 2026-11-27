"""Regional explorer browser checks against local or deployed Atlas."""
import os
import sys
from playwright.sync_api import sync_playwright, expect

base = sys.argv[1] if len(sys.argv) > 1 else 'http://127.0.0.1:8281'
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=os.environ.get('CHROMIUM_BIN'), args=['--no-sandbox'])
    for width in (320, 390, 820, 1280):
        page = browser.new_page(viewport={'width': width, 'height': 900}, has_touch=width<500, accept_downloads=True)
        errors = []
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.goto(base+'/regional')
        expect(page.locator('#summary')).to_contain_text('of 23 countries')
        expect(page.locator('#map > [data-country]')).to_have_count(23)
        expect(page.locator('#map-mode')).to_have_value('pres')
        expect(page.locator('#legend')).to_contain_text('20% to < 40%')
        if width in (390, 1280):
            page.screenshot(path=f'/tmp/atlas-explorer-{width}.png')
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth + 1')
        if width<=560:
            page.locator('#region').select_option('Central America')
        else:
            page.get_by_role('button',name='Central America · 7 countries').click()
        expect(page.locator('#map > [data-country]')).to_have_count(7)
        assert 'region=central' in page.url
        visible = page.locator('#map').get_attribute('viewBox')
        page.get_by_role('button',name='Zoom in',exact=True).click()
        assert page.locator('#map').get_attribute('viewBox') != visible
        zoomed=page.locator('#map').get_attribute('viewBox')
        page.locator('#map').focus()
        page.keyboard.press('ArrowRight')
        assert page.locator('#map').get_attribute('viewBox') != zoomed
        if width==1280:
            b=page.locator('#map').bounding_box()
            page.mouse.move(b['x']+b['width']*.48,b['y']+b['height']*.49)
            page.mouse.down()
            page.mouse.move(b['x']+b['width']*.56,b['y']+b['height']*.56,steps=6)
            page.mouse.up()
            assert page.locator('#details h2').inner_text() == 'Central America'
        page.get_by_role('button',name='Reset view',exact=True).click()
        assert page.locator('#map').get_attribute('viewBox') == visible
        if width<=560:
            page.get_by_text('Map filters',exact=True).click()
        page.locator('#country').select_option('PAN')
        expect(page.locator('#details h2')).to_have_text('Panama')
        assert 'country=PAN' in page.url
        page.get_by_role('button',name='Fit country',exact=True).click()
        assert page.locator('#map').get_attribute('viewBox') != visible
        page.locator('#map-mode').select_option('context')
        expect(page.locator('#details')).to_contain_text('Population and economy')
        expect(page.locator('#atlas-period')).to_be_hidden()
        page.locator('#metric').select_option('ctxGdp')
        expect(page.locator('#legend')).to_contain_text('$5k to < $10k')
        page.reload()
        expect(page.locator('#map-mode')).to_have_value('context')
        expect(page.locator('#metric')).to_have_value('ctxGdp')
        expect(page.locator('#details h2')).to_have_text('Panama')
        page.goto(base+'/regional?country=MEX&view=pres')
        expect(page.locator('#details')).to_contain_text('Claudia Sheinbaum')
        page.get_by_role('button',name='Explore constituencies').click()
        expect(page.locator('#district-picker option')).to_have_count(302)
        expect(page.locator('#districts')).to_contain_text('Boundaries are not matched')
        page.goto(base+'/regional?country=ARG&view=blocs')
        expect(page.locator('#map-mode')).to_have_value('blocs')
        expect(page.locator('#details')).to_contain_text('Bloc history')
        expect(page.locator('#details a[href="/argentina"]')).to_be_visible()
        page.goto(base+'/regional?country=CUB&view=pres')
        expect(page.locator('#details')).to_contain_text('does not directly elect its president')
        expect(page.locator('#details')).to_contain_text('No map data')
        if width==1280:
            with page.expect_download() as record:
                page.get_by_role('button',name='Download this view').click()
            assert record.value.suggested_filename.endswith('.csv')
            page.locator('#bo-theme').select_option('dark')
            page.goto(base+'/regional')
            expect(page.locator('html')).to_have_attribute('data-theme','dark')
            page.screenshot(path='/tmp/atlas-explorer-dark.png')
        assert not errors, errors
        page.close()
    browser.close()
print('Regional explorer passed for 320, 390, 820, and 1280px: 23 countries, zoom, context, URL, election and district drill-down, missing data, CSV, and dark mode.')
