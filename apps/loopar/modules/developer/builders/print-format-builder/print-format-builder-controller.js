'use strict';

import { BaseController, loopar, fileManage } from 'loopar';

const SKIP = new Set(["password", "designer", "id", "padding", "margin", "tailwind", "slot"]);

export default class PrintFormatBuilderController extends BaseController {
  constructor(props) {
    super(props);
  }

  /**
   * Fields of the entity a format prints, for the designer's print elements
   * (doc_field / doc_table pick from this list).
   * → { entity, fields: [{ name, label, element, table }] }
   */
  async actionEntityFields() {
    const ref = this.query?.entity && loopar.getRef(this.query.entity, false);
    if (!ref || ref.__TYPE__ !== "Entity") return { entity: null, fields: [] };

    const cfg = fileManage.getConfigFile(ref.__NAME__, ref.__ROOT__) || {};
    const fields = [];

    const walk = (nodes) => (nodes || []).forEach((node) => {
      const data = node?.data || {};
      if (node?.element && data.name && fieldIsWritable(node) && !SKIP.has(node.element)) {
        fields.push({
          name: data.name,
          label: data.label || loopar.utils.Capitalize(data.name.replaceAll("_", " ")),
          element: node.element,
          table: node.element === FORM_TABLE ? 1 : 0,
        });
      }
      walk(node?.elements);
    });
    walk(loopar.utils.JSONparse(cfg.doc_structure, []));

    return { entity: ref.__NAME__, fields };
  }

  /**
   * "Load entity": the entity's own form layout turned into print elements, so a
   * format starts from the real view and the designer only removes what paper
   * doesn't need. → { entity, elements }
   *
   *   writable field        → doc_field (bound to it; label comes from the entity)
   *   form_table            → doc_table (child list columns)
   *   row / col             → kept, with their layout (reset when columns were dropped)
   *   tab / card / panel /
   *   section with a label  → doc_section (titled, like the automatic format)
   *   tabs                  → its tabs, one after the other (no tabs on paper)
   *   hidden fields, password, system/style fields, slots, buttons → dropped;
   *   containers left empty → dropped
   *
   * Node keys get a per-load suffix so loading twice (append) never collides.
   */
  async actionEntityLayout() {
    const ref = this.query?.entity && loopar.getRef(this.query.entity, false);
    if (!ref || ref.__TYPE__ !== "Entity") return { entity: null, elements: [] };

    const cfg = fileManage.getConfigFile(ref.__NAME__, ref.__ROOT__) || {};
    const load = Math.random().toString(36).slice(2, 7);
    let seq = 0;
    const key = (node) => `pf_${node?.node || node?.data?.key || `n${++seq}`}_${load}`;
    const truthy = (v) => loopar.utils.trueValue(v);

    const SECTIONS = new Set(["tab", "card", "panel", "section"]);
    const DROP = new Set(["button", "slot"]);

    const convert = (nodes) => (nodes || []).flatMap((node) => {
      const element = node?.element;
      const data = node?.data || {};
      if (!element || DROP.has(element)) return [];

      if (fieldIsWritable(node)) {
        if (!data.name || truthy(data.hidden) || SKIP.has(element)) return [];
        return [{
          node: key(node),
          element: element === FORM_TABLE ? "doc_table" : "doc_field",
          data: { field: data.name },
        }];
      }

      if (!node.elements) return [{ ...node, node: key(node) }];   // content leaf (title, paragraph…)

      const children = convert(node.elements);
      if (!children.length) return [];

      if (element === "tabs") return children;
      if (SECTIONS.has(element)) {
        return data.label
          ? [{ node: key(node), element: "doc_section", data: { label: data.label }, elements: children }]
          : children;
      }

      const out = { ...node, node: key(node), data: { ...data }, elements: children };
      if (element === "row" && children.length !== node.elements.length) delete out.data.layout;
      return [out];
    });

    return { entity: ref.__NAME__, elements: convert(loopar.utils.JSONparse(cfg.doc_structure, [])) };
  }
}
