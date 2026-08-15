
'use strict';

import { Entity } from '../../../../../loopar/modules/core/entities/entity/entity.js';
import { loopar } from "loopar";

/**
 * Envelope fields every generated Contact Form entity must carry as real
 * columns. ContactFormBase (core) relies on them for the security layer:
 * status workflow with silent Spam, scoring, sender normalization, rate
 * limit and per-app segmentation.
 */
const ENVELOPE_ROW = {
  node: 'cfb_envelope_row',
  element: 'row',
  data: { name: 'cfb_envelope', label: 'Submission Envelope', hidden: 1, layout: '[50,50]' },
  elements: [
    {
      node: 'cfb_env_col_a',
      element: 'col',
      data: {},
      elements: [
        // NOTE: no `name` field here — with isDBEntity() including
        // "Contact Form", Entity's #injectMetaFields adds the framework's
        // own name container; declaring it again would duplicate it.
        { node: 'cfb_env_status', element: 'select', data: { name: 'status', label: 'Status', options: 'New\nRead\nReplied\nArchived\nSpam', default: 'New', in_list_view: 1 } },
        { node: 'cfb_env_app', element: 'input', data: { name: 'app', label: 'App', type: 'text', read_only: 1, in_list_view: 1, searchable: 1 } },
        { node: 'cfb_env_submitted', element: 'date_time', data: { name: 'submitted_at', label: 'Submitted At', read_only: 1 } }
      ]
    },
    {
      node: 'cfb_env_col_b',
      element: 'col',
      data: {},
      elements: [
        { node: 'cfb_env_score', element: 'input', data: { name: 'spam_score', label: 'Spam Score', type: 'number', read_only: 1 } },
        { node: 'cfb_env_reasons', element: 'input', data: { name: 'spam_reasons', label: 'Spam Reasons', type: 'text', read_only: 1 } },
        { node: 'cfb_env_email', element: 'input', data: { name: 'normalized_email', label: 'Normalized Email', type: 'text', read_only: 1, searchable: 1 } },
        { node: 'cfb_env_ip', element: 'input', data: { name: 'ip_address', label: 'IP Address', type: 'text', read_only: 1 } }
      ]
    }
  ]
};

function fieldNamesOf(nodes, acc = new Set()) {
  for (const node of nodes || []) {
    if (node?.data?.name) acc.add(node.data.name);
    if (node.elements) fieldNamesOf(node.elements, acc);
  }
  return acc;
}

export default class ContactFormBuilder extends Entity {
  constructor(props) {
    super(props);
  }

  async modulePath() {
    return loopar.makePath("apps", this.__APP__, "modules", this.module, "contact-forms");
  }

  /**
   * Guard: during the original incident an instance with EMPTY name/module
   * reached save()/makeViews() (boot-update cycle), generating orphan files
   * like `modules/contact-forms/undefined.js` (no module segment, classes
   * without a name). Never generate anything without full identity.
   */
  #hasIdentity() {
    return !!(this.name && String(this.name).trim() && this.module && String(this.module).trim());
  }

  /**
   * Inject the envelope BEFORE Entity.save() runs makeTable, so the columns
   * exist from the first save. Idempotent: skipped when already present.
   */
  async save() {
    if (!this.#hasIdentity()) {
      console.warn('[contact-form-builder] save() without name/module — skipped to avoid orphan files');
      return;
    }

    this.doc_structure = this.#ensureEnvelope(this.doc_structure);
    return await super.save(...arguments);
  }

  async makeViews() {
    if (!this.#hasIdentity()) {
      console.warn('[contact-form-builder] makeViews() without name/module — skipped');
      return;
    }
    return await super.makeViews();
  }

  #ensureEnvelope(docStructure) {
    const structure = typeof docStructure === 'string'
      ? (loopar.utils.JSONparse(docStructure, []) || [])
      : (docStructure || []);

    const existing = fieldNamesOf(structure);
    if (structure.some(n => n.node === ENVELOPE_ROW.node)) return JSON.stringify(structure);

    // Only add envelope fields the designer didn't already declare.
    const row = JSON.parse(JSON.stringify(ENVELOPE_ROW));
    for (const col of row.elements) {
      col.elements = col.elements.filter(el => !existing.has(el.data.name));
    }
    row.elements = row.elements.filter(col => col.elements.length);

    if (row.elements.length) structure.push(row);
    return JSON.stringify(structure);
  }
}
