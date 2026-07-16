
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
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@cn/components/ui/dropdown-menu";
import { Settings2Icon, EllipsisIcon, HardDrive, RefreshCcwDot, RefreshCw, Hammer, PackageIcon, RocketIcon, ChevronDown } from 'lucide-react';

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


// One deploy control. Primary click deploys the watcher's latest build (from
// build/staging — fast). The dropdown offers the same, plus a full rebuild +
// deploy (compressed, from scratch). Both are self-contained deploys — neither
// is a step that needs the other.
const DeployButton = () => {
  const [build, setBuild] = useState({ state: 'idle' });
  const notifiedRef = useRef(new Set());

  const notifyResult = (job) => {
    if (!job || (job.state !== 'completed' && job.state !== 'failed')) return;
    if (!job.id || notifiedRef.current.has(job.id)) return;
    notifiedRef.current.add(job.id);

    const what = job.scope === 'activate' ? 'Deploy' : 'Build';
    if (job.state === 'completed') {
      loopar.notify({ message: `${what} completed. Production tenants reloaded.`, type: "success" });
    } else {
      loopar.notify({
        message: `${what} failed${job.exitCode != null ? ` (exit ${job.exitCode})` : ''}. Check server logs.`,
        type: "error",
      });
    }
  };

  // Sync from an actionBuildStatus response. Used on mount and as a polling
  // fallback: if the realtime socket drops mid-build (e.g. the dev server
  // chokes while a deploy floods build/releases with files), the completion
  // event is lost and the button would hang on "Deploying…" forever.
  const applyStatus = (res, { notify = true } = {}) => {
    if (!res || typeof res !== 'object') return;
    const b = res.build;
    if (b && b.state === 'running' && b.scope !== 'install') {
      setBuild(b);
      return;
    }
    const last = Array.isArray(res.history)
      ? res.history.find((h) => h.scope !== 'install')
      : null;
    if (last) {
      if (notify) notifyResult(last);
      else if (last.id) notifiedRef.current.add(last.id);
    }
    setBuild({ state: 'idle' });
  };

  useEffect(() => {
    let mounted = true;
    loopar.api.post("Tenant Manager", "buildStatus", {
      freeze: false,
      // Don't replay results that finished before this page loaded.
      success: (res) => { if (mounted) applyStatus(res, { notify: false }); },
      error: () => {},
    });
    return () => { mounted = false; };
  }, []);

  useRealtime("buildStatus", (payload) => {
    if (!payload?.build) return;
    const next = payload.build;
    if (next.scope === 'install') return; // install has its own button
    setBuild(next.state === 'running' ? next : { state: 'idle' });
    notifyResult(next);
  });

  // Polling fallback while a job runs — heals missed realtime events.
  useEffect(() => {
    if (build.state !== 'running') return;
    const timer = setInterval(() => {
      loopar.api.post("Tenant Manager", "buildStatus", {
        freeze: false,
        success: (res) => applyStatus(res),
        error: () => {},
      });
    }, 5000);
    return () => clearInterval(timer);
  }, [build.state]);

  const isRunning = build.state === 'running';
  const isBuilding = isRunning && build.scope !== 'activate';

  const post = (action, scope) => {
    setBuild({ state: 'running', scope, startedAt: Date.now() });
    loopar.api.post("Tenant Manager", action, {
      freeze: false,
      success: (res) => { if (res && res.build) setBuild(res.build); },
      error: (msg) => { setBuild({ state: 'idle' }); loopar.throw(msg); },
    });
  };

  const deployStaging = () => {
    if (isRunning) return;
    loopar.confirm(
      "Deploy the latest build (from staging) and reload production tenants?",
      () => post('activate', 'activate')
    );
  };

  const fullRebuild = () => {
    if (isRunning) return;
    loopar.confirm(
      "Full rebuild (compressed) and deploy? Slower — rebuilds everything from scratch.",
      () => post('build', 'all')
    );
  };

  const variant = isRunning ? "outline" : "primeblue";
  const label = isRunning ? (isBuilding ? 'Building…' : 'Deploying…') : 'Deploy';

  return (
    <div className="flex items-center">
      <Button
        variant={variant}
        onClick={deployStaging}
        disabled={isRunning}
        className="rounded-r-none"
        title="Deploy the latest watcher build (from staging) and reload tenants"
      >
        <RocketIcon className={`mr-2 ${isRunning ? "animate-pulse" : ""}`} />
        {label}
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={variant}
            disabled={isRunning}
            className="rounded-l-none border-l border-white/20 px-2"
            title="Deploy options"
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60">
          <DropdownMenuItem onClick={deployStaging}>
            <RocketIcon className="mr-2 h-4 w-4" /> Deploy (from staging — fast)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={fullRebuild}>
            <Hammer className="mr-2 h-4 w-4" /> Full rebuild &amp; deploy
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

const InstallButton = () => {
  const [running, setRunning] = useState(false);
  const notifiedRef = useRef(new Set());

  const notifyResult = (job) => {
    if (!job || job.scope !== 'install') return;
    if (!job.id || notifiedRef.current.has(job.id)) return;
    if (job.state === 'completed') {
      notifiedRef.current.add(job.id);
      loopar.notify({ message: "Dependencies installed. You can build now.", type: "success" });
    } else if (job.state === 'failed') {
      notifiedRef.current.add(job.id);
      loopar.notify({
        message: `Install failed${job.exitCode != null ? ` (exit ${job.exitCode})` : ''}. Check server logs.`,
        type: "error",
      });
    }
  };

  useRealtime("buildStatus", (payload) => {
    const b = payload?.build;
    if (!b || b.scope !== 'install') return;
    setRunning(b.state === 'running');
    notifyResult(b);
  });

  // Polling fallback — same rationale as DeployButton: don't hang on
  // "Installing…" if the completion event is missed.
  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => {
      loopar.api.post("Tenant Manager", "buildStatus", {
        freeze: false,
        success: (res) => {
          const b = res?.build;
          if (b && b.state === 'running' && b.scope === 'install') return; // still going
          const last = Array.isArray(res?.history)
            ? res.history.find((h) => h.scope === 'install')
            : null;
          if (last) notifyResult(last);
          setRunning(false);
        },
        error: () => {},
      });
    }, 5000);
    return () => clearInterval(timer);
  }, [running]);

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
    this.setCustomAction('deploy', <DeployButton />);
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