'use strict';
import { loopar, parseDocument } from "loopar";
import { Sequelize, Op} from '@sequelize/core';
import Connector from "./core/sequelize/connector.js";

function whereToSqlString(sequelize, whereObj, model = null) {
  try {
    const queryGenerator = sequelize.queryInterface.queryGenerator;
    const options = model ? { model } : {};
    const whereClause = queryGenerator.whereItemsQuery(whereObj, options);
    
    return whereClause;
  } catch (error) {
    console.error(["Error generating SQL WHERE clause:", error, whereObj]);
    return null;
  }
}

export class SequelizeORM extends Connector {
  tablePrefix = 'tbl';
  transaction = null;
  transactionActive = false;
  executionTimeInsertedIds = {}

  dbFielTypeCanHaveDefaultValue(fieldType) {
    return ['varchar', 'text', 'int', 'bigint', 'tinyint', 'smallint', 'mediumint', 'float', 'double', 'decimal', 'date', 'datetime', 'timestamp', 'time', 'year'].includes(fieldType);
  }

  isValidDefaultValue(value, type) {
    if (value === null) return true;

    switch (type) {
      case 'int':
      case 'bigint':
      case 'tinyint':
      case 'smallint':
      case 'mediumint':
        return !isNaN(value);
      case 'float':
      case 'double':
      case 'decimal':
        return !isNaN(value);
      case 'date':
      case 'datetime':
      case 'timestamp':
      case 'time':
      case 'year':
        return !isNaN(Date.parse(value));
      default:
        return true;
    }
  }

  async WHERE(__CONDITIONS__ = null, isSingle = false) {
    return whereToSqlString(this.sequelize, __CONDITIONS__) || '';
  }

  makePagination() {
    return this.pagination || {
      page: 1,
      pageSize: 5,
      totalPages: 4,
      totalRecords: 1,
      sortBy: "id",
      sortOrder: "asc"
    };
  }

  setPage(page) {
    this.pagination ? this.pagination.page = page : this.makePagination();
  }

  getParseData(data) {
    return Object.entries(data).reduce((acc, [key, value]) => {
      value ??= null;
      typeof value === 'object' && (value = JSON.stringify(value));

      if (typeof value == 'string') {
        value = { 'null': null, 'true': true, 'false': true, 'undefined': true }[value] || value;
      }

      acc[key] = value;
      return acc;
    }, {});
  }

  async insertRow(document, data = {}, isSingle = false) {
    data = this.getParseData(data);

    if (isSingle) {
      const values = [];
      for (const field of Object.keys(data)) {
        values.push({
          name: document + '-' + field,
          document: document,
          field: field,
          value: data[field] || null,
          __document_status__: 'Active'
        });
      }

      for (const value of values) {
        const fields = Object.keys(value);
        const placeholders = fields.map(() => '?').join(', ');
        const values_array = Object.values(value);
        
        if (this.dialect.includes('mysql')) {
          const updateClause = fields.filter(f => f !== 'name').map(f => `${f} = VALUES(${f})`).join(', ');
          const query = `INSERT INTO ${this.tableName('Document Single Values')} 
                         (${fields.join(', ')}) VALUES (${placeholders}) 
                         ON DUPLICATE KEY UPDATE ${updateClause}`;
          
          await this.sequelize.query(query, {
            replacements: values_array,
            type: Sequelize.QueryTypes.INSERT,
            transaction: this.transaction
          });
        } else {
          const query = `INSERT OR REPLACE INTO ${this.tableName('Document Single Values')} 
                         (${fields.join(', ')}) VALUES (${placeholders})`;
          
          await this.sequelize.query(query, {
            replacements: values_array,
            type: Sequelize.QueryTypes.INSERT,
            transaction: this.transaction
          });
        }
      }
    } else {
      const nextId = parseInt(await this.nextId(document)) || 1;
      const currentId = parseInt(data.id) || 0;
      data.id = (currentId && currentId >= nextId) ? currentId : nextId;

      const fields = Object.keys(data);
      const placeholders = fields.map(() => '?').join(', ');
      const valuesArray = Object.values(data);
      
      const query = `INSERT INTO ${this.tableName(document)} (${fields.join(', ')}) VALUES (${placeholders})`;
      
      await this.sequelize.query(query, {
        replacements: valuesArray,
        type: Sequelize.QueryTypes.INSERT,
        transaction: this.transaction
      });
    }
  }

  async maxId(document) {
    const query = `SELECT MAX(id) as max FROM ${this.tableName(document)}`;
    const result = await this.sequelize.query(query, {
      type: Sequelize.QueryTypes.SELECT
    });
    return result[0]?.max || 0;
  }

  async nextId(document) {
    const maxId = await this.maxId(document);
    const executionTimeInsertedIds = this.executionTimeInsertedIds[document] || 0;

    if (executionTimeInsertedIds < maxId) {
      this.executionTimeInsertedIds[document] = maxId + 1;
    } else {
      this.executionTimeInsertedIds[document] += 1;
    }

    return this.executionTimeInsertedIds[document];
  }

