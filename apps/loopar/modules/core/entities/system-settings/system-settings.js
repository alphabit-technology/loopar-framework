
'use strict';

import { loopar, BaseDocument, generateThemeCSS } from 'loopar';
import fs from 'fs'

export default class SystemSettings extends BaseDocument {
  constructor(props) {
    super(props);
  }

  async save() {
    await super.save();
    await this.setTheme();

    await loopar.build();
  }

  async onLoad() {
    await super.onLoad();
  }

  clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  validateConfig() {
    const config = loopar.utils.JSONparse(this.theme, {});
    return {
      theme: config.theme || 'slate',
      darkMode: ['auto', 'custom'].includes(config.darkMode) ? config.darkMode : 'auto',
      darkIntensity: this.clamp(config.darkIntensity ?? 0.95, 0, 1),
      darkCustomColor: config.darkCustomColor || '#0a0a0a',
      includeTitles: config.includeTitles !== false
    };
  }

  async setTheme() {
    const config = this.validateConfig();

    const css = generateThemeCSS(config.theme, {
      darkMode: config.darkMode,
      darkIntensity: config.darkIntensity,
      darkCustomColor: config.darkCustomColor,
      includeTitles: config.includeTitles,
      minify: true,
      contrastThreshold: 4.5
    });
    
    fs.writeFileSync(loopar.makePath(loopar.tenantPath, 'theme.css'), css, 'utf8');
  }
}