import loopar from "$loopar";
import {BaseTable} from "@base-table"
import {Link} from "$link";

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
    const titleFields = this.meta.__DOCTYPE__.title_fields?.split(",");

    if(titleFields){
      return titleFields.map((field) => row[field]).join(" ");
    }

    return row.name;
  }

  get mappedColumns() {
    const base = super.mappedColumns.filter((col) => col.data.name !== "name");
    const titleDocument = this.meta.__DOCTYPE__.title_fields;

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
                to={`update?documentName=${row.name}`}
                className="justify-left flex gap-3 align-middle"
              >
                <Avatar className={`rounded-3 h-11 w-11`} style={{ backgroundColor: color }}>
                  <AvatarFallback className={`bg-transparent text-xl font-bold`}>{loopar.utils.avatar(row.name)}</AvatarFallback>
                </Avatar>
                <div className="h-ful items-left flex flex-col justify-center">
                  <h1>{row.name}</h1>
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
    loopar.dialog({
      type: "confirm",
      title: "Confirm",
      message: `Are you sure you want to delete ${row.name}?`,
      ok: async () => {
        await loopar.method(this.meta.__DOCTYPE__.name, "delete", {
          documentName: row.name,
        });

        loopar.rootApp.refresh().then(() => {
          loopar.navigate(window.location.pathname);
        });

        loopar.notify({
          type: "success",
          title: "Success",
          message: `Document ${row.name} deleted`,
        });
      },
    });
  };

  bulkRemove() {
    const rowsSelected = this.selectedRows;

    loopar.confirm(
      `Are you sure you want to delete ${rowsSelected.join(", ")} documents?`,
      async () => {
        await loopar.method(this.meta.__DOCTYPE__.name, "bulkDelete", {
          documentNames: JSON.stringify(rowsSelected),
        });
        this.search();
      }
    );
  }
}
