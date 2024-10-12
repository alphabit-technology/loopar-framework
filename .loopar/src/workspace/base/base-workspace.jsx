import React, { useState, useEffect, useCallback, useRef } from "react";
import BaseDialog, {Prompt} from "$dialog";
import { toast } from "sonner";
import { Toaster } from "@sonner";
import { useWorkspace, WorkspaceProviderContext } from "@workspace/workspace-provider";
import loopar from "$loopar";
import Emitter from '@services/emitter/emitter';
import { Loader2Icon } from "lucide-react";
import { use } from "marked";

const Notify = () => {
  const { theme } = useWorkspace();
  return <Toaster richColors theme={theme} />;
}

const Loading = () => {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleLoading = (freeze) => {
      setLoading(freeze);
    };

    Emitter.on('freeze', handleLoading);
    return () => {
      Emitter.off('freeze', handleLoading);
    };
  }, []);

  return loading ? (
    <div 
      style={{ zIndex: 1000 }}
      className="fixed backdrop-blur-sm top-0 left-0 w-full h-full transition-all ease-in-out duration-600"
    >
      <div className="flex justify-center items-center w-full h-full">
        <Loader2Icon className="text-slate-500 w-10 h-10 animate-spin" />
      </div>
    </div>
  ) : null;
};

export function DialogContextProvider() {
  const [dialogs, setDialogs] = useState({});
  const dialogsRef = useRef({});

  const handleSetDialogs = (dialogs) => {
    setDialogs(dialogs);
  }

  const setDialog = (dialog) => {
    dialogsRef.current[dialog.id] = dialog;
    handleSetDialogs({ ...dialogsRef.current });
  }

  const setNotify = ({ title, message, type = "info", timeout = 5000 }) => {
    (toast[type] || toast)(title || loopar.utils.Capitalize(type), {
      description: message,
      duration: timeout,
      theme: "light"
    });
  }

  const Dialog = (_dialog) => {
    const dialog = { ..._dialog };
    const content = dialog.content || dialog.message;
    dialog.id ??= typeof content === "string" ? content : dialog.title;
    dialog.open = dialog.open !== false;

    setDialog(dialog);
  }

  const setDialogOpen = (id, open) => {
    const current = dialogsRef.current[id];
    current && (current.open = open);

    handleSetDialogs({ ...dialogsRef.current });
  }

  useEffect(() => {
    const handleNotify = (message) => {
      setNotify(message);
    };

    const handleDialog = (dialog) => {
      Dialog(dialog);
    };

    Emitter.on('notify', handleNotify);
    Emitter.on('dialog', handleDialog);
    Emitter.on('handle-open-close-dialog', setDialogOpen);

    return () => {
      Emitter.off('notify', handleNotify);
      Emitter.off('dialog', handleDialog);
      Emitter.off('handle-open-close-dialog', setDialogOpen);
    };
  }, []);

  return (
    <>
      {Object.values(dialogs).filter(d => d.open).map((dialog, index) => {
        return dialog.type === "prompt" ? (
          <Prompt {...dialog} open={dialog.open} size={dialog.size || "sm"}/>
        ) : (
          <BaseDialog {...dialog} key={dialog.id} open={dialog.open} />
        );
      })}
      <Notify />
    </>
  );
}

export default function BaseWorkspace(props) {
  const workspace = useWorkspace();

  const currentPage = workspace.currentPage || props.currentPage || "";
  return (
    <>
      <DialogContextProvider key={currentPage}/>
      <Loading/>
      <WorkspaceProviderContext.Provider
        value={
          {
            ...workspace,
            menuItems: props.menuItems && props.menuItems() || [],
            refresh: () => props.refresh || (() => { }),
            currentPage: currentPage,
          }
        }
      >
        {props.children}
      </WorkspaceProviderContext.Provider>
    </>
  );
}
