
'use strict';

import ListContext from '@context/list-context';
import loopar from "loopar";
import DragToggle from "./DragToggle.jsx";
import { Code, Star } from 'lucide-react';
import { useState, createContext, useContext } from "react";

import {
  Avatar,
} from "@cn/components/ui/avatar"

import {Link} from "@link"
import {Button} from "@cn/components/ui/button";
import { Settings2Icon, EllipsisIcon, HardDrive, RefreshCcwDot } from 'lucide-react';

import {cn} from "@cn/lib/utils";

import { useDialogContext} from "@dialog";
import { useTable } from "@@table/TableContext"

const tenantStatus = (row) => {
  return row.status != "online" || process.env.TENANT_ID == row.name;
}

export const TenantManagerListContext = createContext();

const TenantManagerList = (props) => {
  const {updateRows, setUpdateRows} = useContext(TenantManagerListContext);
  return (
    <TenantManagerListBase {...props} updateRows={updateRows} setUpdateRows={setUpdateRows} />
  )
}

const TenantManagerListProvider = ({children}) => {
  const [updateRows=[], setUpdateRows] = useState([]);
  return (
    <TenantManagerListContext.Provider value={{updateRows, setUpdateRows}}>
      {children}
    </TenantManagerListContext.Provider>
  )
}

const NameRender = ({row}) => {
  const {inDialog} = useDialogContext();
  const {toggleRowSelect} = useTable();
  const Com = inDialog ? "a" : Link;
  const disabled = tenantStatus(row);

  const compPropperties = inDialog ? {
    onClick: (e) => {
      e.preventDefault();
      toggleRowSelect(row);
    }
  } : {}

  const to = row.domain ? `http://${row.domain}/desk` : `http://localhost:${row.port}/desk`;

  return (
    <Com 
      className={cn(
        //"flex flex-row items-left",
        disabled && "opacity-50 cursor-not-allowed pointer-events-none disabled"
      )}
      to={to}
      target="_blank"
      {...compPropperties}
    >
      <Avatar>
        <div>
          <HardDrive
            className={
              cn(
                `w-8 h-8 transition-all ease-in duration-300 hover:scale-105 aspect-square`,
                row.status == "online" ? "text-green-500/70" : "text-red-500/70"
              )
            }
          />
        </div>
      </Avatar>
      <div className='flex flex-col items-start p-0 pl-3'>
        {row.name.toUpperCase()}
        <span className='text-gray-500'>{to}</span>
      </div>
    </Com>
  )
}

const sendAction = (action, name, confirm=true, onComplete) => {
  const doAction = () => {
    loopar.api.post("Tenant Manager", action, {
      query: { name },
      success: () => {
        onComplete?.(true);
        loopar.refresh();
      },
      error: (message) => {
        onComplete?.(false);
        loopar.refresh();
        loopar.throw(message)
      },
      freeze: false
    });
  }

  if(confirm){
    loopar.confirm(`Are you sure you want to ${action} ${name}?`, () => {
      doAction();
    }, () => {
      onComplete?.(false);
    });
  }else{
    doAction();
  }
}

const Buttons = ({row}) => {
  const {inDialog} = useDialogContext();
  const {updateRows, setUpdateRows} = useContext(TenantManagerListContext);

  const loading = updateRows.includes(row.name);
  if(inDialog) {
    return null
  }

  const status = row.status;
  
  return (
    <div className="flex flex-row items-center gap-0">
      <Button
        variant="outline"
        disabled={row.name == process.env.TENANT_ID || row.name == "dev" || status != "online" || updateRows.includes(row.name)}
        onClick={(e) => {
          e.preventDefault();
          setUpdateRows([...updateRows, row.name]);
          sendAction("restart", row.name, true, () => {
            setUpdateRows(updateRows.filter(name => name != row.name));
          });
        }}
      >
        <RefreshCcwDot className={`text-orange-500/50 ${loading && "animate-spin"}`} />
      </Button>
      <Link
        to={`update?name=${row.name}&app=${row.app}`}
      >
        <Button variant="outline">
          <Settings2Icon className="text-blue-500" />
        </Button>
      </Link>
    </div>
  );
}

class TenantManagerListBase extends ListContext {
  onlyList=true;
  constructor(props){
    super(props);
  }

  customColumns(baseColumns) {
    const {updateRows, setUpdateRows} = this.props;
    return [
      {
        data: {
          name: "name:"
        },
        render: row => (
          <NameRender row={row} />
        ),
      },
      {
        data: {
          name: "node_env:",
          label: "Mode"
        },
        headProps: {
          className: "w-10 p-2 text-center",
        },
        cellProps: {
          className: "w-10 p-2 text-center",
        },
        render: row => {
          const mode = row.node_env;
  
          return (
            <DragToggle 
              value={mode == "production"}
              site={row.name}
              disabled={row.name =="dev"}
              onChange={(isProduction) => {
                setUpdateRows([...updateRows, row.name]);
                sendAction(isProduction ? "production" : "development", row.name, false, () => {
                  setUpdateRows(updateRows.filter(name => name != row.name))
                });
              }}
              offLabel="Dev"
              onLabel="Prod"
              OffIcon={Code}
              OnIcon={Star}
              offColor="amber"
              onColor="blue"
            />
          )
        }
      },
      {
        data: {
          name: "status:",
          label: "Status"
        },
        headProps: {
          className: "w-10 p-2 text-center",
        },
        cellProps: {
          className: "w-10 p-2 text-center",
        },
        render: row => {
          const status = row.status;
          
          return (
            <DragToggle 
              value={status=="online"}
              site={row.name}
              disabled={row.name == process.env.TENANT_ID || row.name == "dev"}
              onChange={(isOnline) => {
                setUpdateRows([...updateRows, row.name]);
                sendAction(isOnline ? "start" : "stop", row.name, false, () => {
                  setUpdateRows(updateRows.filter(name => name != row.name))
                });
              }}
            />
          )
        }
      },
      ...baseColumns,
      {
        data: {
          label: () => <EllipsisIcon className="w-full"/>,
          name: "actions",
        },
        headProps: {
          className: "w-10 p-2 text-center",
        },
        render: row => (
          <Buttons row={row} />
        ),
      }
    ];
  }
}

const TenantManagerMiddleware = (props) => {
  return (
    <TenantManagerListProvider>
      <TenantManagerList {...props} />
    </TenantManagerListProvider>
  )
}

export default TenantManagerMiddleware;