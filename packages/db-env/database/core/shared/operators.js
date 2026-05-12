'use strict';

/**
 * Loopar's operator symbols. Used as condition keys in business code:
 *
 *   { name: { [Op.like]: '%foo%' } }
 *   { id:   { [Op.in]: [1, 2, 3] } }
 *   { [Op.or]: [{ a: 1 }, { b: 2 }] }
 *
 * Why a propietary Op:
 *   - Decouples controllers / PermissionManager / base-document from the
 *     specific DB backend so the framework can swap engines without
 *     touching every caller.
 *   - These symbols are the stable, public API. Backends are swappable.
 *
 * Dispatch contract:
 *   - Each Symbol carries a stable description ('and', 'or', 'in', 'like',
 *     'ne', …). Backends MUST dispatch on Symbol.description (see
 *     knex/op-translator.js), never on Symbol identity.
 *   - This means a different copy of the symbol (e.g. from a duplicated
 *     module instance, or from legacy code that still has its own Op set)
 *     keeps working as long as the description matches.
 *
 * IMPORTANT: Do not rename the description strings — they're part of the
 * cross-backend contract.
 */
export const Op = Object.freeze({
  // Logical
  and: Symbol('and'),
  or:  Symbol('or'),
  not: Symbol('not'),

  // Equality
  eq:  Symbol('eq'),
  ne:  Symbol('ne'),

  // Ordering
  gt:  Symbol('gt'),
  gte: Symbol('gte'),
  lt:  Symbol('lt'),
  lte: Symbol('lte'),

  // Membership
  in: Symbol('in'),
  notIn: Symbol('notIn'),

  // Pattern matching
  like: Symbol('like'),
  notLike: Symbol('notLike'),
  iLike: Symbol('iLike'),    // case-insensitive — Postgres only
  notILike: Symbol('notILike'),

  // Null
  is: Symbol('is'),
  isNot: Symbol('isNot'),

  // Range
  between: Symbol('between'),
  notBetween: Symbol('notBetween'),
});

/**
 * Reverse lookup: description string → Op symbol from this module.
 * Lets a backend resolve "what loopar Op is this?" when it received a
 * symbol whose identity might not match (e.g. duplicated module, or a
 * symbol constructed elsewhere with the same description).
 */
export const opByDescription = Object.freeze(
  Object.fromEntries(
    Object.values(Op).map(sym => [sym.description, sym])
  )
);

/**
 * Cheap predicate: does this symbol look like a loopar Op?
 * Used by translators to skip over user-provided symbols they don't own.
 */
export function isOpSymbol(sym) {
  return typeof sym === 'symbol' && opByDescription[sym.description] !== undefined;
}
