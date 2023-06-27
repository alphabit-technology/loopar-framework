import {BaseInput} from "../base/base-input.js";
import {button, div, i, p, small, span,} from "/components/elements.js";
import {FileBrowserModal} from "../tools/file-browser.js";
import {FilePreview} from "../base/file-preview.js";
import {fileManager} from "../tools/file-manager.js";
import {FileContainer} from "../base/file-container.js";
import { loopar } from "../../loopar.js";

export default class FileInput extends BaseInput {
   group_element = FILE_INPUT;
   input_type = 'file';
   visible_input = false;

   origins = [
      {name: "Local", icon: "fa-desktop"},
      {name: "Server", icon: "fa-server"},
      {name: "Web", icon: "fa-globe"},
   ]

   constructor(props) {
      super(props);

      this.state = {
         ...this.state,
         multiple: props.multiple || false,
         accept: props.accept || '*',
         dropping: false,
         file_browser: false,
         previews: []
      }
   }

   get files() {
      return fileManager.getMappedFiles(this.data.value);
   }

   clearFiles() {
      this.onChange({target: {files: []}});
   }

   render() {
      let has_files = true;
      const files = this.state.previews;

      if (files.length === 0) {
         has_files = false;
      }

      return super.render([
         div({
            className: `file-drop-zone ${files.length > 0 && !this.state.dropping ? 'has-files' : ''}`,
            style: {height: 'auto', minHeight: '200px'},
            onDragOver: (e) => {
               e.preventDefault();
               this.setState({dropping: true});

            },
            onDragLeave: (e) => {
               e.preventDefault();
               this.setState({dropping: false});
            },
            onDrop: (e) => {
               e.preventDefault();
               this.dropZone.removeClass('drag-over');
               const files = e.dataTransfer.files;
               this.input.node.files = files;

               this.onChange({target: {files: files}});
            },
            ref: (node) => {
               this.dropZone = node;
            }
         }, [
            FileBrowserModal({
               has_tile: false,
               onClose: () => {
                  this.setState({
                     file_browser: false
                  });
               },
               onSelect: (file) => {
                  const files = [...this.files, ...file];
                  //files.push(file);
                  this.onChange({target: {files: (has_files ? files : JSON.stringify(files))}});
                  this.setState({
                     file_browser: false
                  });
               },
               open: this.state.file_browser,
               multiple: this.state.multiple,
               accept: this.state.accept,
               height: 512
            }),
            div({
               className: `${this.state.dropping ? 'drag-over' : ''}`
            }, [
               this.state.dropping ? [
                  span({className: "file-drop-zone-icon"}, "Drop files here!"),
               ] : [
                  files.length === 0 ? [
                     p({className: "file-drop-zone-title mb-2"}, [
                        small({className: "file-drop-zone-subtitle"}, "Drag & Drop or upload from"),
                     ]),
                     p({className: "file-drop-zone-title"}, [
                        div({className: "row"}, [
                           div({className: "col-12"}, [
                              (this.props.origins || this.origins).map((origin) => {
                                 const button_type = origin.name === "Local" ? "secondary" : origin.name === "Server" ? "warning" : "primary";
                                 return button({
                                    className: `btn btn-${button_type} btn-sm mr-1`,
                                    onClick: (e) => {
                                       e.preventDefault();
                                       origin.name === "Local" && this.input.node.click();
                                       origin.name === "Server" && this.setState({file_browser: true});
                                       if(origin.name === "Web"){
                                          loopar.prompt({
                                             title: "Web file",
                                             label: "Enter the URL of the file",
                                             placeholder: "https://",
                                             ok: (url) => {
                                                const file = {name: url.split("/").pop(), src: url};
                                                this.onChange({target: {files: [file]}});
                                             }
                                          });
                                       }
                                    }
                                 }, [
                                    i({className: `fa ${origin.icon} mr-2`}),
                                    origin.name
                                 ])
                              })
                           ])
                        ])
                     ])
                  ] : [
                     div({className: "row"}, [
                        div({className: "col"}, [
                           div({className: "has-clearable"})
                        ]),
                        div({className: "col-auto"}, [
                           button({
                              className: "btn btn-sm btn-danger mr-2",
                              onClick: (e) => {
                                 e.preventDefault();
                                 this.clearFiles();
                              }
                           }, [
                              i({className: "fa fa-trash mr-2"}),
                              "Clear files"
                           ]),
                        ])
                     ]),
                     FileContainer({
                        height: this.props.height || 200,
                     }, [
                        this.state.previews.map((file) => {
                           return FilePreview({
                              file: file,
                              onDelete: (file) => {
                                 this.onChange({target: {files: this.files.filter(f => f.name !== file.name)}});
                              }
                           });
                        })
                     ])
                  ]
               ]
            ])
         ])
      ]);
   }

   getSrc(file, preview = false) {
      return file ? "/uploads/" + (preview ? "thumbnails/" : '') + file.name : '';
   }

   componentDidMount() {
      super.componentDidMount();
      this.input?.addClass('d-none');
      this.makePreviews(this.files);
   }
   
   /*componentDidUpdate(prevProps, prevState, snapshot) {
      super.componentDidUpdate(prevProps, prevState, snapshot);
      if (prevProps.meta !== this.props.meta) {
         this.setState({
            meta: this.props.meta
         });
      }
   }*/

   onChange(e) {
      const data = this.meta.data || {};
      data.value = e.target.files;
      this.state.meta.data = data;

      return new Promise((resolve, reject) => {
         this.setState({meta: this.state.meta, dropping: false}, () => {
            this.makePreviews();
            this.props.onChange && this.props.onChange(e);
            resolve();
         });
      });
   }

   makePreviews() {
      const files = this.files;

      const promises = Array.from(files).map((file) => {
         return new Promise((resolve, reject) => {
            if (file instanceof File) {
               if (file.type.match('image.*')) {
                  const reader = new FileReader();

                  reader.onload = (e) => {
                     const imageFile = {name: file.name, src: e.target.result, type: "image"}
                     resolve(imageFile);
                  };

                  reader.onerror = (e) => {
                     reject(e);
                  };

                  return reader.readAsDataURL(file);
               } else {
                  const fileFile = {name: file.name, src: this.getSrc(file), type: "file"}
                  resolve(fileFile);
               }
            } else {
               return resolve(file);
            }
         });
      });

      Promise.all(promises).then((previews) => {
         this.setState({previews});
      }).catch((error) => {
         console.error('Error reading files:', error);
      });
   }

   val() {
      return this.state.meta.data.value;
   }

   get mappedFiles() {
      return this.state.previews;
   }
}