import { Modal } from "@dialog";
import loopar from "loopar";
import FileContainer from "@file-container";
import React from "react";

export class FileBrowser extends React.Component {
  history = [];

  constructor(props) {
    super(props);

    this.state = {
      originalFiles: props.files || [],
      files: props.files || [],
      isFetchingFiles: true,
      currentRoute: null,
      uploading: false,
      metaIsLoaded: false,
    };
  }

  async fetchFiles(route = null) {
    if (route) {
      this.history[route] = route;

      const keys = Object.keys(this.history);
      const startIndex = keys.indexOf(route);

      if (startIndex !== -1) {
        const keysToDelete = keys.slice(startIndex + 1);
        keysToDelete.forEach((key) => {
          delete this.history[key];
        });
      }
    } else {
      this.history = {};
    }

    const fetchRoute = Object.values(this.history).join("/");

    /*loopar.method('File Manager', 'files', { route: fetchRoute }).then((r) => {
         this.setState({
            isFetchingFiles: false,
            files: r.meta.files,
            currentRoute: route
         });
      });*/

    /*const component = await loopar.method("File Manager", "list");
      this.setState({
         meta: component.meta,
         isFetchingFiles: false,
         component: this.state.component || await import(`./${component.client_importer}`),
      });*/
  }

  async getMeta() {
    if (!this.state.metaIsLoaded) {
      //const meta = await loopar.getMeta("File Manager", "list");
      //console.log(["meta", meta]);
      /*this.setState({   
          metaIsLoaded: true,
          meta: meta,
          //isFetchingFiles: false,
          component: this.state.component || await import(meta.client_importer),
        });*/
    }
  }

  componentDidMount() {
    this.getMeta();
    /*if (this.props.files && this.props.files.length > 0) {
         this.setState({
            isFetchingFiles: false,
            files: this.props.files,
            currentRoute: null
         });
      } else {
         this.fetchFiles();
      }*/
  }

  /*typeByExt(ext) {
      return fileManager.getTypeByExtension(ext);
   }

   iconByExt(ext) {
      return fileManager.getIconByExtention(ext);
   }*/

  breadcrumbs() {
    return (
      <nav className="flex pb-1" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse">
          {Object.values(this.history).map((route) => (
            <li className="inline-flex items-center">
              <Link
                variant="link"
                className="px-0"
                onClick={(e) => {
                  e.preventDefault();
                  this.fetchFiles(route);
                }}
              >
                {route}
              </Link>
            </li>
            /*<li className="breadcrumb-item active" key={route}>
              <a
                onClick={(e) => {
                  e.preventDefault();
                  this.fetchFiles(route);
                }}
              >
                {route}
              </a>
            </li>*/
          ))}
        </ol>
      </nav>
      /*<nav>
        <ol className="breadcrumb">
          <li className="breadcrumb-item active">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                this.fetchFiles();
              }}
            >
              <i className="breadcrumb-icon fa fa-angle-left mr-2"></i>
              Layouts
            </a>
          </li>
          {Object.values(this.history).map((route) => (
            <li className="breadcrumb-item active" key={route}>
              <a
                onClick={(e) => {
                  e.preventDefault();
                  this.fetchFiles(route);
                }}
              >
                {route}
              </a>
            </li>
          ))}
        </ol>
      </nav>*/
    );
  }

