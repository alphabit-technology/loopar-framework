import React, { useCallback, useMemo } from "react";
import { useTable } from "./TableContext";
import { Pagination } from "@pagination";
import loopar from "loopar";
import { Link } from "@link";

import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
  TableFooter,
} from "@cn/components/ui/table";

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

import {
  PencilIcon,
  Trash2Icon,
  AlertTriangleIcon,
} from "lucide-react";

function SimpleTable(props) {
  const {
    baseColumns,
  } = useTable();

  const rows = props.rows || useTable().rows || [];

  const mappedColumns = useCallback(() => {
    return props.columns || baseColumns();
  }, [baseColumns, props.columns]);

  const availableColumns = useMemo(() => {
    return mappedColumns()
  }, [mappedColumns]);

  const renderRows = (columns, rowsData = []) =>
    rowsData.map((row, index) => (
      <TableRow hover role="checkbox" tabIndex={-1} key={`row_${row.name}`}>
        {
          columns.map((col) => {
            const cellProps = col.cellProps || {};
            const { data } = col;
            return (
              <TableCell
                key={`${data.name}_${index}`}
                className="align-middle"
                {...cellProps}
              >
                {col.render ? col.render(row, index) : row[data.name]}
              </TableCell>
            );
          })
        }
      </TableRow>
    ));

  const rowsCount = rows.length;

  return (
    <Table stickyHeader aria-label="sticky table" className="w-full overflow-hidden">
      <TableHeader className="bg-slate-300/50 dark:bg-slate-800/50">
        <TableRow>
          {availableColumns.filter(c => c.data.label).map((c) => {
            const { data, headProps = {} } = c;
            return (
              <TableCell key={data.name} {...headProps}>
                {typeof data.label === "function" ? data.label() : loopar.utils.UPPERCASE(data.label || "")}
              </TableCell>
            );
          })}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rowsCount === 0 ? (
          <TableRow>
            <TableCell colSpan={availableColumns.length + 2}>
              <div className="flex flex-col bg-background w-full p-3 items-center">
                <AlertTriangleIcon className="w-10 h-10" />
                <div className="text-lg">No rows to show</div>
              </div>
            </TableCell>
          </TableRow>
        ) : (
          renderRows(availableColumns, rows)
        )}
      </TableBody>
      <TableFooter>
        <TableRow>
          {props.footer}
        </TableRow>
        </TableFooter>
    </Table>
  );
}

function BaseTable(props) {
  const {
    meta,
    selectedRows,
    selectRow,
    deleteRow,
    search,
    setMeta,
    docRef,
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

    if (rows.length === 0)
      return (
        <div className="flex flex-col bg-background w-full p-3 items-center">
          <AlertTriangleIcon className="w-10 h-10" />
          <div className="text-lg">No items to show</div>
        </div>
      );
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