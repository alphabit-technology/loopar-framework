import loopar from "loopar";
import {Link} from "@link";
import { useTable } from "./TableContext"
import BaseTable from "./BaseTable"
import {useCallback, useMemo} from "react";
import {Trash2Icon} from "lucide-react";
import {BaseIcon} from "@icon-input";

import {
  Avatar,
  AvatarFallback
} from "@cn/components/ui/avatar"

import { Button } from "@cn/components/ui/button";
import { Badge } from "@cn/components/ui/badge";
import { TableSearch } from "./TableSearch";

export function ListGrid(props) {
  const { docRef } = props;
  const {baseColumns, Document, selectorCol, deleteRow, search} = useTable();

  const getDocumentTitle = (row) => {
    const titleFields = Document.Entity.title_fields?.split(",");

    if(titleFields){
      return titleFields.map((field) => row[field]).join(" ");
    }

    return row.name;
  }

  const mappedColumns = useCallback(() => {
    return baseColumns().filter((col) => col.data.name !== "name" && loopar.utils.trueValue(col.data.in_list_view));
  }, [baseColumns]);

  const customMappedColumns = useMemo(() => {
    const baseCols = (mappedColumns() || []).filter(col => col.data.name !== "name")
      .map((col) => {
        if([SWITCH, CHECKBOX].includes(col.element)) {
          col.headProps = {
            className: "text-center",
          };
          col.render = (row) => {
            return (
              <div className="flex justify-center">
                <Badge variant="secondary" className={row[col.data.name] ? "bg-green-500/80 text-white" : "bg-red-500/80 text-white"}>
                  {row[col.data.name] ? "YES" : "NO"}
                </Badge>
              </div>
            )
          }
        }

        return col;
      });

    if(docRef.customColumns){
      const customCols = docRef.customColumns(baseCols);
      return [
        selectorCol({deleteOnServer: true}),
        ...customCols
      ];
    }

    return [
      selectorCol({deleteOnServer: true}),
      {
        data: {
          name: "mame",
          label: null//because first column is selector and spands 2 columns
        },
        render: (row) => {
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
                <h5 className='font-bold text-slate-500 dark:text-slate-400'>{loopar.utils.UPPERCASE(getDocumentTitle(row))}</h5>
              </div>
            </Link>
          );
        }
      },
      ...baseCols.map((col) => {
        if(col.element === ICON_INPUT){
          return {
            ...col,
            render: (row) => {
              return (
                <BaseIcon className="w-7 h-7" icon={row[col.data.name]} />
              )
            }
          }
        }

        return col
      }),
      {
        data: {
          name: "actions",
          label: "...",
        },
        headProps: {
          className: "w-10 p-2 text-center",
        },
        rowsProps: {
          className: "align-middle text-truncate text-center",
        },
        cellProps: {
          style: { width: 50 },
          className: "align-middle text-center",
        },
        render: (row) => {
          return (
            <Button
              variant="outline"
              onClick={(e) => {
                e.preventDefault();
                deleteRow(row, true);
              }}
            >
              <Trash2Icon className="text-red-500" />
            </Button>
          );
        },
      }
    ];
  }, [mappedColumns]);

  return (
    <>
      <TableSearch onChange={search}/>
      <BaseTable
        {...props}
        hasPagination={props.hasPagination !== false}
        columns={customMappedColumns}
      />
    </>
  )
}