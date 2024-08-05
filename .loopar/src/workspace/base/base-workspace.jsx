import React, { useState, useEffect } from "react";
import BaseDialog, {Prompt} from "$dialog";
import { toast } from "sonner";
import { Toaster } from "@sonner";
import { useWorkspace, WorkspaceProviderContext } from "@workspace/workspace-provider";
import loopar from "$loopar";
import Emitter from '@services/emitter/emitter';

const Notify = () => {
  const { theme } = useWorkspace();
  return <Toaster richColors theme={theme} />;
}

export function DialogContextProvider() {
  const [dialogs, setDialogs] = useState({});
  const [notifications, setNotifications] = useState([]);

  const setDialog = (dialog) => {
    const currentDialogs = { ...dialogs || {} }
    currentDialogs[dialog.id] = dialog;
    setDialogs(currentDialogs);
  }

  const setNotify = ({ title, message, type = "info", timeout = 5000 }) => {
    const newNotifications = [...notifications];
    if (newNotifications[message]) return;

    newNotifications[message] = true;

    setTimeout(() => {
      delete newNotifications[message];
    }, timeout);

    (toast[type] || toast)(title || loopar.utils.Capitalize(type), {
      description: message,
      duration: timeout,
      theme: "light"
    });

    setNotifications(newNotifications);
  }

  const Dialog = (_dialog) => {
    const dialog = { ..._dialog };
    const content = dialog.content || dialog.message;
    dialog.id ??= typeof content === "string" ? content : dialog.title;
    dialog.open = dialog.open !== false;

    setDialog(dialog);
  }

  const setDialogOpen = (id, open) => {
    const currentDialogs = { ...dialogs || {} }
    if(currentDialogs[id]) {
      currentDialogs[id].open = open;
    }

    setDialogs(currentDialogs);
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
    Emitter.on('handle-open-close-dialog', (id, open) => {
      setDialogOpen(id, open);
    });

    return () => {
      Emitter.off('notify', handleNotify);
      Emitter.off('dialog', handleDialog);
      Emitter.off('handle-open-close-dialog', (id, open) => {
        setDialogOpen(id, open);
      });
    };
  }, []);

  return (
    <>
      {Object.values(dialogs || {}).filter(d => d.open).map((dialog) => {
        return dialog.type === "prompt" ? (
          <Prompt {...dialog} key={dialog.key} open={dialog.open}/>
        ) : (
          <BaseDialog {...dialog} key={dialog.id} open={dialog.open} />
        );
      })}
      {Object.values(notifications || {}).map((notify) => {
        return Notify(notify);
      })}
    </>
  );
}

export default function BaseWorkspace(props) {
  const workspace = useWorkspace();

  return (
    <>
      <DialogContextProvider/>
      <WorkspaceProviderContext.Provider
        value={
          {
            ...workspace,
            menuItems: props.menuItems && props.menuItems() || [],
            refresh: () => props.refresh || (() => { }),
          }
        }
      >
        {props.children}
      </WorkspaceProviderContext.Provider>
    </>
  );
}
