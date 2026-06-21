'use strict';

import { BaseDocument, loopar } from 'loopar';

const COMMENT_TABLE = 'Comment';
const PAGE_SIZE = 10;

/**
 * Virtual entity — no table of its own. A moderation view over the `Comment`
 * entity, surfacing every comment (all statuses) across the whole site so an
 * admin can approve / reject from one place.
 *
 * Same pattern as File Manager: override getList, pull rows from a custom
 * source, paginate, return the standard list shape. Moderation reuses the
 * inherited BaseController.actionModerate (operates on Comment by name — the
 * rows here ARE Comment rows, so the switch just works).
 */
export default class CommentManage extends BaseDocument {
  constructor(props) {
    super(props);
  }

  #applyScope(qb, q) {
    const term = q && (q.q || q.comment || q.document_name || q.author || q.name);
    if (term) {
      const like = `%${String(term).trim()}%`;
      qb.where((b) => {
        b.where('comment', 'like', like)
          .orWhere('document_name', 'like', like)
          .orWhere('document', 'like', like)
          .orWhere('user', 'like', like)
          .orWhere('guest_name', 'like', like);
      });
    }
    return qb;
  }

  async getList({ fields = null, q = null, rowsOnly = false } = {}) {
    const entityName = this.__ENTITY__.name;
    const page = parseInt(loopar.session.get(entityName + '_page')) || 1;

    const totalRow = await this.#applyScope(loopar.db.qx()(COMMENT_TABLE), q)
      .count({ count: 'id' })
      .first();
    const totalRecords = Number(totalRow?.count || 0);
    const totalPages = Math.max(1, Math.ceil(totalRecords / PAGE_SIZE));

    const safePage = page > totalPages ? 1 : page;
    if (safePage !== page) loopar.session.set(entityName + '_page', safePage);

    const raw = await this.#applyScope(loopar.db.qx()(COMMENT_TABLE), q)
      .select(['name', 'user', 'guest_name', 'comment', 'document', 'document_name', 'parent', 'status', 'created_at'])
      .orderBy('created_at', 'desc')
      .limit(PAGE_SIZE)
      .offset((safePage - 1) * PAGE_SIZE);

    const rows = raw.map((r) => ({
      name: r.name,                       // Comment row id — used to moderate
      author: r.user || r.guest_name || 'Guest',
      comment: r.comment,
      document: r.document,
      document_name: r.document_name,
      parent: r.parent || null,
      event_at: r.created_at,
      status: r.status,
    }));

    const pagination = {
      page: safePage,
      pageSize: PAGE_SIZE,
      totalPages,
      totalRecords,
      sortBy: 'created_at',
      sortOrder: 'desc',
      __ENTITY__: entityName,
    };

    return Object.assign((rowsOnly ? {} : await this.__meta__()), {
      labels: this.getFieldListLabels(),
      fields: fields || this.getFieldListNames(),
      rows,
      pagination,
      q,
    });
  }
}