import loopar from "loopar";
import {BaseTable} from "@base-table"
import {Link} from "@link";

import {
  Avatar,
  AvatarFallback
} from "@/components/ui/avatar"

export class ListGrid extends BaseTable {
  isWritable = false;
  hasFooterOptions = false;
  hasHeaderOptions = false;
  hasPagination = true;
  gridSize = "lg";
  overflow = "auto";
  hasSearchForm = true;

  style = { height: "100%" };

  constructor(props) {
    super(props);
  }

  getDocumentTitle(row){
    const titleFields = this.meta.__ENTITY__.title_fields?.split(",");

    if(titleFields){
      return titleFields.map((field) => row[field]).join(" ");
    }

    return row.name;
  }

  get mappedColumns() {
    const base = super.mappedColumns.filter((col) => col.data.name !== "name");
    //const titleDocument = this.meta.__ENTITY__.title_fields;

    //console.log(["mappedColumns", this.meta])

    const customName = [
      {
        rowsProps: { className: "align-middle text-truncate" },
        isCustom: true,
        data: {
          name: "name",
          label: "Name",
          value: (row) => {
            const color = loopar.bgColor(row.name);
            return (
              <Link
                to={`update?name=${row.name}`}
                className="justify-left flex gap-3 align-middle"
              >
                <Avatar className={`rounded-3 h-11 w-11`} style={{ backgroundColor: color }}>
                  <AvatarFallback className={`bg-transparent text-xl font-bold`}>{loopar.utils.avatar(row.name)}</AvatarFallback>
                </Avatar>
                <div className="h-ful items-left flex flex-col justify-center">
                  <h2>{row.name}</h2>
                  <h5 className='font-bold text-slate-500 dark:text-slate-400'>{loopar.utils.UPPERCASE(this.getDocumentTitle(row))}</h5>
                </div>
              </Link>
            );
          },
        },
      },
    ];

    base.splice(0, 0, ...customName);

    return base;
  }

  deleteRow = (row) => {
    loopar.confirm(`Are you sure you want to delete ${row.name}?`, () => {
      loopar.method(this.meta.__ENTITY__.name, "delete", {
        name: row.name,
      });
    });
  };

  bulkRemove() {
    const rowsSelected = this.selectedRows;

    loopar.confirm(`Are you sure you want to delete ${rowsSelected.join(", ")} documents?`, () => {
      loopar.method(this.meta.__ENTITY__.name, "bulkDelete", {
        names: JSON.stringify(rowsSelected),
      });
      //this.search();
    });
  }
}