  header() {
    return (
          <div className="flex flex-row align-middle">
            <div className="">
              {this.props.hasTitle ? (
                <div className="page-title">
                  <h4>File Manager</h4>
                  {/*this.breadcrumbs()*/}
                </div>
              ) : (
                <div className="btn-group">
                  <button
                    className="btn btn-success btn-sm mr-1"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      this.fetchFiles();
                    }}
                  >
                    <i className="fa fa-home mr-2"></i>
                    Home
                  </button>
                  {Object.values(this.history).map((route) => (
                    <button
                      className="btn btn-primary btn-sm mr-1"
                      key={route}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        this.fetchFiles(route);
                      }}
                    >
                      <i className="fa fa-angle-right mr-1"></i>
                      {route}
                    </button>
                  ))}
                </div>
              )}
              {this.props.hasTitle ? this.breadcrumbs() : null}
              {/*this.breadcrumbs()*/}
            </div>
            <div className="">
              <div className="breadcrumb-bar text-right">
                <div className="btn-group">
                  <button
                    className="btn btn-secondary btn-sm mr-1"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      this.setState({ uploading: true });
                    }}
                  >
                    <i className="fa fa-upload mr-2"></i>
                    Upload
                  </button>
                  {/*<button
                  className="btn btn-secondary btn-sm mr-1"
                  onClick={(e) => {
                    e.preventDefault();
                    this.setState({ uploading: true });
                  }}
                >
                  <i className="fa fa-folder mr-2"></i>
                  New Folder
                </button>*/}
                </div>
              </div>
            </div>
          </div>
    );
  }

  get files() {
    return this.filesRef?.getFiles() || [];
  }

  getSelectedFiles() {
    const selectsFiles = this.filesRef?.getSelectedFiles() || [];
    return this.files.filter((file) => selectsFiles.includes(file.name));
  }

  render() {
    const { component, rows = [], metaIsLoaded } = this.state;
    const files = rows;

    return (
      <>
        <div className="pt-0 pb-8">{this.header()}</div>
        <FileContainer height="100%">
          {!metaIsLoaded ? (
            <h4>Loading Files...</h4>
          ) : files.length === 0 ? (
            <div
              className="col-12 text-center tex-dark"
              style={{ opacity: 0.6 }}
            >
              <span className="fa fa-folder-open fa-3x pt-5 pb-3"></span>
              <h4>No files found.</h4>
            </div>
          ) : component ? (
            React.createElement(this.state.component.default, {
              meta: this.state.meta,
              modal: true,
              onlyGrid: true,
              accept: this.props.accept || "/*",
              multiple: this.props.multiple,
              ref: (ref) => {
                this.filesRef = ref;
              },
            })
          ) : null}
        </FileContainer>
        {this.state.uploading ? (
          <FileUploader
            data={{
              name: "file",
              label: "File",
              placeholder: "Select file",
              accept: "*",
              multiple: true,
            }}
            inModal={true}
            onUpload={() => {
              this.fetchFiles();
            }}
            onClose={() => {
              this.setState({ uploading: false });
            }}
          />
        ) : null}
      </>
    );
  }

  isValidFileType(file, acceptedTypes) {
    const fileType = file.type;
    const fileExtension = file.extension;
    acceptedTypes = Array.isArray(acceptedTypes)
      ? acceptedTypes
      : acceptedTypes.split(",");

    for (let i = 0; i < acceptedTypes.length; i++) {
      const acceptedType = acceptedTypes[i];

      if (
        acceptedType === fileType ||
        acceptedType === fileExtension ||
        acceptedType === "*/*"
      ) {
        return true;
      }

      if (
        acceptedType.endsWith("/*") &&
        fileType.startsWith(acceptedType.slice(0, -2))
      ) {
        return true;
      }
    }

    return false;
  }

  multiple() {
    return typeof this.props.multiple === "undefined"
      ? true
      : this.props.multiple;
  }

  /*setFileSelected(file, selected) {
      const files = this.files;
      const index = files.findIndex((f) => f.name === file.name);
      
      if (!this.multiple()) {
         files.forEach((f) => {
            f.selected = false;
            //return f;
         });
      }

      if (index !== -1) {
         const file = files[index];
         files[index].selected = selected;

         if (this.props.accept && !this.isValidFileType(file, this.props.accept)) {
            files[index].selected = false

            loopar.dialog({
               type: "error",
               title: "Invalid file type",
               content: `You can only select ${this.props.accept} files`
            });
         }

         this.setState({ files });
      }
   }*/
}

export function FileBrowserModal(props) {
  return (
    <Modal
      position="top"
      size="full"
      title="File Browser"
      scrollable={true}
      open={true}
      onClose={() => {
        props.onClose && props.onClose();
      }}
      buttons={[
        {
          name: "ok",
          text: "Select",
          onClick: () => {
            props.onSelect &&
              props.onSelect(this.getSelectedFiles());
            props.onClose && props.onClose();
          },
        },
      ]}
      content={<FileBrowser {...props} />}
      onShow={() => {
        //this.fetchFiles();
      }}
    />
  );
}
