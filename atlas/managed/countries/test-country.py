"""Smoke-test published country profile behavior against a development server."""
import os
import sys
from playwright.sync_api import sync_playwright, expect

base=sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:8286'
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_BIN'),args=['--no-sandbox'])
    for width in (320,390,768,1440):
        page=browser.new_page(viewport={'width':width,'height':900})
        errors=[]
        page.on('pageerror',lambda e:errors.append(str(e)))
        assert page.goto(base+'/countries').ok
        expect(page.locator('h1')).to_have_text('Country profiles')
        expect(page.locator('.ct-directory-region li')).to_have_count(23)
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth + 1')
        if width in (390,1440):
            page.screenshot(path=f'/tmp/atlas-country-directory-{width}.png')
        page.get_by_role('link',name='Argentina Archive').click()
        assert page.url.endswith('/countries/arg')
        expect(page.locator('h1')).to_have_text('Argentina')
        expect(page.locator('.ct-result:not([hidden])')).to_contain_text('Javier Milei')
        expect(page.locator('.ct-result:not([hidden]) h4')).to_have_count(2)
        expect(page.locator('.ct-district-map')).to_be_visible()
        assert page.locator('.ct-district-map path[class]').count()>0
        if width in (390,1440):
            page.screenshot(path=f'/tmp/atlas-country-arg-{width}.png')
        first=page.locator('[data-country-control=pres]')
        keys=first.locator('option').evaluate_all('(options) => options.map(o=>o.value)')
        assert len(keys)>2
        first.select_option(keys[-1])
        expect(page.locator('.ct-result:not([hidden])')).to_have_attribute('data-contest',keys[-1])
        page.reload()
        expect(first).to_have_value(keys[-1])
        leg=page.locator('[data-country-control=leg]')
        leg_keys=leg.locator('option').evaluate_all('(options) => options.map(o=>o.value)')
        leg.select_option(leg_keys[-1])
        assert f'election={leg_keys[-1]}' in page.locator('#ct-district-link').get_attribute('href')
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth + 1')
        page.goto(base+'/countries/mex')
        expect(page.locator('h1')).to_have_text('Mexico')
        expect(page.locator('.ct-result:not([hidden])')).to_contain_text('Claudia Sheinbaum')
        expect(page.locator('#ct-district-status')).to_contain_text('No one-to-one boundary matches')
        expect(page.locator('.ct-plot')).to_have_count(3)
        page.goto(base+'/countries/blz')
        expect(page.locator('#presidential')).to_contain_text('No direct presidential results')
        expect(page.locator('#districts .ct-plot')).to_be_visible()
        page.goto(base+'/countries/cub')
        expect(page.locator('.ct-alert')).to_contain_text('does not directly elect its president')
        expect(page.locator('#districts')).to_contain_text('does not contain lower-house constituency returns')
        assert not errors,errors
        page.close()
    page=browser.new_page(viewport={"width":320,"height":900})
    assert page.goto(base+'/countries').ok
    country_paths=page.locator('.ct-directory-region li a').evaluate_all(
        '(links) => links.map(a => a.getAttribute("href"))'
    )
    assert len(set(country_paths)) == 23
    contract=[
        ('presidential','Presidential history'),
        ('blocs','Voting bloc history'),
        ('districts','Legislative constituencies'),
        ('country-context','Country context'),
    ]
    missing_count=0
    for path in country_paths:
        assert page.goto(base+path).ok, path
        assert [label.replace(' ', '') for label in page.locator('.ct-jump a').all_text_contents()] == [
            f'{index:02}{title}'.replace(' ', '') for index, (_, title) in enumerate(contract, start=1)
        ], path
        assert page.locator('.ct-section').evaluate_all('(sections) => sections.map(s => s.id)') == [
            section for section,_ in contract
        ], path
        for key, title in contract:
            assert page.locator(f'.ct-jump a[href="#{key}"]').count() == 1, path
            expect(page.locator(f'#{key} > .ct-section-head h2')).to_have_text(title)
            status=page.locator(f'#{key} > .ct-section-head .ct-status')
            if status.get_attribute('data-coverage') == 'missing':
                missing_count += 1
                expect(page.locator(f'#{key} .ct-empty')).to_be_visible()
                expect(status).to_have_text('Not in this archive')
            else:
                expect(status).to_have_attribute('data-coverage','available')
                expect(page.locator(f'#{key} .ct-empty')).to_have_count(0)
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth + 1'), path
    assert missing_count>0
    page.close()
    page=browser.new_page(java_script_enabled=False)
    assert page.goto(base+'/countries/hti').ok
    expect(page.locator('h1')).to_have_text('Haiti')
    expect(page.locator('.ct-result')).to_have_count(1)
    assert page.locator('.ct-round').first.is_visible()
    browser.close()
print('Country profile browser checks passed at four widths: directory, exact history records, round separation, saved selection, mapped/unmapped districts, no data and no-JS access.')
