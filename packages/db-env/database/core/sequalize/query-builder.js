import { Sequelize } from '@sequelize/core';

class SequelizeQueryBuilder {
  constructor(sequelize, tableName) {
    this.sequelize = sequelize;
    this.tableName = tableName;
    this.whereConditions = [];
    this.selectFields = ['*'];
    this.limitValue = null;
    this.offsetValue = null;
    this.orderByClause = '';
    this.groupByClause = '';
    this.havingConditions = [];
    this.joinClauses = [];
  }

  select(...fields) {
    if (fields.length === 0) {
      this.selectFields = ['*'];
    } else if (Array.isArray(fields[0])) {
      this.selectFields = fields[0];
    } else {
      this.selectFields = fields;
    }
    return this;
  }

  async delete() {
    const whereClause = this.buildWhereClause();
    
    if (!whereClause) {
      throw new Error('DELETE queries must have WHERE conditions for safety');
    }
    
    const query = `DELETE FROM ${this.escapeId(this.tableName)} ${whereClause}`;
    
    const result = await this.sequelize.query(query, {
      type: Sequelize.QueryTypes.DELETE,
      transaction: this.transaction
    });
    
    return result;
  }

  where(conditions, operator = '=') {
    if (typeof conditions === 'object' && conditions !== null) {
      Object.entries(conditions).forEach(([key, value]) => {
        this.whereConditions.push({
          field: key,
          operator: operator,
          value: value,
          connector: this.whereConditions.length === 0 ? '' : 'AND'
        });
      });
    } else if (typeof conditions === 'string') {
      this.whereConditions.push({
        raw: conditions,
        connector: this.whereConditions.length === 0 ? '' : 'AND'
      });
    }
    return this;
  }

  orWhere(conditions, operator = '=') {
    if (typeof conditions === 'object' && conditions !== null) {
      Object.entries(conditions).forEach(([key, value]) => {
        this.whereConditions.push({
          field: key,
          operator: operator,
          value: value,
          connector: 'OR'
        });
      });
    } else if (typeof conditions === 'string') {
      this.whereConditions.push({
        raw: conditions,
        connector: 'OR'
      });
    }
    return this;
  }

  andWhere(conditions, operator = '=') {
    return this.where(conditions, operator);
  }

  whereIn(field, values) {
    this.whereConditions.push({
      field: field,
      operator: 'IN',
      value: values,
      connector: this.whereConditions.length === 0 ? '' : 'AND'
    });
    return this;
  }

  orWhereIn(field, values) {
    this.whereConditions.push({
      field: field,
      operator: 'IN',
      value: values,
      connector: 'OR'
    });
    return this;
  }

  whereNotIn(field, values) {
    this.whereConditions.push({
      field: field,
      operator: 'NOT IN',
      value: values,
      connector: this.whereConditions.length === 0 ? '' : 'AND'
    });
    return this;
  }

  whereBetween(field, values) {
    this.whereConditions.push({
      field: field,
      operator: 'BETWEEN',
      value: values,
      connector: this.whereConditions.length === 0 ? '' : 'AND'
    });
    return this;
  }

  whereLike(field, value) {
    this.whereConditions.push({
      field: field,
      operator: 'LIKE',
      value: `%${value}%`,
      connector: this.whereConditions.length === 0 ? '' : 'AND'
    });
    return this;
  }

  orWhereLike(field, value) {
    this.whereConditions.push({
      field: field,
      operator: 'LIKE',
      value: `%${value}%`,
      connector: 'OR'
    });
    return this;
  }

  whereNull(field) {
    this.whereConditions.push({
      field: field,
      operator: 'IS',
      value: null,
      connector: this.whereConditions.length === 0 ? '' : 'AND'
    });
    return this;
  }

  whereNotNull(field) {
    this.whereConditions.push({
      field: field,
      operator: 'IS NOT',
      value: null,
      connector: this.whereConditions.length === 0 ? '' : 'AND'
    });
    return this;
  }

  whereGt(field, value) {
    return this.where({ [field]: value }, '>');
  }

  whereGte(field, value) {
    return this.where({ [field]: value }, '>=');
  }

  whereLt(field, value) {
    return this.where({ [field]: value }, '<');
  }

  whereLte(field, value) {
    return this.where({ [field]: value }, '<=');
  }

  whereNot(field, value) {
    return this.where({ [field]: value }, '!=');
  }

  orderBy(field, direction = 'ASC') {
    this.orderByClause = `ORDER BY \`${field}\` ${direction.toUpperCase()}`;
    return this;
  }

