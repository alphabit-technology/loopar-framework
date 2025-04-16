import { useCallback, useMemo } from "react";
import { useTable } from "./TableContext";
import loopar from "loopar";

import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
  TableFooter,
} from "@cn/components/ui/table";
import { EmptyTable } from "./EmptyTable";

export function SimpleTable(props) {
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
              <EmptyTable/>
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