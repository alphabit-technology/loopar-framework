'use strict';

import { BaseController, loopar } from 'loopar';
import * as LucideStatic from "lucide-static";
import * as simpleIcons from "simple-icons";
import { existsSync, readFileSync } from 'fs';
import path from "pathe";

let iconsCache = null;

const siKey = (rawKey) => rawKey.charAt(0).toUpperCase() + rawKey.slice(1);

const getIcons = async () => {
  if (!iconsCache) {
    const enables = [];

    Object.keys(LucideStatic).forEach(name => {
      const kebabName = name.replace(/([a-z])([A-Z])/g, '$1-$2').replace(/Icon$/, '').toLowerCase();
      const svgPath = path.join(loopar.pathRoot, `node_modules/lucide-static/icons/${kebabName}.svg`);

      if (existsSync(svgPath)) enables.push({
        name,
        label: name,
        source: 'lucide',
        formattedValue: readFileSync(svgPath, 'utf-8'),
      });
    });

    Object.entries(simpleIcons).forEach(([rawKey, icon]) => {
      if (!rawKey.startsWith('si') || typeof icon?.svg !== 'string') return;
      const name = siKey(rawKey);
      enables.push({
        name,
        label: icon.title || name,
        source: 'simple-icons',
        hex: icon.hex,
        formattedValue: icon.svg,
      });
    });

    iconsCache = enables;
  }
  return iconsCache;
};

export default class IconManagerController extends BaseController {
  constructor(props) {
    super(props);
  }

  async actionSearch() {
    const q = this.q || '';
    const page = parseInt(this.page || 1);
    const limit = parseInt(this.limit || 50);

    const allIcons = await getIcons();
    const filtered = (q && q.length > 0) 
      ? allIcons.filter(icon => 
          icon.name && icon.name.toLowerCase().includes(q.toLowerCase())
        )
      : allIcons;

    const total = filtered.length;
    const pages = Math.ceil(total / limit) || 1;
    const currentPage = Math.min(Math.max(1, page), pages);
    const start = (currentPage - 1) * limit;
    const end = start + limit;

    const rows = filtered.slice(start, end);

    return {
      rows,
      title_fields: ["label"],
      pagination: {
        page: currentPage,
        limit,
        total,
        pages
      }
    };
  }

  async publicActionGetSvg() {
    const name = this.name;
    if (!name) return { error: 'Icon name required' };

    const allIcons = await getIcons();
    const icon = allIcons.find(i => i.name === name);
    if (!icon) return { error: 'Icon not found' };

    return { name, svg: icon.formattedValue, source: icon.source, hex: icon.hex ?? null };
  }
}