import { themes } from './themes.js';
import chroma from 'chroma-js';

export const NEUTRAL_THEMES = ['slate', 'gray', 'zinc', 'neutral', 'stone'];

export function isNeutralTheme(themeName, color = null) {
  if (NEUTRAL_THEMES.includes(themeName)) {
    return true;
  }
  
  if (color) {
    const base = chroma(color);
    return base.get('hsl.s') < 0.15;
  }
  
  return false;
}

export function generateThemeCSS(themeName, options = {}) {
  const {
    includeTitles = true,
    minify = false,
    contrastThreshold = 4.5,
    darkMode = 'auto',
    darkIntensity = 0.95,
    darkCustomColor = null
  } = options;

  const themeColors = themes.reduce((acc, theme) => {
    acc[theme.name] = theme.color;
    return acc;
  }, {});

  const baseTextHex = themeColors[themeName] || themeColors.blue;

  let darkBgColor;
  if (darkMode === 'custom' && darkCustomColor) {
    darkBgColor = applyIntensityToColor(darkCustomColor, darkIntensity);
  } else {
    darkBgColor = deriveDarkBackground(baseTextHex, darkIntensity);
  }

  const lightMode = generateLightModeColors(baseTextHex, contrastThreshold, themeName);
  const darkMode_colors = generateDarkModeColors(
    darkBgColor,
    baseTextHex,
    themeName,
    contrastThreshold
  );

  return buildCSS(lightMode, darkMode_colors, includeTitles, minify);
}

function applyIntensityToColor(color, intensity = 0.95) {
  if (intensity === 0) {
    return '#000000';
  }
  
  const base = chroma(color);
  const h = base.get('hsl.h') || 0;
  const s = base.get('hsl.s');
  
  const targetLightness = intensity * 0.20;
  
  return chroma.hsl(h, s, targetLightness).hex();
}

function deriveDarkBackground(themeColor, intensity = 0.95) {
  if (intensity === 0) {
    return '#000000';
  }
  
  const base = chroma(themeColor);
  const isNeutral = base.get('hsl.s') < 0.15;
  
  const h = base.get('hsl.h') || 0;
  const s = base.get('hsl.s');
  
  const targetLightness = intensity * 0.20;
  
  if (isNeutral) {
    return chroma.hsl(h, s * 0.5, targetLightness).hex();
  } else {
    return chroma.hsl(h, s * 0.7, targetLightness).hex();
  }
}

function generateLightModeColors(baseTextHex, contrastThreshold, themeName) {
  const background = chroma('white').alpha(1);
  
  const baseColor = chroma(baseTextHex);
  const isNeutral = isNeutralTheme(themeName, baseTextHex);
  
  let text;
  if (isNeutral) {
    text = baseColor.darken(2.5).alpha(1);
  } else {
    text = chroma.mix('#09090b', baseTextHex, 0.15, 'rgb').alpha(1);
  }
  
  if (chroma.contrast(text, background) < contrastThreshold) {
    text = chroma('#09090b').alpha(1);
  }
  
  let card;
  if (isNeutral) {
    card = baseColor.brighten(3.5).desaturate(0.5).alpha(1);
  } else {
    card = chroma.mix('#fafafa', baseTextHex, 0.03, 'rgb').alpha(1);
  }
  
  let primary = baseColor.alpha(1);
  let primaryContrast = chroma.contrast(primary, background);
  if (primaryContrast < contrastThreshold) {
    let darkenAmount = 0;
    while (primaryContrast < contrastThreshold && darkenAmount < 2.5) {
      darkenAmount += 0.15;
      primary = baseColor.darken(darkenAmount).saturate(0.3).alpha(1);
      primaryContrast = chroma.contrast(primary, background);
    }
  }
  
  const primaryForeground = chroma.contrast(primary, 'white') >= contrastThreshold 
    ? chroma('white').alpha(1)
    : chroma('black').alpha(1);

  const primaryHue = primary.get('hsl.h');
  const secondaryHue = isNaN(primaryHue) ? 0 : (primaryHue + 30) % 360;
  const secondary = chroma.hsl(secondaryHue, 0.048, 0.959).alpha(1);
  const secondaryForeground = text;

  const popover = chroma.mix('white', baseTextHex, 0.02, 'rgb').alpha(1);
  const border = chroma.mix('#e5e7eb', baseTextHex, 0.08, 'rgb').alpha(1);

  return {
    background,
    foreground: text,
    card,
    cardForeground: text,
    popover,
    popoverForeground: text,
    primary,
    primaryForeground,
    secondary,
    secondaryForeground,
    muted: secondary,
    mutedForeground: chroma.mix('#71717a', baseTextHex, 0.15, 'rgb').alpha(1),
    accent: secondary,
    accentForeground: secondaryForeground,
    destructive: chroma.hsl(0, 0.842, 0.602).alpha(1),
    destructiveForeground: chroma('white').alpha(1),
    border,
    input: border,
    ring: primary
  };
}

