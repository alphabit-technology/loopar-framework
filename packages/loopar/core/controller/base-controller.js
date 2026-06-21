'use strict'

import { loopar, DOC_STATUS, coerceDocStatus } from "loopar";
import CoreController from './core-controller.js';

const HISTORY_TABLE = 'Document History';
const COMMENT_TABLE = 'Comment';

// Audit log = pure events (no comments). diff/metadata are textareas, so a
// default getList wouldn't return them — fetch an explicit field set.
const AUDIT_FIELDS = ['name', 'user', 'action', 'event_at', 'diff', 'metadata'];
const COMMENT_FIELDS = ['name', 'document', 'document_name', 'parent', 'user', 'guest_name', 'guest_email', 'comment', 'status', 'created_at'];

const MAX_COMMENT_LEN = 2000;

// Public-facing commenter label: authenticated users carry `user`; guests
// carry guest_name. The email is never exposed.
function commenterName(row) {
  return row.user || row.guest_name || 'Guest';
}

export default class BaseController extends CoreController {
  defaultAction = 'list';
  hasSidebar = true;
  static enabledActions = []

  async actionList() {
    if (this.hasData()) {
      loopar.session.set(this.document + '_q', this.data.q || {});
      loopar.session.set(this.document + '_page', this.data.page || 1);
    }

    const data = Object.entries({ ...loopar.session.get(this.document + '_q') || {} }).reduce((acc, [key, value]) => {
      if (value && (value.toString()).length > 0 && value !== 0) {
        acc[key] = `${value}`;
      }
      return acc;
    }, {});

    const list = await loopar.getList(this.document, { data, q: (data && Object.keys(data).length > 0) ? data : null });

    if(this.preloaded == 'true') {
      return {
        instance: this.getInstance(),
        rows: list.rows,
        pagination: list.pagination
      }
    }

    return await this.render(list);
  }

  async actionCreate() {
    const document = await loopar.newDocument(this.document, this.data);

    if (document.__ENTITY__.is_single) {
      return loopar.throw({
        code: 404,
        message: "This document is single, you can't create new"
      });
    }

    if (this.hasData()) {
      await document.save();
      return this.redirect('update?name=' + document.name);
    } else {
      if(this.preloaded == 'true') {
        return await document.values();
      }
      
      Object.assign(this.response, await document.__meta__());
      return await this.render(this.response);
    }
  }

  async actionUpdate(document) {
    document ??= await loopar.getDocument(this.document, this.query.name, this.hasData() ? this.data : null);

    if (this.hasData()) {
      const Entity = document.__ENTITY__;
      const isSingle = Entity.is_single;
      await document.save();

      return await this.success(
        `${(Entity.name === "Entity") ? document.type || "Entity" : (isSingle ? "" : Entity.name)} ${isSingle ? Entity.name : document.name} saved successfully`, { name: document.name }
      );
    } else {
      if(this.preloaded == 'true') {
        return {
          instance: this.getInstance(),
          data: await document.values()
        }
      }
      return await this.render({ ...await document.__meta__(), ...this.response || {} });
    }
  }

  async actionView() {
    const document = await loopar.getDocument(this.document, this.name);
    return await this.render(document);
  }

  async actionDelete() {
    const document = await loopar.getDocument(this.document, this.name);
    await document.delete();

    return this.redirect('list');
  }

  async actionBulkDelete() {
    const raw = this.body?.names;
    const names = Array.isArray(raw)
      ? raw
      : (loopar.utils.isJSON(raw) ? JSON.parse(raw) : []);

    if (Array.isArray(names)) {
      for (const name of names) {
        const document = await loopar.getDocument(this.document, name);
        await document.delete();
      }
    }

    return this.success(`Documents ${names.join(', ')} deleted successfully`, { name: names.join(', ') });
  }

  // ---- Document history & comments ---------------------------------------
  // Inherited by every entity controller, gated by the entity's
  // `enable_history` / `enable_comments` flags. Audit lives in the immutable
  // "Document History" log; comments live in the threaded "Comment" entity.
  // `this.documentHistory` lets a controller anchor to a different owner
  // (e.g. pages anchor to "Page Builder"); defaults to this.document.

  commentTarget() {
    return this.documentHistory || this.document;
  }

  async fetchAudit(documentName) {
    const filters = { document: this.commentTarget(), document_name: documentName };
    loopar.session.set(HISTORY_TABLE + '_page', parseInt(this.query?.page) || 1);
    const list = await loopar.getList(HISTORY_TABLE, { fields: AUDIT_FIELDS, filters });
    return list.rows || [];
  }

