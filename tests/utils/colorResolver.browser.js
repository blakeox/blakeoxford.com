/* Browser-side CSS color → sRGB resolver for contrast tests. */
window.__resolveCssColorToRgb = function resolveCssColorToRgb(cssColor, property) {
  if (!cssColor || cssColor === 'transparent' || cssColor === 'rgba(0, 0, 0, 0)') {
    return null;
  }

  function parseRgbString(raw) {
    if (!raw) return null;
    var val = String(raw).trim().toLowerCase();
    var hexMatch = val.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
    if (hexMatch) {
      var h = hexMatch[1];
      if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join('');
      return [
        parseInt(h.slice(0, 2), 16),
        parseInt(h.slice(2, 4), 16),
        parseInt(h.slice(4, 6), 16),
      ];
    }
    var rgbMatch = val.match(/rgba?\(\s*([\d.]+)\s*(?:,|\s)\s*([\d.]+)\s*(?:,|\s|\/)\s*([\d.]+)/i);
    if (rgbMatch) {
      return [
        Math.round(parseFloat(rgbMatch[1])),
        Math.round(parseFloat(rgbMatch[2])),
        Math.round(parseFloat(rgbMatch[3])),
      ];
    }
    var srgbMatch = val.match(/color\(\s*srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/i);
    if (srgbMatch) {
      return [
        Math.round(parseFloat(srgbMatch[1]) * 255),
        Math.round(parseFloat(srgbMatch[2]) * 255),
        Math.round(parseFloat(srgbMatch[3]) * 255),
      ];
    }
    return null;
  }

  function oklabToRgb(L, a, b) {
    var l_ = L + 0.3963377774 * a + 0.2158037573 * b;
    var m_ = L - 0.1055613458 * a - 0.0638541728 * b;
    var s_ = L - 0.0894841775 * a - 1.291485548 * b;
    var l = l_ * l_ * l_;
    var m = m_ * m_ * m_;
    var s = s_ * s_ * s_;
    return [
      Math.round(255 * Math.max(0, Math.min(1, 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s))),
      Math.round(255 * Math.max(0, Math.min(1, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s))),
      Math.round(255 * Math.max(0, Math.min(1, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s))),
    ];
  }

  function parseOklab(raw) {
    var match = String(raw).match(/oklab\(\s*([-\d.eE]+)\s+([-\d.eE]+)\s+([-\d.eE]+)/i);
    if (!match) return null;
    return oklabToRgb(parseFloat(match[1]), parseFloat(match[2]), parseFloat(match[3]));
  }

  function parseOklch(raw) {
    var match = String(raw).match(/oklch\(\s*([-\d.eE%]+)\s+([-\d.eE]+)\s+([-\d.eE]+)/i);
    if (!match) return null;
    var L = match[1].includes('%') ? parseFloat(match[1]) / 100 : parseFloat(match[1]);
    var C = parseFloat(match[2]);
    var H = (parseFloat(match[3]) * Math.PI) / 180;
    return oklabToRgb(L, C * Math.cos(H), C * Math.sin(H));
  }

  var direct = parseRgbString(cssColor);
  if (direct) return direct;

  var fromOklab = parseOklab(cssColor);
  if (fromOklab) return fromOklab;

  var fromOklch = parseOklch(cssColor);
  if (fromOklch) return fromOklch;

  try {
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = cssColor;
      var hex = ctx.fillStyle;
      if (typeof hex === 'string' && hex.charAt(0) === '#') {
        var hx = hex.length === 4
          ? hex.slice(1).split('').map(function (c) { return c + c; }).join('')
          : hex.slice(1);
        return [
          parseInt(hx.slice(0, 2), 16),
          parseInt(hx.slice(2, 4), 16),
          parseInt(hx.slice(4, 6), 16),
        ];
      }
    }
  } catch { /* noop */ }

  var probe = document.createElement('span');
  probe.style.cssText = 'position:fixed;left:-9999px;visibility:hidden;pointer-events:none;';
  if (property === 'background') {
    probe.style.backgroundColor = cssColor;
  } else {
    probe.style.color = cssColor;
  }
  document.documentElement.appendChild(probe);
  var cs = getComputedStyle(probe);
  var resolved = property === 'background' ? cs.backgroundColor : cs.color;
  probe.remove();

  return (
    parseRgbString(resolved)
    || parseOklab(resolved)
    || parseOklch(resolved)
    || [0, 0, 0]
  );
};
