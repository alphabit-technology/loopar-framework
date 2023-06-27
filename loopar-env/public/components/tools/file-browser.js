
import { div, span, i, h4, button, File_uploader, Tabs, nav, ol, li, a} from "/components/elements.js";
import {Modal} from "/components/common/dialog.js";
import { loopar } from "/loopar.js";
import {fileManager} from "/components/tools/file-manager.js";
import { FilePreview } from "../base/file-preview.js";
import { FileContainer } from "../base/file-container.js";
import {element_manage} from "../element-manage.js";

class FileBrowserClass extends React.Component {
   history = [];

   constructor(props) {
      super(props);

      this.state = {
         originalFiles: props.files || [],
         files: props.files || [],
         isFetchingFiles: true,
         currentRoute: null,
         uploading: false,
      }
   }

   async fetchFiles(route = null) {
      if (route){
         this.history[route] = route;

         const keys = Object.keys(this.history);
         const startIndex = keys.indexOf(route);

         if (startIndex !== -1) {
            const keysToDelete = keys.slice(startIndex + 1);
            keysToDelete.forEach((key) => {
               delete this.history[key];
            });
         }
      }else{
         this.history = {}
      }

      const fetchRoute = Object.values(this.history).join("/");

      loopar.method('File Manager', 'files', { route: fetchRoute }).then((r) => {
         this.setState({
            isFetchingFiles: false,
            files: r.meta.files,
            currentRoute: route
         });
      });
   }

   componentDidMount() {
      if(this.props.files && this.props.files.length > 0){
         this.setState({
            isFetchingFiles: false,
            files: this.props.files,
            currentRoute: null
         });
      }else{
         this.fetchFiles();
      }
   }

   /*typeByExt(ext) {
      return fileManager.getTypeByExtension(ext);
   }

   iconByExt(ext) {
      return fileManager.getIconByExtention(ext);
   }*/

   breadcrumbs(){
      return [
         nav([
            ol({className: "breadcrumb"}, [
               li({className: "breadcrumb-item active"}, [
                  a({
                     href: "#",
                     onClick: (e) => {
                        e.preventDefault();
                        this.fetchFiles();
                     }
                  }, [
                     i({className: "breadcrumb-icon fa fa-angle-left mr-2"}),
                     "Layouts"
                  ]),
               ]),
               ...Object.values(this.history).map((route) => {
                  return [
                     li({className: "breadcrumb-item active"}, [
                        a({
                           onClick: (e) => {
                              e.preventDefault();
                              this.fetchFiles(route);
                           }
                        }, [
                           route
                        ])
                     ])
                  ]
               })
            ])
         ]),
      ]
   }

   header() {
      return [
         div({className: "page-title-bar fixed"}, [
            div({className: "col-12"}, [
               div({className: "row align-items-center"}, [
                  div({className: "col-md-6 col-12"}, [
                     this.props.has_title ? div({className: "page-title"}, [
                        h4({}, "File Manager"),
                        //this.breadcrumbs()
                     ]) :
                     div({className: "btn-group"}, [
                        button({
                           className: "btn btn-success btn-sm mr-1",
                           onClick: (e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              this.fetchFiles();
                           }
                        }, [
                           i({ className: "fa fa-home mr-2" }),
                           "Home"
                        ]),
                        Object.values(this.history).map((route) => {
                           return [
                              button({
                                 className: "btn btn-primary btn-sm mr-1",
                                 onClick: (e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    this.fetchFiles(route);
                                 }
                              }, [
                                 i({ className: "fa fa-angle-right mr-1" }),
                                 route
                              ])
                           ]
                        }),
                     ]),
                     this.props.has_title ? this.breadcrumbs() : null
                     //this.breadcrumbs()
                  ]),
                  div({className: "col-md-6 col-12"}, [
                     div({className: "breadcrumb-bar text-right"}, [
                        div({className: "btn-group"}, [
                           button({
                              className: "btn btn-secondary btn-sm mr-1",
                              onClick: (e) => {
                                 e.preventDefault();
                                 e.stopPropagation();
                                 this.setState({uploading: true});
                              }
                           }, [
                              i({ className: "fa fa-upload mr-2" }),
                              "Upload"
                           ]),
                           /*button({
                              className: "btn btn-secondary btn-sm mr-1",
                              onClick: (e) => {
                                 e.preventDefault();
                                 this.setState({uploading: true});
                              }
                           }, [
                              i({ className: "fa fa-folder mr-2" }),
                              "New Folder"
                           ]),*/
                        ])
                     ])
                  ])
               ])
            ]),
         ])
      ]
   }

