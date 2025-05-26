import { Pagination } from "@pagination";
import loopar from "loopar";
import { Link } from "@link";
import { Checkbox } from "@cn/components/ui/checkbox";

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
import { useTable } from "./TableContext"
import { TableSearch } from "./TableSearch";
import { EmptyTable } from "./EmptyTable";
import { DropdownListGridActions } from "./DropdownListGridActions";

import {
  PencilIcon,
  Trash2Icon,
} from "lucide-react";

export function GridView(props) {
  const {
    selectedRows,
    selectRow,
    search,
    docRef,
    deleteRow,
  } = useTable();

  const {hasSearchForm, hasSelectAll} = docRef;

  const rows = props.rows || useTable().rows || [];

  const defaultAction = (row) => {
    if (["Entity", "Builder"].includes(row.type || "")) {
      return row.is_single ? "update" : "list";
    }
    if (["Page Builder", "View Builder"].includes(row.type)) return "view";
    return "";
  };

  return (
    <>
      <div className="flex gap-2">
        {hasSelectAll && <DropdownListGridActions deleteOnServer={true}/>}
        {hasSearchForm && <TableSearch onChange={search} />}
      </div>
      <div className="border">
        <div className="flex flex-wrap gap-3 border p-2">
          {rows.length ? rows.map((row) => {
            const action = defaultAction(row);
            const color = loopar.bgColor(row.name);
            return docRef.gridTemplate ? (
              docRef.gridTemplate(row, action)
            ) : (
              <div key={row.name}>
                <Card className="w-full min-w-[300px]">
                  <CardHeader>
                  <CardDescription>
                    <div className='items-center flex gap-2'>
                      <Checkbox
                        className="h-4 w-4"
                        onCheckedChange={(event) => {
                          selectRow(row, event);
                        }}
                        checked={selectedRows.includes(row.name)}
                      />
                      <Badge variant="secondary" className="bg-secondary text-white">
                        {row.type}
                      </Badge>
                    </div>
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
                        deleteRow(row, true);
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
          }) : (
            <div className="flex w-full items-center justify-center p-4">
              <EmptyTable />
            </div>
          )}
        </div>
      </div>
      <div className="mt-3">
        <Pagination/>
        {props.footer}
      </div>
    </>
  );
}