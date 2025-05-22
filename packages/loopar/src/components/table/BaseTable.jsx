import { useTable } from "./TableContext";
import { Pagination } from "@pagination";
import loopar from "loopar";
import { Link } from "@link";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
} from "@cn/components/ui/card";

import { Avatar, AvatarFallback } from "@cn/components/ui/avatar";
import { Button } from "@cn/components/ui/button";
import { Badge } from "@cn/components/ui/badge";
import {SimpleTable} from "./SimpleTable";
import { EmptyTable } from "./EmptyTable";

import {
  PencilIcon,
  Trash2Icon,
} from "lucide-react";

function BaseTable(props) {
  const {
    meta,
    selectedRows,
    selectRow,
    deleteRow,
    search,
    setMeta,
    docRef,
    tableId
  } = useTable();

  const rows = props.rows || useTable().rows || [];

  const hasSearchForm = !!props.hasSearchForm;
  const viewType =
    (props.viewType === "List" && docRef.onlyGrid !== true) || props.isEditable
      ? "List"
      : "Grid";

  const renderTable = () => {
    return (
      <SimpleTable
        rows={rows}
        columns={props.columns}
        footer={props.footer}
        rowTemplate={props.rowTemplate}
      />
    )
  };

  const renderGrid = () => {
    const defaultAction = (row) => {
      if (["Entity", "Builder"].includes(row.type || "")) {
        return row.is_single ? "update" : "list";
      }
      if (["Page Builder", "View Builder"].includes(row.type)) return "view";
      return "";
    };

    if (rows.length === 0){
      return (
        <EmptyTable>No items to Show</EmptyTable>
      )
    }

    return (
      <div className="flex flex-wrap gap-3 border p-2">
        {rows.map((row) => {
          const action = defaultAction(row);
          const color = loopar.bgColor(row.name);
          return docRef.gridTemplate ? (
            docRef.gridTemplate(row, action, () =>
              selectRow(row, !selectedRows.includes(row.name))
            )
          ) : (
            <div key={row.name}>
              <Card className="w-full min-w-[300px]">
                <CardHeader>
                  <CardDescription>
                    <Badge variant="secondary" className="bg-secondary text-white">
                      {row.type}
                    </Badge>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-3">
                    <Avatar
                      className="rounded-3 h-14 w-14"
                      style={{ backgroundColor: color }}
                    >
                      <AvatarFallback className="bg-transparent text-2xl font-bold">
                        {loopar.utils.avatar(row.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4>{row.name}</h4>
                      <h6 className="font-bold text-slate-500 dark:text-slate-400">
                        {row.module}
                      </h6>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={(e) => {
                      e.preventDefault();
                      deleteRow(row);
                    }}
                  >
                    <Trash2Icon className="mr-2" />
                    Delete
                  </Button>
                  <Link variant="outline" to={`update?name=${row.name}`}>
                    <PencilIcon className="mr-2" />
                    Update
                  </Link>
                </CardFooter>
              </Card>
            </div>
          );
        })}
      </div>
    );
  };

  const setPage = (page) => {
    const pagination = meta.pagination || {};
    pagination.page = page;
    setMeta((prev) => ({ ...prev, pagination }));
    search();
  };

  return (
    <>
      {hasSearchForm && props.renderFormSearch && props.renderFormSearch()}
      <div className="border">
        {viewType === "List" ? renderTable() : renderGrid()}
      </div>
      <div className="mt-3">
        {meta.pagination && (
          <Pagination pagination={meta.pagination} setPage={setPage} app={{}} />
        )}
        {props.footer}
      </div>
    </>
  );
}

export default BaseTable;