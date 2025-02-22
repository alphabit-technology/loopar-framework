'use strict';
import { loopar } from "loopar";
import Connector from "./core/connector.js";

export default class DataBase extends Connector {
  tablePrefix = 'tbl';
  transaction = false;
  transactions = [];
  executionTimeInsertedIds = {};

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

  datatype(field) {
    const UNIQUE = [field.data.unique ? 'NOT NULL UNIQUE' : ''];

    const type = field.element === INPUT ? field.data.format : field.element;
    const dbType = (ELEMENT_DEFINITION(type, INPUT).type || [])[0];
    const hasDefault = field.data.default_value && this.dbFielTypeCanHaveDefaultValue((ELEMENT_DEFINITION(type, INPUT).type || [])[0]) && this.isValidDefaultValue(field.data.default_value, dbType);

    let defaultValue = field.data.default_value;

    /*if([DATE, DATETIME, TIME].includes(type) && default_value === 'CURRENT_TIMESTAMP') {
      default_value = 'CURRENT_TIMESTAMP';
    }*/

    const types = {}

    if ([DATE, DATE_TIME, TIME].includes(field.element)) {
      if (field.element === DATE) {
        defaultValue = loopar.utils.formatDate(defaultValue, 'YYYY-MM-DD');
      } else if (field.element === DATE_TIME) {
        defaultValue = loopar.utils.formatDateTime(defaultValue, 'YYYY-MM-DD HH:mm:ss');
      } else {
        defaultValue = loopar.utils.formatTime(defaultValue, 'HH:mm:ss');
      }
    }

    if (hasDefault) {
      types.defaultValue = defaultValue;
    }
    //const DEFAULT = hasDefault ? `DEFAULT '${defaultValue}'` : '';

    const dataType = (type) => {
      if (field.element === ID) {
        types.autoIncrement = true;
        types.primaryKey = true;
      }

      const types = [
        ...(ELEMENT_DEFINITION(type, INPUT).type || []),
        ...UNIQUE
      ].join(' ').split(' ').filter(e => e !== "");

      return [...new Set(types)].join(' ');
    }

    //const fieldType = dataType(type && type.toString().length > 0 ? type : field.element);
    //return `${loopar.utils.UPPERCASE(fieldType)} ${DEFAULT}`;
  }

  /**example() {
    const filter = {
      "=": {
        from_document: this.__ENTITY__.name,
        from_id: 8
      },
      "AND": {
        "=": {
          from_document: this.__ENTITY__.name,
          from_id: 8
        },
        "OR": {
          "BETWEEN": {
            to_document: ["a", "z"]
          },
          "IN": {
            to_document: ["a", "z"]
          },
          "LIKE": [
            ["to_document", "from_id"], "TEST"
          ]
        }
      }
    }

    return "WHERE(`from_document` = 'Menu' AND `from_id` = 8) AND ((`from_document` = 'Menu' AND `from_id` = 8) OR (to_document BETWEEN 'a' AND 'z' AND to_document IN('a', 'z') AND CONCAT(`to_document`, `from_id`) LIKE '%TEST%'))"
  }*///

  async WHERE_EAV(__CONDITIONS__ = null) {
    const WHERE = (__CONDITIONS__) => {
      return Object.entries(__CONDITIONS__ || {}).reduce((acc, [operand, DEF]) => {
        operand = this.getOperand(operand);

        if (['AND', 'OR'].includes(operand)) {
          const W = WHERE(DEF);
          if (W.length) {
            return [...acc, `(${W.join(` ${operand} `)})`];
          }
          return acc;
        } else {
          return [
            ...acc,
            ...Object.entries(DEF).map(([FIELD, VALUE]) => {
              if (!VALUE || (Array.isArray(VALUE) && VALUE.length === 0)) VALUE = [null];

              if (["IN", "NOT IN"].includes(operand)) {
                return `(field = ${this.escape(FIELD)} AND value ${operand} (${VALUE.map(v => this.escape(v)).join(',')}))`;
              } else if (["BETWEEN", "NOT BETWEEN"].includes(operand)) {
                return `(field = ${this.escape(FIELD)} AND value ${operand} ${VALUE.map(v => this.escape(v)).join(' AND ')})`;
              } else if (["LIKE", "NOT LIKE"].includes(operand)) {
                return `(field = ${this.escape(FIELD)} AND value ${operand} ${this.escape(`%${VALUE}%`)})`;
              } else if (["IS", "IS NOT"].includes(operand)) {
                return `(field = ${this.escape(FIELD)} AND value ${operand} ${this.escape(VALUE)})`;
              } else {
                return `(field = ${this.escape(FIELD)} AND LOWER(value) ${operand} LOWER(${this.escape(VALUE)}))`;
              }
            })
          ];
        }
      }, []);
    };

    const query = WHERE(__CONDITIONS__);

    return query.length
      ? `${query.join(' AND ')} GROUP BY document HAVING COUNT(document) = ${query.length}`
      : '';
  }

