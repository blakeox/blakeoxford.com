import { afterEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { getFieldLabel, setSubmittingState } from '../../../src/features/contact/form/FormHelpers';

describe('getFieldLabel', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('removes every required marker from the associated label', () => {
    const label = document.createElement('label');
    const field = document.createElement('input');
    label.htmlFor = 'project';
    label.textContent = '* Project * brief *';
    field.id = 'project';
    document.body.append(label, field);

    expect(getFieldLabel(field, 'Fallback')).toBe('Project  brief');
  });
});

describe('contact submission labels', () => {
  it('keeps the initial and restored button labels aligned without promising a booking', () => {
    const source = readFileSync(
      path.join(process.cwd(), 'src/components/features/contact/ContactMessageSection.astro'),
      'utf8'
    );
    const initialLabel = source.match(/<span id="btn-label">([^<]+)<\/span>/)?.[1];
    expect(initialLabel).toBe('Send project brief');

    const form = document.createElement('form');
    form.innerHTML = `<button type="submit"><span id="btn-label">${initialLabel}</span><span id="spinner" class="hidden"></span></button>`;
    const button = form.querySelector('button')!;
    const label = form.querySelector('#btn-label')!;

    setSubmittingState(form, true);
    expect(button.disabled).toBe(true);
    expect(label.textContent).toBe('Sending securely…');

    setSubmittingState(form, false);
    expect(button.disabled).toBe(false);
    expect(label.textContent).toBe(initialLabel);
  });
});
