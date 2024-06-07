import React from "react";
import Dialog, { Prompt } from "$dialog";
import { AppSourceLoader } from "$/app-source-loader";
import { toast } from "sonner";
import { Toaster } from "@sonner";
import { WorkspaceProvider, useWorkspace } from "@workspace/workspace-provider";
import loopar from "$loopar";

const Notifies = () => {
  const {theme} = useWorkspace();
  return <Toaster richColors theme={theme}/>;
}

class Dialogs extends React.Component {
  dialogs = {};
  constructor(props) {
    super(props);

    this.state = {
      dialogs: props.dialogs || {},
      openDialog: false
    };
  }

  get openDialogs() {
    return Object.values(this.dialogs || {}).filter(
      (dialog) => dialog.state.open
    ).length;
  }

  render() {
    const state = this.state;
    return (
      <>
        {...Object.values(state.dialogs || {}).map((dialog) => {
          dialog.ref = (ref) => (this.dialogs[dialog.id] = ref);

          return dialog.type === "prompt" ? (
            <Prompt {...dialog} />
          ) : (
            <Dialog {...dialog} />
          );
        })}
      </>
    );
  }

  setDialog(dialog) {
    const state = this.state;
    const currentDialogs = state.dialogs || {};
    currentDialogs[dialog.id] = dialog;

    this.setState({ dialogs: currentDialogs, openDialog: dialog.open }, () => {
      dialog.open &&
        this.dialogs[dialog.id] &&
        this.dialogs[dialog.id].show(dialog);
    });
  }

  closeDialog(id) {
    this.dialogs[id] && this.dialogs[id].close();
  }
}

const WorkspaceContext = ({ children, sidebarWidth, collapseSidebarWidth, headerHeight, __META__, menuItems, ...props }) => {
  return (
    <WorkspaceProvider
      sidebarWidth={sidebarWidth}
      collapseSidebarWidth={collapseSidebarWidth}
      workspace={__META__.W}
      headerHeight={headerHeight}
      menuItems={menuItems}
      {...props}
    >
      {children}
    </WorkspaceProvider>
  );
};

export default class BaseWorkspace extends React.Component {
  apps = {};
  stateProgress = 0;
  increment = 1;
  notifies = {};
  constructor(props) {
    super(props);

    this.state = {
      documents: props.documents || {},
      progress: 0,
      toProgress: 20,
      freeze: false,
      meta: props,
      notifies: {},
    };
  }

  /**
   * document: [{
   *    module: Component (imported),
   *    meta: Meta data of document,
   *    key: Unique key of document based on URL,
   * }]
   * #param res
   */
  setDocument(__META__) {
    const res = __META__ || {};
    const documents = this.state.documents || {};

    Object.values(documents).forEach((document) => {
      document.active = false;
    });

    res.meta.key = res.key;

    if (!documents[res.key]) {
      //MetaComponentsLoader(__META__, this.props.environment).then(() => {
        AppSourceLoader(res.client_importer).then((module) => {
          //MetaComponentsLoader(__META__, this.props.ENVIRONMENT).then(() => {
            documents[res.key] = {
              Module: module.default,
              meta: res.meta,
              active: true,
            };

            this.setState({ documents }, () => {
              this.progress(102);
            });
          //});
        }).catch((e) => {
          res.client_importer.client = "error-view";
          
          AppSourceLoader(res.client_importer).then((module) => {
            res.meta.__DOCUMENT__ = {
              code: 500,
              description: e.message
            };

            documents[res.key] = {
              Module: module.default,
              meta: res.meta,
              active: true,
            };

            this.setState({ documents }, () => {
              this.progress(102);
            });
          });
        });
      //});
    } else {
      documents[res.key] = {
        Module: documents[res.key].Module,
        meta: res.meta,
        active: true,
      };

      this.setState({ documents }, () => {
        this.progress(102);
      });
    }
  }

  get documents() {
    this.mergeDocument();

    return (
      <>
        {Object.values(this.state.documents).map((document) => {
          const { Module, meta } = document;
          return document.active ? <Module meta={meta} key={meta.key} /> : null;
        })}
      </>
    );
  }

  getActiveDocument(){
    return Object.values(this.state.documents || []).find(document => document.active);
  }

