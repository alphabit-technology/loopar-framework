
'use strict';

import ListContext from '@context/list-context';
import loopar, { useRealtime } from "loopar";
import DragToggle from "./DragToggle.jsx";
import { Code, Star } from 'lucide-react';
import { useState, useEffect, useRef, createContext, useContext } from "react";

import {
  Avatar,
} from "@cn/components/ui/avatar"

import {Link} from "@link"
import {Button} from "@cn/components/ui/button";
import { Settings2Icon, EllipsisIcon, HardDrive, RefreshCcwDot, RefreshCw, Hammer, PackageIcon } from 'lucide-react';

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
        title="Reload — graceful, picks up code changes (no env refresh)"
        disabled={status != "online" || loading}
        onClick={(e) => {
          e.preventDefault();
          setUpdateRows([...updateRows, row.name]);
          sendAction("reload", row.name, true, () => {
            setUpdateRows(updateRows.filter(name => name != row.name));
          });
        }}
      >
        <RefreshCw className={`text-blue-500/70 ${loading && "animate-spin"}`} />
      </Button>
      <Button
        variant="outline"
        title="Restart — hard, refreshes env (port/domain/NODE_ENV). Disabled for the active dev tenant."
        disabled={row.name == process.env.TENANT_ID || row.name == "dev" || status != "online" || loading}
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


const BuildButton = () => {
  const [build, setBuild] = useState({ state: 'idle' });
  const notifiedRef = useRef(new Set());

  useEffect(() => {
    let mounted = true;
    loopar.api.post("Tenant Manager", "buildStatus", {
      freeze: false,
      success: (res) => {
        if (!mounted) return;
        const build = (res && typeof res === 'object') ? res.build : null;
        if (!build) return;

        setBuild(build);
        if (build.id && build.state !== 'running' && build.state !== 'idle') {
          notifiedRef.current.add(build.id);
        }
      },
      error: () => {},
    });
    return () => { mounted = false; };
  }, []);

  useRealtime("buildStatus", (payload) => {
    if (!payload?.build) return;
    const next = payload.build;
    if (next.scope === 'install') return; // install has its own button
    setBuild(next);

    if (next.state !== 'completed' && next.state !== 'failed') return;
    if (!next.id || notifiedRef.current.has(next.id)) return;
    notifiedRef.current.add(next.id);

    if (next.state === 'completed') {
      loopar.notify({
        message: "Build completed. Click 'Reload' on the dev tenant to apply.",
        type: "success",
      });
    } else {
      loopar.notify({
        message: `Build failed${next.exitCode != null ? ` (exit ${next.exitCode})` : ''}. Check server logs.`,
        type: "error",
      });
    }
  });

  const isRunning = build.state === 'running';

  const onClick = (e) => {
    e.preventDefault();
    if (isRunning) return;

    loopar.confirm(
      "Run a full build now? Client + server bundles will be rebuilt and every production tenant (except this one) will be reloaded.",
      () => {
        setBuild((prev) => ({
          ...prev,
          state: 'running',
          startedAt: Date.now(),
        }));

        loopar.api.post("Tenant Manager", "build", {
          freeze: false,
          success: (res) => {
            if (res && typeof res === 'object' && res.build) {
              setBuild(res.build);
            }
          },
          error: (msg) => {
            setBuild({ state: 'idle' });
            loopar.throw(msg);
          },
        });
      }
    );
  };

  return (
    <Button
      variant={isRunning ? "outline" : "primeblue"}
      onClick={onClick}
      disabled={isRunning}
      title="Build the framework (versioned release + reload production tenants)"
    >
      <Hammer className={`mr-2 ${isRunning ? "animate-pulse" : ""}`} />
      {isRunning ? "Building…" : "Build"}
    </Button>
  );
};

const InstallButton = () => {
  const [running, setRunning] = useState(false);

  useRealtime("buildStatus", (payload) => {
    const b = payload?.build;
    if (!b || b.scope !== 'install') return;
    setRunning(b.state === 'running');
    if (b.state === 'completed') {
      loopar.notify({ message: "Dependencies installed. You can build now.", type: "success" });
    } else if (b.state === 'failed') {
      loopar.notify({
        message: `Install failed${b.exitCode != null ? ` (exit ${b.exitCode})` : ''}. Check server logs.`,
        type: "error",
      });
    }
  });

  const onClick = (e) => {
    e.preventDefault();
    if (running) return;
    loopar.confirm(
      "Run 'yarn install' now? Installs new/updated dependencies from the lockfile. Run this when libraries changed, before building.",
      () => {
        setRunning(true);
        loopar.api.post("Tenant Manager", "install", {
          freeze: false,
          success: () => {},
          error: (msg) => { setRunning(false); loopar.throw(msg); },
        });
      }
    );
  };

  return (
    <Button
      variant={running ? "outline" : "secondary"}
      onClick={onClick}
      disabled={running}
      title="Install dependencies (yarn install) — run when libraries changed, before building"
    >
      <PackageIcon className={`mr-2 ${running ? "animate-pulse" : ""}`} />
      {running ? "Installing…" : "Install"}
    </Button>
  );
};

class TenantManagerListBase extends ListContext {
  onlyList=true;
  constructor(props){
    super(props);
  }

  setCustomActions() {
    super.setCustomActions();
    this.setCustomAction('install', <InstallButton />);
    this.setCustomAction('build', <BuildButton />);
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
              disabled={updateRows.includes(row.name)}
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
              disabled={updateRows.includes(row.name)}
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