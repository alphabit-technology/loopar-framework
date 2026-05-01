import { BaseController, loopar } from 'loopar';
import { pluralize } from 'inflection';

const getTypes = () => Object.values(loopar.getTypes()).reduce((acc, type) => {
  acc.push({
    name: type.__NAME__,
    label: pluralize(type.__BUILD__ || type.__ENTITY__)
  });
  return acc;
}, []);

export default class EntityController extends BaseController {
  constructor(props) {
    super(props);
  }

  async actionBulkDelete() {
    loopar.throw("You can't delete Entities in bulk");
  }

  async actionSetTailwind() {
    if (this.hasData()) {
      const { to_element, classes } = this.data;

      loopar.setTailwindTemp(to_element, decodeURIComponent(classes || ""));

      return this.success("Tailwind set successfully");
    } else {
      return this.error("No data provided");
    }
  }

  async actionList() {
    if (this.hasData()) {
      await loopar.session.set(this.document + '_q', this.data.q || {});
      await loopar.session.set(this.document + '_page', this.data.page || 1);
    }

    const data = Object.entries({ ...loopar.session.get(this.document + '_q') || {} }).reduce((acc, [key, value]) => {
      if (value && (value.toString()).length > 0 && value !== 0) {
        acc[key] = `${value}`;
      }
      return acc;
    }, {});

    const list = await loopar.getList(this.document, { data, q: (data && Object.keys(data).length > 0) ? data : null });

    const rows = list.rows.map(row => {
      const ref = loopar.getRef(row.name);
      return {
        ...row,
        is_single: ref?.is_single || 0,
        type: ref?.__ENTITY__ || "Entity",
      };
    });

    if(this.hasData()) {
      return {
        rows: rows,
        pagination: list.pagination,
        q: data,
      }
    }

    list.rows = rows;

    return await this.render(list);
  }

  async actionOrphanColumns(){
    return await loopar.db.getOrphanColumns(this.name);
  }

  async actionReleaseColumn()  { return await loopar.db.releaseOrphanColumn(this.name, this.column); }
  async actionDropColumn() { 
    return await loopar.db.dropOrphanColumn(this.name, this.column); 
  }
  async actionRestoreColumn()  { return await loopar.db.restoreOrphanColumn(this.name, this.column); }
}