  componentDidUpdate() {
    const documents = this.state.documents || {};
    const activeDocument = Object.values(documents).find(
      (document) => document.active
    );
    const meta = activeDocument?.meta;
    const doctype = meta?.__DOCTYPE__;

    if (!doctype) return;

    const action = ["update", "create"].includes(meta.action)
      ? "form"
      : meta.action;
    const resources = (doctype?.resources?.rows || []).filter(
      (resource) => resource.apply_on === "all" || resource.apply_on === action
    );

    if (resources.length && this.state.resourcesLoaded !== doctype.id) {
      const arrayResources = Object.values(resources).map((resource) => {
        if (resource.type === "CSS") {
          return loopar.includeCSS(resource.path);
        } else if (resource.type === "JS") {
          return loopar.require(resource.path);
        }
      });

      Promise.all(arrayResources).then(() => {
        this.setState({ resourcesLoaded: doctype.id });
      });
    }
    /*if(Object.entries(this.state.notifies || {}).length) {
      this.setState({ notifies: {} });
    }*/
  }

  componentDidMount() {
    loopar.rootApp = this;
  }

  mergeDocument() {
    const updateValue = (structure, document) => {
      return structure.map((el) => {
        if (Object.keys(document).includes(el.data?.name)) {
          const value = document[el.data.name];

          if (el.element === FORM_TABLE) {
            if (value.rows) {
              Object.assign(el, value);
            } else {
              el.rows = value;
            }
          } else {
            el.data.value = value;
          }
        }

        el.elements = updateValue(el.elements || [], document);
        return el;
      });
    };

    const documents = this.state.documents || {};
    Object.values(documents).forEach((document) => {
      if (document.meta.__DOCTYPE__ && document.meta.__DOCUMENT__) {
        document.meta.__DOCTYPE__.STRUCTURE = updateValue(
          JSON.parse(document.meta.__DOCTYPE__.doc_structure),
          document.meta.__DOCUMENT__
        );
      }
    });
  }

  updateDocument(key, document, hydrate = true, callback) {
    this.state.documents[key] &&
      (this.state.documents[key].meta.__DOCUMENT__ = document);
    //this.setState({documents: this.state.documents});
  }

  render(content, props) {
    return (
      <>
        <WorkspaceContext
          __META__={this.props.__META__}
          sidebarWidth={this.sidebarWidth ?? 250}
          collapseSidebarWidth={this.collapseSidebarWidth ?? 0}
          headerHeight={this.headerHeight ?? 55}
          menuItems={this.menuItems && this.menuItems() || []}
          ENVIRONMENT={this.props.ENVIRONMENT}
          {...props}
        >
          {this.pace}
          <Dialogs ref={(dialogs) => (this.dialogs = dialogs)} />
          {content}
          <Notifies />
        </WorkspaceContext>
      </>
    );
  }

  setNotify({title, message, type = "info", timeout=5000 }) {
    if(this.notifies[message]) return;

    this.notifies[message] = true;

    setTimeout(() => {
      delete this.notifies[message];
    }, timeout);

    (toast[type] || toast)(title || loopar.utils.Capitalize(type), {
      description: message,
      duration: timeout,
      theme: "light"
    });
  }

  setCountDialogs(count) {
    this.dialogs.setCountDialogs(count);
  }

  emit(event, data) {
    /*Object.values(this.apps).forEach(app => {
         app.emit(event, data);
      });*/
  }

  get pace() {
    const progress = this.state.progress;
    return (
      <div
        className={`pace pace-${
          progress === 0 || progress > 100 ? "active" : "active"
        }`}
        ref={(progress) => (this.progressBarr = progress)}
        style={{ bottom: 0, display: "block" }}
      >
        <div
          className="pace-progress"
          data-progress-text={`${this.state.progress}%`}
          data-progress={this.state.progress}
          style={{
            transform: `translate3d(${this.state.progress}%, 0px, 0px)`,
            top: this.headerHeight || 55,
          }}
        >
          <div className="pace-progress-inner" />
        </div>
      </div>
    );

    /*return [
         div({
            className: `pace pace-${progress === 0 || progress > 100 ? 'active' : 'active'}`,
            ref: progress => this.progressBarr = progress,
            style: { bottom: 0, display: "block" }
         }, [
            div({
               className: "pace-progress", "data-progress-text": `${this.state.progress}%`,
               "data-progress": this.state.progress,
               style: { transform: `translate3d(${this.state.progress}%, 0px, 0px)`, top: this.headerHeight || 55 }
            }, [
               div({ className: "pace-progress-inner" })
            ]),
            //div({className: "pace-activity"})
         ])
      ]*/
  }

  progress(to) {
    let progress = this.stateProgress + this.increment * 0.1;
    this.increment += 1;

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

    progress < to && progress > 0 && setTimeout(() => this.progress(to), 0);
  }

  freeze(freeze = true) {
    this.setState({ freeze });
  }

  setDialog(dialog) {
    this.dialogs.setDialog(dialog);
  }

  closeDialog(id) {
    this.dialogs.closeDialog(id);
  }

  get meta() {
    return this.state.meta || this.props.meta || {};
  }

  navigate(url) {
    loopar.navigate(url);
    loopar.currentPageName = url;
    this.setState({});
  }
}