function generateDarkModeColors(bgColor, baseTextHex, themeName, contrastThreshold) {
  const background = chroma(bgColor).alpha(1);
  const baseColor = chroma(baseTextHex);
  const isNeutral = isNeutralTheme(themeName, baseTextHex);
  
  const text = chroma('#fafafa').alpha(1);
  
  let card;
  if (isNeutral) {
    card = background.darken(0.15).alpha(1);
  } else {
    card = chroma.mix(background.hex(), baseTextHex, 0.05, 'rgb').darken(0.1).alpha(1);
  }
  
  let primary;
  if (isNeutral) {
    primary = chroma('#f5f5f5').alpha(1);
  } else {
    primary = baseColor.saturate(0.5).alpha(1);
  }
  
  const primaryLuminance = primary.luminance();
  const primaryForeground = primaryLuminance > 0.5
    ? chroma('black').alpha(1)
    : chroma('white').alpha(1);

  const primaryHue = primary.get('hsl.h');
  const secondaryHue = isNaN(primaryHue) ? 0 : (primaryHue + 30) % 360;
  const secondary = chroma.hsl(secondaryHue, 0.065, 0.151).alpha(1);

  const popover = chroma.mix(background.hex(), baseTextHex, 0.03, 'rgb').alpha(1);
  const border = chroma.mix(background.hex(), baseTextHex, 0.1, 'rgb').brighten(0.2).alpha(1);

  return {
    background,
    foreground: text,
    card,
    cardForeground: text,
    popover,
    popoverForeground: text,
    primary,
    primaryForeground,
    secondary,
    secondaryForeground: text,
    muted: secondary,
    mutedForeground: chroma('#a1a1aa').alpha(1),
    accent: secondary,
    accentForeground: text,
    destructive: chroma.hsl(0, 0.722, 0.506).alpha(1),
    destructiveForeground: chroma('white').alpha(1),
    border,
    input: border,
    ring: primary
  };
}

function toHSLString(color) {
  let h = color.get('hsl.h');
  if (isNaN(h)) h = 0;
  
  const s = color.get('hsl.s') * 100;
  const l = color.get('hsl.l') * 100;
  
  return `${h.toFixed(1)} ${s.toFixed(1)}% ${l.toFixed(1)}%`;
}

function buildCSS(lightMode, darkMode, includeTitles, minify) {
  const lightVars = generateCSSVariables(lightMode);
  const darkVars = generateCSSVariables(darkMode);
  
  const titleStyles = includeTitles
    ? generateTitleStyles()
    : '';

  if (minify) {
    return minifyCSS(`
      :root{${lightVars}}
      .dark{${darkVars}}
      ${titleStyles}
    `);
  }

  return `
:root {
${indent(lightVars, 2)}
}

.dark {
${indent(darkVars, 2)}
}
${titleStyles}
`.trim();
}

function generateCSSVariables(colors) {
  const variables = [
    ['--background', colors.background],
    ['--foreground', colors.foreground],
    ['--card', colors.card],
    ['--card-foreground', colors.cardForeground],
    ['--popover', colors.popover],
    ['--popover-foreground', colors.popoverForeground],
    ['--primary', colors.primary],
    ['--primary-foreground', colors.primaryForeground],
    ['--secondary', colors.secondary],
    ['--secondary-foreground', colors.secondaryForeground],
    ['--muted', colors.muted],
    ['--muted-foreground', colors.mutedForeground],
    ['--accent', colors.accent],
    ['--accent-foreground', colors.accentForeground],
    ['--destructive', colors.destructive],
    ['--destructive-foreground', colors.destructiveForeground],
    ['--border', colors.border],
    ['--input', colors.input],
    ['--ring', colors.ring],
    ['--radius', '0.5rem']
  ];

  return variables
    .map(([prop, value]) => {
      const colorValue = typeof value === 'string' ? value : toHSLString(value);
      return `${prop}: ${colorValue};`;
    })
    .join('\n');
}

function generateTitleStyles() {
  const opacities = [95, 85, 75, 65, 55, 45];
  return ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']
    .map((tag, i) => `${tag}{color:hsl(var(--foreground)/${opacities[i]}%)}`)
    .join('');
}

function indent(text, spaces) {
  const indentation = ' '.repeat(spaces);
  return text
    .split('\n')
    .map(line => line.trim() ? indentation + line : line)
    .join('\n');
}

function minifyCSS(css) {
  return css
    .replace(/\s+/g, ' ')
    .replace(/\s*{\s*/g, '{')
    .replace(/\s*}\s*/g, '}')
    .replace(/\s*:\s*/g, ':')
    .replace(/\s*;\s*/g, ';')
    .replace(/;\s*}/g, '}')
    .trim();
}

export function generateThemeVariations(options = {}) {
  const availableThemes = themes.map(t => t.name);
  
  return availableThemes.reduce((acc, themeName) => {
    acc[themeName] = generateThemeCSS(themeName, options);
    return acc;
  }, {});
}

export function isValidColor(color) {
  try {
    chroma(color);
    return true;
  } catch (e) {
    return false;
  }
}

export function getContrast(color1, color2) {
  try {
    return chroma.contrast(color1, color2);
  } catch (e) {
    return 0;
  }
}

export function previewDarkBackground(themeName, intensity = 0.95, mode = 'auto', customColor = null) {
  if (mode === 'custom' && customColor) {
    return applyIntensityToColor(customColor, intensity);
  }
  
  const themeColors = themes.reduce((acc, theme) => {
    acc[theme.name] = theme.color;
    return acc;
  }, {});
  
  const baseColor = themeColors[themeName] || themeColors.blue;
  return deriveDarkBackground(baseColor, intensity);
}