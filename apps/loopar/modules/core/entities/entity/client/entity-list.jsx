import ListContext from '@context/list-context';
import loopar from "loopar";
const {Capitalize, avatar} = loopar.utils;

import { Card, CardHeader, CardDescription, CardContent, CardFooter} from '@card';
import {
  Avatar,
  AvatarFallback
} from "@cn/components/ui/avatar"

import { Badge } from "@cn/components/ui/badge";
import { MenuIcon, EyeIcon, PlusIcon, PencilIcon, BrushIcon } from 'lucide-react';
import {Link} from "@link"
import { useTable } from "@@table/TableContext";
import { Checkbox } from "@cn/components/ui/checkbox";

const CardTemplate = (props) => {
  const { row, action } = props;
  const {selectRow, selectedRows} = useTable();

  const color = loopar.bgColor(row.name);
  const getAction = (to, Icon, text, variant) => {
    return (
      <Link
        to={to}
        variant="outline"
      >
        <Icon className="mr-2"/>
        {text}
      </Link>
    )
  }

  const entity = row.type || props.meta.schema.name;
  const baseUrl = `/desk/${row.name}/${action}`

  return (
    <div>
      <Card className="w-full min-w-[300px] -p-5">
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
              <Badge
                variant="secondary"
                className="bg-secondary text-primary"
              >
                {row.type}
              </Badge>
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="justify-left flex gap-3">
            <Avatar className={`rounded-3 h-14 w-14`} style={{ backgroundColor: color }}>
              <AvatarFallback className={`bg-transparent text-2xl font-bold`}>{avatar(row.name)}</AvatarFallback>
            </Avatar>
            <div>
              <h4>{row.name}</h4>
              <h6 className='font-bold text-slate-500 dark:text-slate-400'>{row.module}</h6>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div>
            {action === "update" && getAction(`${baseUrl}`, PencilIcon, Capitalize(action), "primeblue")}
            {action === "list" && getAction(`${baseUrl}`, MenuIcon, Capitalize(action), "primeblue")}
            {action === "view" && getAction(`${baseUrl}?name=${row.name}`, EyeIcon, Capitalize(action), "primeblue")}
          </div>
          <div className='flex justify-end'>
            <Link 
              to={`/desk/${entity}/update?name=${row.name}`}
              variant="outline"
              className="bg-warning/60"
            >
              <BrushIcon/>
            </Link>
            {
              ((row.type === "Entity" || row.type == "Builder" || row.build) && row.is_single !== 1) && (
                <Link
                  to={`/desk/${row.name}/create`}
                  variant="outline"
                  className="bg-success/60"
                >
                  <PlusIcon/>
                </Link>
              )
            }
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

export default class EntityList extends ListContext {
  cardSize = 230;
  hiddenColumns = ["is_single"];
  constructor(props) {
    super(props);
  }

  onShow() {
    super.onShow();
  }

  onLoad() {}

  gridTemplate(row, action){
    return (
      <CardTemplate row={row} action={row.name == "File Manager" ? "list" : action} />
    )
  }
}