import { describe, expect, it } from 'vitest';
import {
  baseCardRecipe,
  badgeRecipe,
  buttonRecipe,
  disabledControlClasses,
  featureCardRecipe,
  fieldRecipe,
  getBadgeClasses,
  getBaseCardClasses,
  getButtonClasses,
  getContainerClasses,
  getFieldClasses,
  getProseClasses,
  getSectionClasses,
  proseRecipe,
  sectionRecipe,
} from '../../src/lib/design-system/recipes';

describe('typed design recipes', () => {
  it('exposes the canonical BaseCard vocabulary', () => {
    expect(Object.keys(baseCardRecipe.variants.variant)).toEqual([
      'default',
      'glass',
      'elevated',
      'subtle',
    ]);
    expect(getBaseCardClasses({ variant: 'elevated', hover: 'none', rounded: 'xl' })).toContain(
      'shadow-lg'
    );
  });

  it('preserves link-button sizing while centralizing button variants', () => {
    expect(Object.keys(buttonRecipe.variants)).toEqual([
      'primary',
      'secondary',
      'outline',
      'ghost',
      'link',
    ]);
    expect(Object.keys(buttonRecipe.sizes)).toEqual(['sm', 'md', 'lg', 'icon']);
    const classes = getButtonClasses({ variant: 'link', size: 'lg' });
    expect(classes).toContain('p-0');
    expect(classes).not.toContain('min-h-[3.25rem]');
    expect(getButtonClasses({ loading: true })).toContain('pointer-events-none');
    expect(getButtonClasses({ loading: true })).toContain('bg-button-disabled-bg');
    expect(getButtonClasses({ loading: true })).toMatch(/(?:^|\s)border(?:\s|$)/);
    expect(getButtonClasses({ loading: true, variant: 'primary' })).not.toContain(
      'bg-button-primary-bg'
    );
    expect(getButtonClasses({ disabled: true, variant: 'secondary' })).not.toContain('bg-surface');
    expect(getButtonClasses({ size: 'icon' })).toContain('size-8');
  });

  it('centralizes field styling including invalid state', () => {
    expect(fieldRecipe.base).toContain('bg-field-bg');
    expect(fieldRecipe.base).toContain('disabled:bg-button-disabled-bg');
    expect(fieldRecipe.base).not.toContain('disabled:opacity');
    expect(getFieldClasses()).toContain('aria-invalid:border-error');
    expect(disabledControlClasses).toContain('disabled:text-button-disabled-fg');
  });

  it('keeps semantic badge states separate from pill metadata sizing', () => {
    expect(Object.keys(badgeRecipe.variants)).toEqual([
      'primary',
      'secondary',
      'outline',
      'subtle',
      'pill',
      'success',
      'warning',
      'error',
    ]);
    expect(getBadgeClasses({ variant: 'success', size: 'md' })).toContain('text-success-emphasis');
    expect(getBadgeClasses({ variant: 'pill', size: 'xs' })).toContain('tracking-smallcaps');
  });

  it('keeps FeatureCard variants limited to expressive treatments', () => {
    expect(Object.keys(featureCardRecipe.variants)).toEqual(['accent', 'primary']);
  });

  it('centralizes layout and typography recipe vocabularies', () => {
    expect(Object.keys(sectionRecipe.padding)).toEqual(['none', 'sm', 'md', 'lg', 'xl']);
    expect(getSectionClasses({ padding: 'xl', fullWidth: false })).toContain('py-section-2xl');
    expect(getContainerClasses({ size: 'xl' })).toContain('max-w-7xl');
    expect(Object.keys(proseRecipe.sizes)).toEqual(['base', 'lg', 'xl']);
    expect(getProseClasses('xl')).toContain('prose-headings:font-heading');
  });
});
