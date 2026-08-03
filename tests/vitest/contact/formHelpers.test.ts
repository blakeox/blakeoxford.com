import { afterEach, describe, expect, it } from 'vitest';
import { getFieldLabel } from '../../../src/features/contact/form/FormHelpers';

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
