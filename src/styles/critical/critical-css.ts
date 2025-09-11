/**
 * Stub critical CSS module.
 * This file is overwritten by scripts/build/critical-css-generator.js when generating real critical CSS.
 */

export interface CriticalCSSMap {
  common: string;
  pages: {
    home?: string;
    about?: string;
    projects?: string;
    blog?: string;
    contact?: string;
  };
}

export const criticalCSS: CriticalCSSMap = {
  common: '',
  pages: {}
};

export function getCriticalCSS(pageName: string): string {
  const pageCSS = (criticalCSS.pages as Record<string, string>)[pageName] || '';
  return `${criticalCSS.common}\n${pageCSS}`;
}