  async setValue(document, field, value, name, { distinctToId = null, ifNotFound = "throw" } = {}) {
    return await this.#setValueTo(document, field, value, name, { distinctToId, ifNotFound });
  }

  async #setValueTo(document, field, value, name, { distinctToId = null, ifNotFound = "throw" } = {}) {
    const condition = {
      ...(typeof name === 'object' ? name : { name: name }),
    };

    if (distinctToId) {
      condition[Op.and] = [
        condition,
        { id: { [Op.ne]: distinctToId } }
      ];
    }

    const where = await this.WHERE(condition);
    const query = `UPDATE ${this.tableName(document)} SET ${this.escapeId(field)} = ? WHERE ${where}`;

    await this.sequelize.query(query, {
      replacements: [value],
      type: Sequelize.QueryTypes.UPDATE,
      transaction: this.transaction
    });
  }

  literalTableName(document) {
    return this.tableName(document).replace(/`/g, "");
  }

  async updateRow(document, data = {}, name) {
    data = this.getParseData(data);
    delete data.id;
    
    const fields = Object.keys(data);
    const setClause = fields.map(field => `${this.escapeId(field)} = ?`).join(', ');
    const values = [...Object.values(data), name];
    
    const query = `UPDATE ${this.tableName(document)} SET ${setClause} WHERE name = ?`;
    
    await this.sequelize.query(query, {
      replacements: values,
      type: Sequelize.QueryTypes.UPDATE,
      transaction: this.transaction
    });
  }

  async deleteRow(document, name, sofDelete = true) {
    const query = `DELETE FROM ${this.tableName(document)} WHERE name = ?`;
    
    await this.sequelize.query(query, {
      replacements: [name],
      type: Sequelize.QueryTypes.DELETE,
      transaction: this.transaction
    });
  }

  tableName(document, likeParam = false) {
    const table = `${this.tablePrefix}${document}`;
    return likeParam ? this.escape(table) : this.escapeId(table);
  }

  async getValue(document, field, name, { distinctToId = null, ifNotFound = "throw", includeDeleted = false } = {}) {
    try {
      const condition = {
        ...(typeof name === 'object' ? name : name ? { name: name } : {}),
      };

      if(distinctToId){
        condition['id'] = { [Op.ne]: distinctToId };
      }

      const result = await this.getDoc(document, condition, [field], { includeDeleted });

      return result ? typeof field === "object" ? result : result[field] : null;
    } catch (e) {
      if (ifNotFound === "throw") throw e;

      return ifNotFound;
    }
  }

  async getParseDoc(){
    return parseDocument(arguments[0], await this.getDoc(...arguments));
  }

  async getDoc(document, name, fields = ['*'], { includeDeleted = false } = {}) {
    const ref = typeof document === 'object' ? document.__REF__ : loopar.getRef(document);
    document = typeof document === 'object' ? document.name : document;
    document = document == "Document" ? "Entity" : document;

    fields = fields[0] === '*' ? ref.__FIELDS__ : fields.filter(field => ref.__FIELDS__.includes(field));

    return await this.getRow(document, name, fields, { isSingle: ref.is_single, includeDeleted });
  }

  async getRow(table, id, fields = ['*'], { isSingle = false, includeDeleted = false } = {}) {
    this.setPage(1);
    const row = await this.getList(table, fields, id ? typeof id == 'object' ? id : {'name': id} : {}, { isSingle, includeDeleted });
    return row.length ? row[0] : null;
  }

  async getDocEAV(document, fields = ['*'], condition = null, { includeDeleted = false } = {}) {
    let replacements = [document];
    const documentFilterConditions = [];
      
    if (condition && Object.keys(condition).length > 0) {
      for (const [fieldName, fieldValue] of Object.entries(condition)) {
        if (fieldName === '__document_status__') continue;
        
        if (typeof fieldValue === 'object' && fieldValue !== null) {
          const operator = Object.keys(fieldValue)[0];
          const value = fieldValue[operator];
          
          switch(operator) {
            case Op.ne:
              documentFilterConditions.push(`
                EXISTS (
                  SELECT 1 FROM ${this.tableName('Document Single Values')} sub
                  WHERE sub.document = main.document 
                  AND sub.field = ? 
                  AND sub.value != ?
                )
              `);
              replacements.push(fieldName, value);
              break;
            case Op.like:
              documentFilterConditions.push(`
                EXISTS (
                  SELECT 1 FROM ${this.tableName('Document Single Values')} sub
                  WHERE sub.document = main.document 
                  AND sub.field = ? 
                  AND sub.value LIKE ?
                )
              `);
              replacements.push(fieldName, value);
              break;
            case Op.in:
              const placeholders = value.map(() => '?').join(',');
              documentFilterConditions.push(`
                EXISTS (
                  SELECT 1 FROM ${this.tableName('Document Single Values')} sub
                  WHERE sub.document = main.document 
                  AND sub.field = ? 
                  AND sub.value IN (${placeholders})
                )
              `);
              replacements.push(fieldName, ...value);
              break;
            default:
              documentFilterConditions.push(`
                EXISTS (
                  SELECT 1 FROM ${this.tableName('Document Single Values')} sub
                  WHERE sub.document = main.document 
                  AND sub.field = ? 
                  AND sub.value = ?
                )
              `);
              replacements.push(fieldName, value);
          }
        } else {
          documentFilterConditions.push(`
            EXISTS (
              SELECT 1 FROM ${this.tableName('Document Single Values')} sub
              WHERE sub.document = main.document 
              AND sub.field = ? 
              AND sub.value = ?
            )
          `);
          replacements.push(fieldName, fieldValue);
        }
      }
    }
    
    if (!includeDeleted) {
      documentFilterConditions.push(`
        NOT EXISTS (
          SELECT 1 FROM ${this.tableName('Document Single Values')} sub
          WHERE sub.document = main.document 
          AND sub.field = ? 
          AND sub.value = ?
        )
      `);
      replacements.push('__document_status__', 'Deleted');
    }
    
    let whereClause = 'document = ?';
    
    if (documentFilterConditions.length > 0) {
      whereClause += ' AND ' + documentFilterConditions.join(' AND ');
    }
    
    if (fields[0] !== '*') {
      const fieldPlaceholders = fields.map(() => '?').join(',');
      whereClause += ` AND field IN (${fieldPlaceholders})`;
      replacements.push(...fields);
    }
    
    const query = `SELECT field, value FROM ${this.tableName('Document Single Values')} main
                    WHERE ${whereClause}`;
    
    const result = await this.sequelize.query(query, {
      replacements,
      type: Sequelize.QueryTypes.SELECT
    });
    
    const reconstructed = result.reduce((acc, row) => ({ ...acc, [row.field]: row.value }), {});
    
    if (fields[0] !== '*') {
      const completeObject = {};
      fields.forEach(field => {
        completeObject[field] = reconstructed[field] !== undefined ? reconstructed[field] : null;
      });
      return [completeObject];
    }
    
    return [reconstructed];
  }
  
  async getList(document, fields = ['*'], condition=null, { isSingle = false, all = false, includeDeleted = false } = {}) {
    if (isSingle) {
      return await this.getDocEAV(document, fields, condition, { includeDeleted });
    } else {
      if (!includeDeleted) {
        condition = {
          __document_status__: { [Op.ne]: 'Deleted' },
          ...(condition ? { [Op.and]: condition } : {})
        }
      }
      const whereCondition = await this.WHERE(condition || {});
      const fieldList = fields.join(', ');
      
      if (!all) {
        const pagination = this.makePagination();
        const [PAGE, PAGE_SIZE] = [pagination.page, pagination.pageSize];
        const OFFSET = (PAGE - 1) * PAGE_SIZE;
        const whereCond = whereCondition ? `WHERE ${whereCondition}` : '';
        const query = `SELECT ${fieldList} FROM ${this.tableName(document)} ${whereCond} LIMIT ? OFFSET ?`;

        return await this.sequelize.query(query, {
          replacements: [PAGE_SIZE, OFFSET],
          type: Sequelize.QueryTypes.SELECT
        });
      } else {
        const whereCond = whereCondition ? `WHERE ${whereCondition}` : '';
        const query = `SELECT ${fieldList} FROM ${this.tableName(document)} ${whereCond}`;
        
        return await this.sequelize.query(query, {
          type: Sequelize.QueryTypes.SELECT
        });
      }
    }
  }

  async getAll(document, fields = ['*'], condition = null, { isSingle = false } = {}) {
    return await this.getList(document, fields, condition, { isSingle, all: true });
  }

  async makeFields(fields = ['*']) {
    return fields.map(field => field === '*' ? field : this.escapeId(field)).join(', ');
  }

  async hasEntity(constructor, document) {
    if(!constructor){
      const ref = loopar.getRef(document);
      constructor = ref?.__REF__?.name || "Entity";
    }
    return await this.count(constructor, { name: document }) > 0;
  }

  async count(document, condition) {
    if (!condition) return 0;
    document = document === "Document" ? "Entity" : document;
    condition = typeof condition === 'object' ? condition : {name: condition};

    /* const c = !loopar.installing ? {
      AND: condition
    } : {
      AND: condition
    }; */

    const WHERE = await this.WHERE(condition);
    const table = this.tableName(document);
    const query = `SELECT COUNT(id) as count FROM ${table} ${WHERE ? `WHERE ${WHERE}` : ''}`;
    
    const result = await this.sequelize.query(query, {
      type: Sequelize.QueryTypes.SELECT
    });
    
    return result[0]?.count || 0;
  }
}