   get files(){
      return fileManager.getMappedFiles(this.state.files);
   }

   render() {
      const files = this.files;
      return [
         div({className: "",}, [
            div({className: "pt-0 pb-8"},[
               this.header(),
            ]),
            FileContainer({
               height: '100%',
            }, [
               this.state.isFetchingFiles ? h4({}, "Loading Files...") : (
                  files.length === 0 ? [
                        div({className: "col-12 text-center tex-dark", style: {opacity: 0.6}}, [
                           span({className: "fa fa-folder-open fa-3x pt-5 pb-3"}),
                           h4({}, "No files found.")
                        ])
                     ] :
                     files.map((file) => {
                        return FilePreview({
                           //key: element_manage.getUniqueKey(),
                           file: file,
                           selected: file.selected,
                           onSelect: (file) => {
                              if (file.type === "folder") {
                                 this.fetchFiles(file.name);
                              } else {
                                 this.setFileSelected(file, file.selected);
                              }
                           }
                        });
                     })
               )
            ]),
            this.state.uploading ? File_uploader({
               //key: element_manage.getUniqueKey(),
               meta: {
                  data: {
                     name: "file",
                     label: "File",
                     placeholder: "Select file",
                     accept: "*",
                     multiple: true,
                  }
               },
               inModal: true,
               onUpload: () => {
                  this.fetchFiles();
               },
               onClose: () => {
                  this.setState({uploading: false});
               },
            }) : null,
         ])
      ]
   }

   isValidFileType(file, acceptedTypes) {
      const fileType = file.type;
      const fileExtension = file.extension;
      acceptedTypes = Array.isArray(acceptedTypes) ? acceptedTypes : acceptedTypes.split(',');

      for (let i = 0; i < acceptedTypes.length; i++) {
         const acceptedType = acceptedTypes[i];

         if (acceptedType === fileType || acceptedType === fileExtension || acceptedType === '*/*') {
            return true;
         }

         if (acceptedType.endsWith('/*') && fileType.startsWith(acceptedType.slice(0, -2))) {
            return true;
         }
      }

      return false;
   }

   multiple(){
      return typeof this.props.multiple === "undefined" ? true : this.props.multiple;
   }

   setFileSelected(file, selected) {
      const files = this.files;
      const index = files.findIndex((f) => f.name === file.name);

      if(!this.multiple()){
         files.forEach((f) => {
            f.selected = false;
            //return f;
         });
      }

      if (index !== -1) {
         const file = files[index];
         files[index].selected = selected;

         if(this.props.accept && !this.isValidFileType(file, this.props.accept)){
            files[index].selected = false

            loopar.dialog({
               type: "error",
               title: "Invalid file type",
               content: `You can only select ${this.props.accept} files`
            });
         }

         this.setState({ files });
      }
   }
}

class FileBrowserModalClass extends FileBrowserClass {
   constructor(props) {
      super(props);
   }

   render() {
      return Modal({
         icon: "fas fa-folder-open",
         position: "top",
         size: "lg",
         title: "File Browser",
         scrollable: true,
         open: this.props.open,
         onClose: () => {
            this.props.onClose && this.props.onClose();
         },
         buttons: [
            {
               name: "ok",
               text: "Select",
               onClick: () => {
                  const files = this.state.files.filter((f) => f.selected);
                  this.props.onSelect && this.props.onSelect(files);
                  this.props.onClose && this.props.onClose();
               }
            }
         ],
         content: [
            super.render()
         ]
      });
   }
}

export const FileBrowserModal = (props) => {
   return React.createElement(FileBrowserModalClass, props);
}

export const FileBrowser = (props) => {
   return React.createElement(FileBrowserClass, props);
}