  /**
   * Comments in scope for a record: comments ON the record itself, plus
   * (when includeEvents) comments ON any of its audit events — i.e. a Comment
   * whose target is a "Document History" row. Normalized to a common shape
   * (event_at, action, display user); `parent` lets the client build the tree.
   */
  async fetchComments(documentName, { onlyApproved = false, includeEvents = true } = {}) {
    const target = this.commentTarget();

    let eventIds = [];
    if (includeEvents) {
      const events = await loopar.db.qx()(HISTORY_TABLE)
        .select('name')
        .where({ document: target, document_name: documentName });
      eventIds = events.map(e => e.name);
    }

    let qb = loopar.db.qx()(COMMENT_TABLE)
      .select(COMMENT_FIELDS)
      .where((b) => {
        b.where((g) => g.where('document', target).andWhere('document_name', documentName));
        if (eventIds.length) {
          b.orWhere((g) => g.where('document', HISTORY_TABLE).whereIn('document_name', eventIds));
        }
      });

    if (onlyApproved) qb = qb.where('status', DOC_STATUS.APPROVED);
    qb = qb.orderBy('created_at', 'asc');

    const rows = await qb;
    return rows.map(r => ({
      name: r.name,
      document: r.document,
      document_name: r.document_name,
      parent: r.parent || null,
      user: commenterName(r),
      comment: r.comment,
      status: r.status,
      event_at: r.created_at,
      action: 'Commented',
    }));
  }

  /**
   * Unified desk feed: audit events + comments interleaved (newest first).
   * Sensitive (permission-gated, NOT public) so diffs only reach authorized
   * users. Comment rows carry `parent` so the client builds the tree.
   * Query: { documentName }   (documentHistory: optional owner override)
   */
  async actionHistory(q, documentHistory) {
    q ??= this.query || {};
    this.documentHistory = documentHistory || this.document;

    const documentName = q.documentName ? String(q.documentName).trim() : null;
    if (!documentName) return { rows: [], pagination: {} };

    const ref = loopar.getRef?.(this.document) || {};
    const audit = ref.enable_history ? await this.fetchAudit(documentName) : [];
    const comments = ref.enable_comments ? await this.fetchComments(documentName) : [];

    const rows = [...audit, ...comments].sort(
      (a, b) => new Date(b.event_at || 0) - new Date(a.event_at || 0)
    );

    return { rows, pagination: {} };
  }

  /**
   * Public comment tree for a document — APPROVED only, no audit/diffs, no
   * event-comments (the public web shows the record's discussion, not the log).
   * Query: { documentName }
   */
  async publicActionComments() {
    const q = this.query || {};
    const documentName = q.documentName ? String(q.documentName).trim() : null;
    if (!documentName) return { rows: [], pagination: {} };

    const ref = loopar.getRef?.(this.document) || {};
    if (!ref.enable_comments) return { rows: [], pagination: {} };

    const rows = await this.fetchComments(documentName, { onlyApproved: true, includeEvents: false });
    return { rows, pagination: {} };
  }

  /**
   * Write a comment (threaded via `parent`). Authenticated → auto-APPROVED;
   * guest → PENDING with name/email; login can be required per entity. When
   * `body.document === "Document History"` the comment targets a specific
   * audit event (comment-on-an-event) instead of the record.
   * Body: { documentName, comment, parent?, document?, guest_name?, guest_email? }
   */
  async actionAddComment() {
    const d = this.data || {};
    const target = this.commentTarget();
    const ref = loopar.getRef?.(target) || {};
    if (!ref.enable_comments) loopar.throw('Comments are not enabled for this document');

    const documentName = d.documentName ? String(d.documentName).trim() : null;
    const comment = String(d.comment || '').trim();
    if (!documentName) loopar.throw('documentName is required');
    if (!comment) loopar.throw('Comment is required');
    if (comment.length > MAX_COMMENT_LEN) {
      loopar.throw(`Comment is too long (max ${MAX_COMMENT_LEN} characters)`);
    }

    const authedName = loopar.currentUser?.name;
    const isGuest = !authedName || authedName === 'Guest';
    if (ref.require_login_to_comment && isGuest) loopar.throw('Sign in to comment');

    const status = isGuest ? DOC_STATUS.PENDING : DOC_STATUS.APPROVED;
    const commentDocument = d.document === HISTORY_TABLE ? HISTORY_TABLE : target;

    const name = await loopar.comments.add({
      document: commentDocument,
      documentName,
      comment,
      parent: d.parent ? String(d.parent).trim() : null,
      status,
      guest_name: isGuest ? (String(d.guest_name || '').trim() || 'Anonymous') : null,
      guest_email: isGuest ? (String(d.guest_email || '').trim() || null) : null,
    });

    return { ok: true, name, pending: isGuest };
  }

  /**
   * Approve / change a comment's status. Desk-only (permission-gated, rejected
   * on the public web). Body: { name, status }
   */
  async actionModerate() {
    if (this.req?.__WORKSPACE_NAME__ === 'web') loopar.throw('Not allowed');

    const d = this.data || {};
    if (!d.name) loopar.throw('name is required');

    const doc = await loopar.getDocument(COMMENT_TABLE, d.name);
    if (!doc) loopar.throw(`Comment "${d.name}" not found`);

    doc.status = coerceDocStatus(d.status);
    await doc.save({ validate: false });
    // `status` is reserved in action responses (router reads it as the HTTP
    // code). Return the new moderation state under a non-reserved key.
    return { ok: true, name: d.name, newStatus: doc.status };
  }
}