  groupBy(...fields) {
    this.groupByClause = `GROUP BY ${fields.map(f => `\`${f}\``).join(', ')}`;
    return this;
  }

  having(conditions) {
    if (typeof conditions === 'object') {
      Object.entries(conditions).forEach(([key, value]) => {
        this.havingConditions.push({
          field: key,
          operator: '=',
          value: value,
          connector: this.havingConditions.length === 0 ? '' : 'AND'
        });
      });
    }
    return this;
  }

  limit(count) {
    this.limitValue = count;
    return this;
  }

  offset(count) {
    this.offsetValue = count;
    return this;
  }

  join(table, firstColumn, operator, secondColumn) {
    this.joinClauses.push(`INNER JOIN ${table} ON ${firstColumn} ${operator} ${secondColumn}`);
    return this;
  }

  leftJoin(table, firstColumn, operator, secondColumn) {
    this.joinClauses.push(`LEFT JOIN ${table} ON ${firstColumn} ${operator} ${secondColumn}`);
    return this;
  }

  rightJoin(table, firstColumn, operator, secondColumn) {
    this.joinClauses.push(`RIGHT JOIN ${table} ON ${firstColumn} ${operator} ${secondColumn}`);
    return this;
  }

  escape(value) {
    return this.sequelize.escape(value);
  }

  escapeId(identifier) {
    return `\`${identifier}\``;
  }

  buildWhereClause() {
    if (this.whereConditions.length === 0) return '';

    const conditions = this.whereConditions.map((condition, index) => {
      let clause = '';
      
      if (index > 0 && condition.connector) {
        clause += ` ${condition.connector} `;
      }

      if (condition.raw) {
        clause += condition.raw;
      } else {
        const field = this.escapeId(condition.field);
        
        switch (condition.operator) {
          case 'IN':
          case 'NOT IN':
            const values = condition.value.map(v => this.escape(v)).join(', ');
            clause += `${field} ${condition.operator} (${values})`;
            break;
          case 'BETWEEN':
            clause += `${field} BETWEEN ${this.escape(condition.value[0])} AND ${this.escape(condition.value[1])}`;
            break;
          case 'IS':
          case 'IS NOT':
            clause += `${field} ${condition.operator} ${condition.value === null ? 'NULL' : this.escape(condition.value)}`;
            break;
          default:
            clause += `${field} ${condition.operator} ${this.escape(condition.value)}`;
        }
      }
      
      return clause;
    });

    return `WHERE ${conditions.join('')}`;
  }

  buildHavingClause() {
    if (this.havingConditions.length === 0) return '';

    const conditions = this.havingConditions.map((condition, index) => {
      let clause = '';
      
      if (index > 0 && condition.connector) {
        clause += ` ${condition.connector} `;
      }

      const field = this.escapeId(condition.field);
      clause += `${field} ${condition.operator} ${this.escape(condition.value)}`;
      
      return clause;
    });

    return `HAVING ${conditions.join('')}`;
  }

  buildQuery() {
    const fields = this.selectFields.map(f => f === '*' ? '*' : this.escapeId(f)).join(', ');
    let query = `SELECT ${fields} FROM ${this.escapeId(this.tableName)}`;

    if (this.joinClauses.length > 0) {
      query += ` ${this.joinClauses.join(' ')}`;
    }

    const whereClause = this.buildWhereClause();
    if (whereClause) {
      query += ` ${whereClause}`;
    }

    if (this.groupByClause) {
      query += ` ${this.groupByClause}`;
    }

    const havingClause = this.buildHavingClause();
    if (havingClause) {
      query += ` ${havingClause}`;
    }

    if (this.orderByClause) {
      query += ` ${this.orderByClause}`;
    }

    if (this.limitValue !== null) {
      query += ` LIMIT ${this.limitValue}`;
    }

    if (this.offsetValue !== null) {
      query += ` OFFSET ${this.offsetValue}`;
    }

    return query;
  }

  async get() {
    const query = this.buildQuery();
    const results = await this.sequelize.query(query, {
      type: Sequelize.QueryTypes.SELECT
    });
    return results;
  }

  async first() {
    this.limit(1);
    const results = await this.get();
    return results[0] || null;
  }

  async count(field = '*') {
    const query = `SELECT COUNT(${field === '*' ? '*' : this.escapeId(field)}) as count FROM ${this.escapeId(this.tableName)}`;
    let countQuery = query;

    const whereClause = this.buildWhereClause();
    if (whereClause) {
      countQuery += ` ${whereClause}`;
    }

    const results = await this.sequelize.query(countQuery, {
      type: Sequelize.QueryTypes.SELECT
    });
    
    return parseInt(results[0]?.count || 0);
  }

  toSQL() {
    return this.buildQuery();
  }

  clone() {
    const cloned = new SequelizeQueryBuilder(this.sequelize, this.tableName);
    cloned.whereConditions = [...this.whereConditions];
    cloned.selectFields = [...this.selectFields];
    cloned.limitValue = this.limitValue;
    cloned.offsetValue = this.offsetValue;
    cloned.orderByClause = this.orderByClause;
    cloned.groupByClause = this.groupByClause;
    cloned.havingConditions = [...this.havingConditions];
    cloned.joinClauses = [...this.joinClauses];
    return cloned;
  }
}

export class SequelizeQueryManager {
  constructor(sequelize) {
    this.sequelize = sequelize;
  }

  table(tableName) {
    return new SequelizeQueryBuilder(this.sequelize, tableName);
  }

  from(tableName) {
    return this.table(tableName);
  }
}

// Example usage:
/*
// Create a Sequelize instance (replace with your actual DB config)
const queryManager = new SequelizeQueryManager(sequelize);

// Example: Fetch a user by name or email
const user = await queryManager.table('tblUser')
  .where({ name: user_id })
  .orWhere({ email: user_id })
  .select('name', 'email', 'password', 'disabled', 'profile_picture')
  .first();

// Example: Fetch multiple users with conditions
const users = await queryManager.table('tblUser')
  .where({ status: 'active' })
  .andWhere({ role: 'admin' })
  .orWhere({ role: 'superadmin' })
  .whereIn('department', ['IT', 'HR', 'Finance'])
  .whereLike('name', 'John')
  .orderBy('created_at', 'DESC')
  .limit(10)
  .get();

const count = await queryManager.table('tblUser')
  .where({ status: 'active' })
  .count();
*/

export default SequelizeQueryBuilder;