  async WHERE(__CONDITIONS__ = null, isSingle = false) {
    if (isSingle) return this.WHERE_EAV(__CONDITIONS__);

    const WHERE = (__CONDITIONS__) => {
      return Object.entries(__CONDITIONS__ || {}).reduce((acc, [operand, DEF]) => {
        operand = this.getOperand(operand);
        if (['AND', 'OR'].includes(operand)) {
          const W = WHERE(DEF);
          return [...acc, acc.length && W.length ? operand : null, ...W].filter(e => e);
        } else {
          if (["IN", "NOT IN", "BETWEEN", "NOT BETWEEN", "IS", "IS NOT", "LIKE", "NOT LIKE"].includes(operand)) {
            let [FIELD, VALUE] = Object.entries(DEF)[0];

            if (!VALUE || (Array.isArray(VALUE) && VALUE.length === 0)) VALUE = [null]

            if (["IN", "NOT IN"].includes(operand)) {
              return [...acc, `${FIELD} ${operand} (${VALUE.map(v => this.escape(v)).join(',')})`];
            } else if (["BETWEEN", "NOT BETWEEN"].includes(operand)) {
              return [...acc, `${FIELD} ${operand} ${VALUE.map(v => this.escape(v)).join(' AND ')}`];
            } else if (["LIKE", "NOT LIKE"].includes(operand)) {
              if (Array.isArray(DEF)) {
                const field = Array.isArray(DEF[0]) ? `CONCAT(${DEF[0].map(f => this.escapeId(f)).join(',')})` : this.escapeId(DEF[0]);
                return [...acc, `${field} ${operand} ${this.escape(`%${DEF[1]}%`)}`];
              } else {
                return [...acc, `${FIELD} ${operand} ${this.escape(`%${VALUE}%`)}`];
              }
            } else if (["IS", "IS NOT"].includes(operand)) {
              return [...acc, `${FIELD} ${operand} ${this.escape(VALUE)}`];
            }
          } else {
            const def = `${Object.entries(DEF).reduce((acc, [key, value]) => {
              return [...acc, `LOWER(${this.escapeId(key)}) ${operand} LOWER(${this.escape(value)})`];
            }, []).join(' AND ')}`;

            return def.length > 0 ? [...acc, `(${def})`] : acc;// [...acc, def.length > 0 ? `(${def})` : []];
          }
        }
      }, [])
    }
    const query = WHERE(__CONDITIONS__);
    return [query.length ? 'AND' : null, ...query].filter(e => e).join(' ');
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
      const values = []
      for (const field of Object.keys(data)) {
        values.push({
          name: document + '-' + field,
          document: document,
          field: field,
          value: data[field] || null,
          __document_status__: 'Active'
        });
      }

      await this.knex(this.literalTableName('Document Single Values')).insert(values).onConflict('name').merge();
    } else {
      const nextId = await this.nextId(document);
      const currentId = parseInt(data.id || 0);
      data.id = (currentId < nextId || !data.id) ? nextId : currentId;

      await this.knex(this.literalTableName(document)).insert(data);
    }
  }

  async maxId(document) {
    const maxId = await this.knex(this.literalTableName(document)).max('id', { as: 'max' });
    return maxId[0]?.max
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
      ...(typeof name === 'object' ? name : { '=': { name: name } }),
    };

    if (distinctToId) {
      condition.AND = {
        '!=': { id: distinctToId }
      }
    }

    const where = await this.WHERE(condition);

    return await this.knex(this.literalTableName(document)).whereRaw(`1=1 ${where}`).update({ [field]: value });
  }

  literalTableName(document) {
    return this.tableName(document).replace(/`/g, "");
  }

  async updateRow(document, data = {}, name) {
    data = this.getParseData(data);
    delete data.id;
    await this.knex(this.literalTableName(document)).where({ name }).update(data);
  }

  async deleteRow(document, name, sofDelete = true) {
    await this.knex(this.literalTableName(document)).where({ name }).del();
    /*if (sofDelete) {
      const newName = `${name}-${new Date().getTime()}`;
      await this.knex(this.literalTableName(document)).where({ name }).update({ __document_status__: 'Deleted', name: newName });
    } else {
      await this.knex(this.literalTableName(document)).where({ name }).del();
    }*/
  }

  tableName(document, likeParam = false) {
    const table = `${this.tablePrefix}${document}`;
    return likeParam ? this.escape(table) : this.escapeId(table);
  }

  makeColumns(fields, dbFields = {}, action = 'alter') {
    const getArsg = (args) => {
      return args.map(arg => {
        return typeof arg === 'string' ? `'${arg}'` : arg;
      }).join(',');
    }

    const existField = (name) => {
      return dbFields.some(f => f.name && name && (f.name.toLowerCase() == name.toLowerCase()));
    }

    return fields.reduce((acc, f) => {
      if (fieldIsWritable(f)) {
        const data = f.data;
        const def = [];
        let type = data.unique ? "string" : ELEMENT_DEFINITION(f.element).type;

        if (data.name == 'id' && action == 'create') {
          if (!this.dialect.includes('sqlite')) {
            type = 'increments';
          }
          /*if(!this.dialect.includes('sqlite')) {
            def.push({ fn: 'increments', args: [] });
          }*/
          def.push({ fn: 'primary', args: [] });
          def.push({ fn: 'unsigned', args: [] });
        }

        if (data.required) {
          def.push({ fn: 'notNullable', args: [] });
          if (data.default_value) {
            def.push({ fn: 'defaultTo', args: [data.default_value] });
          }
        }

        if (data.default_value && data.default_value.length > 0) {
          def.push({ fn: 'defaultTo', args: [data.default_value] });
        }

        if (data.unique && action == 'create') {
          def.push({ fn: 'unique', args: [] });
        }

        acc.push(`t.${type}('${data.name}'${data.unique ? ',255' : ''})${def.map(d => `.${d.fn}(${getArsg(d.args)})`).join('')}${existField(data.name) ? '.alter()' : ''}`);
      }

      if (f.elements) {
        acc.push(...this.makeColumns(f.elements, dbFields, action));
        //Object.assign(acc, this.makeColumns(f.elements || [], dbFields, action));
      }

      return acc;
    }, []);
  }

  async getValue(document, field, name, { distinctToId = null, ifNotFound = "throw", includeDeleted = false } = {}) {
    try {
      const condition = {
        ...(typeof name === 'object' ? name : { '=': { name: name } }),
      };

      if (distinctToId) {
        condition.AND = {
          '!=': { id: distinctToId }
        }
      }

      const result = await this.getDoc(document, condition, [field], { includeDeleted });

      return result ? typeof field === "object" ? result : result[field] : null;
    } catch (e) {
      if (ifNotFound === "throw") throw e;

      return ifNotFound;
    }
  }

  async getDoc(document, name, fields = ['*'], { includeDeleted = false } = {}) {
    const ref = typeof document === 'object' ? document.__REF__ : loopar.getRef(document);
    document = typeof document === 'object' ? document.name : document;
    document = document == "Document" ? "Entity" : document;

    return await this.getRow(document, name, fields, { isSingle: ref.is_single, includeDeleted });
  }

  async getRow(table, id, fields = ['*'], { isSingle = false, includeDeleted = false } = {}) {
    this.setPage(1);
    const row = await this.getList(table, fields, id ? typeof id == 'object' ? id : {
      '=': {
        'name': id
      }
    } : null, { isSingle, includeDeleted });

    return row.length ? row[0] : null;
  }

  async getList(document, fields = ['*'], condition = null, { isSingle = false, all = false, includeDeleted = false } = {}) {
    if (isSingle) {
      const result = await this.knex(this.literalTableName('Document Single Values'))
        .where({ document: document })
        .andWhereRaw(await this.WHERE(condition, isSingle))
        .select(["field", "value"]);
      return [result.reduce((acc, row) => ({ ...acc, [row.field]: row.value }), {})];
    } else {
      condition = await this.WHERE(condition);
      const sofDelete = includeDeleted ? "1=1" : "`__document_status__` <> 'Deleted'";

      if (!all) {
        const pagination = this.makePagination();
        const [PAGE, PAGE_SIZE] = [pagination.page, pagination.pageSize];
        const OFFSET = (PAGE - 1) * PAGE_SIZE;

        return await this.knex(this.literalTableName(document)).whereRaw(`${sofDelete} ${condition}`).select(fields).limit(PAGE_SIZE).offset(OFFSET);
      } else {
        return await this.knex(this.literalTableName(document)).whereRaw(`${sofDelete} ${condition}`).select(fields);
      }
    }
  }

  async getAll(document, fields = ['*'], condition = null, { isSingle = false } = {}) {
    return await this.getList(document, fields, condition, { isSingle, all: true });
  }

  async makeFields(fields = ['*']) {
    return fields.map(field => field === '*' ? field : this.escape(field)).join();
  }

  async hastEntity(document) {
    return await this.knex.schema.hasTable(this.literalTableName(document));
  }

  async count(document, condition) {
    if (!condition) return 0;
    document = document === "Document" ? "Entity" : document;
    condition = typeof condition === 'object' ? condition : { "=": { "name": condition } };

    const c = !loopar.installing ? {
      /*"!=": {
        //__document_status__: "Deleted",
      },*/
      AND: condition
    } : {
      AND: condition
    };

    /*if (param.field_value) {
      c.AND = {
        "=": {
          [param.field_name]: param.field_value
        },
        AND: condition
      }
    }*/

    const WHERE = await this.WHERE(c);
    const table = this.literalTableName(document);
    const r = await this.knex(table).count('id as count').where(this.knex.raw(`1=1 ${WHERE}`));
    return r[0].count || 0;
  }
}
