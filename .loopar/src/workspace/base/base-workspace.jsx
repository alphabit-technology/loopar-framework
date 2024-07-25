import React, {useState, createContext, useEffect} from "react";
import Dialog, { Prompt } from "$dialog";
import { AppSourceLoader } from "$/app-source-loader";
import { toast } from "sonner";
import { Toaster } from "@sonner";
import { WorkspaceProvider, useWorkspace, WorkspaceProviderContext } from "@workspace/workspace-provider";
import loopar from "$loopar";
const Notifies = () => {
  const {theme} = useWorkspace();
  return <Toaster richColors theme={theme}/>;
}

const DialogContext = createContext({});

export function DialogContextProvider ({dialogs={}, ...props}) {
  const [openDialog, setOpenDialog] = React.useState(null);

  const getOpenDialogs = () => {
    return Object.values(dialogs || {}).filter(dialog => dialog.state.open).length;
  }

  const setDialog = (dialog) => {
    const currentDialogs = dialogs || {};
    currentDialogs[dialog.id] = dialog;

    this.setState({ dialogs: currentDialogs, openDialog: dialog.open }, () => {
      dialog.open &&
        dialogs[dialog.id] &&
        dialogs[dialog.id].show(dialog);
    });
  }

  const closeDialog = (id) => {
    dialogs[id] && dialogs[id].close();
  }

  return (
    <DialogContext.Provider value={{
      setDialog,
      closeDialog
    }}>
      {Object.values(dialogs || {}).map((dialog) => {
        dialog.ref = (ref) => (dialogs[dialog.id] = ref);

        return dialog.type === "prompt" ? (
          <Prompt {...dialog} key={dialog.key} />
        ) : (
          <Dialog {...dialog} key={dialog.key} />
        );
      })}
      {props.children}
    </DialogContext.Provider>
  );
}

export default function BaseWorkspace (props) {
  //const [documents, setDocuments] = useState(props.documents || {});
  const workspace = useWorkspace();
  const [progress, setProgress] = useState(0);
  const [toProgress, setToProgress] = useState(20);
  const [freeze, setFreeze] = useState(false);
  const [meta, setMeta] = useState(props);
  const [notifies, setNotifies] = useState({});
  const [resourcesLoaded, setResourcesLoaded] = useState(null);
  const [apps, setApps] = useState({});

  useEffect(() => {
    loopar.rootApp = {
      setDialog
    };
  }, []);

   const setNotify = ({title, message, type = "info", timeout=5000 }) => {
    /*if(this.notifies[message]) return;

    this.notifies[message] = true;

    setTimeout(() => {
      delete this.notifies[message];
    }, timeout);

    (toast[type] || toast)(title || loopar.utils.Capitalize(type), {
      description: message,
      duration: timeout,
      theme: "light"
    });*/
  }

  const setCountDialogs = (count) => {
    //this.dialogs.setCountDialogs(count);
  }

  const emit = (event, data) => {
    /*Object.values(this.apps).forEach(app => {
         app.emit(event, data);
      });*/
  }

  const getPace = () => {
    /*return (
      <div
        className={`pace pace-${
          progress === 0 || progress > 100 ? "active" : "active"
        }`}
        ref={(progress) => (progressBarr = progress)}
        style={{ bottom: 0, display: "block" }}
      >
        <div
          className="pace-progress"
          data-progress-text={`${progress}%`}
          data-progress={progress}
          style={{
            transform: `translate3d(${progress}%, 0px, 0px)`,
            top: headerHeight || 55,
          }}
        >
          <div className="pace-progress-inner" />
        </div>
      </div>
    );*/
  }

  const makeProgress = (to) => {
    /*let progress = stateProgress + increment * 0.1;
    increment += 1;

    if (progress >= 101) {
      progress = 0;
      this.stateProgress = 0;
      this.increment = 1;
    } else this.stateProgress = progress;

    const node = this.progressBarr?.node;

    if (node) {
      node.setAttribute("data-progress", progress);
      node.setAttribute("data-progress-text", `${progress}%`);

      const progress_inner = node.querySelector(".pace-progress");

      progress_inner.style.transform = `translate3d(${progress}%, 0px, 0px)`;
      node.classList[progress > 0 ? "remove" : "add"]("pace-inactive");
      node.classList[progress > 0 ? "add" : "remove"]("pace-active");
    }

    progress < to && progress > 0 && setTimeout(() => this.progress(to), 0);*/
  }

  /*const setFreeze(freeze = true) {
    //this.setState({ freeze });
  }*/

  const setDialog = (dialog) => {
    //this.dialogs.setDialog(dialog);
  }

  const closeDialog = (id) => {
    //this.dialogs.closeDialog(id);
  }

  const getMeta = () => {
    return meta || {};
  }

  return (
    <>
      <WorkspaceProviderContext.Provider
        value={
          {
            ...workspace,
            /*updateDocument,
            setNotify,
            setCountDialogs,
            emit,
            makeProgress,
            setFreeze,
            setDialog,
            closeDialog,
            getMeta,*/
            menuItems: props.menuItems && props.menuItems() || []
          }
        
        }
        //{...workspace}
        //</>menuItems={props.menuItems && props.menuItems() || []}
      >
        {props.children}
      </WorkspaceProviderContext.Provider>
    </>
  );
}
