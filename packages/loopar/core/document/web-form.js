'use strict'

export const MIN_FILL_TIME_MS = 3000;

/** Depth-first walk of a doc_structure subtree. */
export function walkStructure(nodes, fn) {
  for (const node of nodes || []) {
    fn(node);
    if (node.elements) walkStructure(node.elements, fn);
  }
}

/**
 * Find the target `form` element inside a document structure.
 * Match priority: node id → form's designer name → the only form present.
 */
export function findFormNode(docStructure, { node = null, formName = null } = {}) {
  const structure = typeof docStructure === 'string'
    ? (JSON.parse(docStructure || '[]') || [])
    : (docStructure || []);

  const forms = [];
  walkStructure(structure, (el) => { if (el.element === 'form') forms.push(el); });

  if (!forms.length) return null;
  if (node) {
    const byNode = forms.find(f => f.node === node);
    if (byNode) return byNode;
  }
  if (formName) {
    const byName = forms.find(f => f.data?.name === formName);
    if (byName) return byName;
  }
  return forms.length === 1 ? forms[0] : null;
}

/** Writable field metadata of a form element. */
export function formFields(formNode) {
  const fields = [];
  walkStructure(formNode?.elements || [], (el) => {
    if (fieldIsWritable(el)) fields.push(el);
  });
  return fields;
}

/**
 * Validate ONLY the submitted form's fields, reusing the DynamicFields the
 * page-as-model document already built (doc.fields). Returns error messages.
 */
export function scopedErrors(doc, scope) {
  return Object.values(doc.fields || {})
    .filter(f => scope.has(f.name))
    .map(f => f.validate())
    .filter(r => r && !r.valid)
    .map(r => r.message);
}

/** Whitelist: only fields declared by the form survive into the payload. */
export function pickPayload(scope, data = {}) {
  const payload = {};
  for (const name of scope) payload[name] = data[name] ?? null;
  return payload;
}

export function botContext(body = {}) {
  const elapsed = Number(body._elapsed);
  return {
    honeypot: !!(body._hp || '').trim(),
    fastFill: !Number.isFinite(elapsed) || elapsed < MIN_FILL_TIME_MS
  };
}

export async function verifyCaptcha(loopar, token, ip) {
  for (const provider of ['Altcha', 'Turnstile']) {
    let integration = null;
    try {
      integration = await loopar.getDocument(provider);
    } catch (error) {
      continue; // not installed yet
    }

    if (integration?.isActive?.()) {
      return await integration.assertHuman(token, ip);
    }
  }

  return false;
}
