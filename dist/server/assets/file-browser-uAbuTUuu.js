var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { Modal } from "./dialog-nmg_tOQf.js";
import { l as loopar, B as Button } from "../entry-server.js";
import React__default from "react";
import "./scroll-area-5SWWHlEI.js";
import DivComponent from "./div-rCeXGfsc.js";
import { B as BaseInput } from "./base-input-uYDrqEOF.js";
import { f as fileManager } from "./file-manager-elzUYIBp.js";
import LazyLoad from "react-lazy-load";
import { c as createLucideIcon } from "./createLucideIcon-SgSXnVj5.js";
import { F as FormLabel, a as FormControl, b as FormDescription, d as FormMessage } from "./form-z4zN6fsS.js";
import { G as Globe2 } from "./globe-2-q99urLW1.js";
import { T as Trash2 } from "./element-title-oSDJ5F20.js";
import { F as FormWrapper } from "./form-1mb5BBtU.js";
/**
 * @license lucide-react v0.299.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Database = createLucideIcon("Database", [
  ["ellipse", { cx: "12", cy: "5", rx: "9", ry: "3", key: "msslwz" }],
  ["path", { d: "M3 5V19A9 3 0 0 0 21 19V5", key: "1wlel7" }],
  ["path", { d: "M3 12A9 3 0 0 0 21 12", key: "mv7ke4" }]
]);
/**
 * @license lucide-react v0.299.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const File$1 = createLucideIcon("File", [
  [
    "path",
    { d: "M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z", key: "1nnpy2" }
  ],
  ["polyline", { points: "14 2 14 8 20 8", key: "1ew0cm" }]
]);
/**
 * @license lucide-react v0.299.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Image = createLucideIcon("Image", [
  ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2", ry: "2", key: "1m3agn" }],
  ["circle", { cx: "9", cy: "9", r: "2", key: "af1f0g" }],
  ["path", { d: "m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21", key: "1xmnt7" }]
]);
/**
 * @license lucide-react v0.299.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const MonitorUp = createLucideIcon("MonitorUp", [
  ["path", { d: "m9 10 3-3 3 3", key: "11gsxs" }],
  ["path", { d: "M12 13V7", key: "h0r20n" }],
  ["rect", { width: "20", height: "14", x: "2", y: "3", rx: "2", key: "48i651" }],
  ["path", { d: "M12 17v4", key: "1riwvh" }],
  ["path", { d: "M8 21h8", key: "1ev6f3" }]
]);
/**
 * @license lucide-react v0.299.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const UploadCloud = createLucideIcon("UploadCloud", [
  ["path", { d: "M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242", key: "1pljnt" }],
  ["path", { d: "M12 12v9", key: "192myk" }],
  ["path", { d: "m16 16-4-4-4 4", key: "119tzi" }]
]);
/**
 * @license lucide-react v0.299.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Upload = createLucideIcon("Upload", [
  ["path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4", key: "ih7n3h" }],
  ["polyline", { points: "17 8 12 3 7 8", key: "t8dd8p" }],
  ["line", { x1: "12", x2: "12", y1: "3", y2: "15", key: "widbto" }]
]);
function FileContainer(props) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      className: "w-full h-full bg-background p-4 overflow-auto",
      children: /* @__PURE__ */ jsx("div", { className: "relative", children: /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-6 justify-center", children: props.children }) })
    }
  );
}
class ImageWithFallback extends React__default.Component {
  constructor(props) {
    super(props);
    this.state = {
      imageLoaded: false,
      isValidImage: false,
      isImageLoading: true
    };
  }
  handleImageError(e) {
    console.log("Image error", e);
    this.setState({ imageLoaded: false, isValidImage: false, isImageLoading: false });
  }
  handleImageLoad() {
    this.setState({ imageLoaded: true, isImageLoading: false, isValidImage: true });
  }
  render() {
    const { imageLoaded } = this.state;
    return /* @__PURE__ */ jsx(
      LazyLoad,
      {
        height: 120,
        offset: 100,
        debounce: false,
        throttle: 100,
        once: true,
        className: "rounded-md inset-0 bg-gradient-to-b from-slate-900/70 to-slate-500/80 bg-no-repeat",
        children: /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx(
            Image,
            {
              height: 100,
              className: `h-120 w-full object-cover transition-all ease-in text-slate-600/50  duration-300 hover:scale-105 aspect-square ${imageLoaded ? "hidden" : "block"}`
            }
          ),
          /* @__PURE__ */ jsx("div", { className: "overflow-hidden rounded-md w-full", children: /* @__PURE__ */ jsx(
            "img",
            {
              alt: "React Rendezvous",
              loading: "lazy",
              height: !imageLoaded ? 0 : "150",
              decoding: "async",
              "data-nimg": "1",
              className: `h-auto w-auto object-cover transition-all hover:scale-105 aspect-square`,
              srcSet: this.props.src,
              style: { color: "transparent", ...!imageLoaded ? { width: 0, height: 0 } : {} },
              onLoad: () => this.handleImageLoad(),
              onError: this.handleImageError
            }
          ) })
        ] })
      }
    );
  }
}
class FilePreview extends React__default.Component {
  constructor(props) {
    super(props);
    this.state = {
      selected: props.selected
    };
  }
  /*getSrc(file, preview = false) {
     return "/uploads/" + (preview ? "thumbnails/" : '') + file.name;
  }*/
  getSrc(preview = false) {
    return "/uploads/" + (preview ? "thumbnails/" : "") + this.file.name;
  }
  get file() {
    return this.props.file;
  }
  get extention() {
    return fileManager.getExtention(this.file);
  }
  get type() {
    return fileManager.getFileType(this.file);
  }
  get icon() {
    return fileManager.getIconByExtention(this.extention, this.type);
  }
  get name() {
    return this.file.name;
  }
  get size() {
    return fileManager.getFileSize(this.file);
  }
  get isSelected() {
    return this.state.selected;
  }
  get attributes() {
    return {
      ...this.file,
      selected: this.isSelected
    };
  }
  componentDidUpdate(prevProps, prevState, snapshot) {
    if (prevProps.selected !== this.props.selected) {
      this.setState({
        selected: this.props.selected
      });
    }
  }
  get docRef() {
    return this.props.docRef;
  }
  get grid() {
    return this.props.grid;
  }
  render() {
    const { type, icon, file } = this;
    const data = this.props.file;
    return /* @__PURE__ */ jsxs(
      "div",
      {
        className: "w-[150px] bg-card border p-2 rounded-md shadow-sm hover:shadow-md transition-all cursor-pointer relative",
        onClick: () => {
          this.select(!this.isSelected);
        },
        children: [
          /* @__PURE__ */ jsxs(Fragment, { children: [
            type === "image" ? /* @__PURE__ */ jsx(
              ImageWithFallback,
              {
                className: "img-fluid",
                src: file.previewSrc || file.src,
                fallbackSrc: "/assets/images/blank-image.svg",
                alT: data.name
              }
            ) : null,
            type !== "image" ? /* @__PURE__ */ jsx(File$1, {}) : null
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-1 text-sm pt-2", children: [
            /* @__PURE__ */ jsx("h3", { className: "font-medium leading-none truncate", children: data.name }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: data.size })
          ] })
        ]
      }
    );
  }
  isValidFileType(acceptedTypes = "*/*") {
    const fileType = this.type;
    const fileExtension = this.extention;
    acceptedTypes = Array.isArray(acceptedTypes) ? acceptedTypes : acceptedTypes.split(",");
    for (let i = 0; i < acceptedTypes.length; i++) {
      const acceptedType = acceptedTypes[i];
      if (acceptedType === fileType || acceptedType === fileExtension || acceptedType === "*/*") {
        return true;
      }
      if (acceptedType.endsWith("/*") && fileType.startsWith(acceptedType.slice(0, -2))) {
        return true;
      }
    }
    return false;
  }
  multiple() {
    return typeof this.props.multiple === "undefined" ? true : this.props.multiple;
  }
  /*setFileSelected(selected) {
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
  select(selected) {
    const data = this.props.file;
    if (this.isValidFileType(this.props.accept) === false) {
      loopar.notify(`You can only select ${this.props.accept} files`, "danger");
      selected = false;
    }
    if (this.grid) {
      if (this.props.multiple === false) {
        Object.values(this.docRef.filesRefs).forEach((ref) => {
          ref && ref !== this && ref.setState({ selected: false });
        });
        this.grid.clearSelection(() => {
          this.grid.selectRow(data, selected);
        });
      } else {
        this.grid.selectRow(data, selected);
      }
    }
    this.setState({ selected }, () => {
    });
  }
}
class FileInput extends BaseInput {
  constructor(props) {
    super(props);
    __publicField(this, "groupElement", FILE_INPUT);
    __publicField(this, "inputType", "file");
    __publicField(this, "visibleInput", false);
    __publicField(this, "origins", [
      { name: "Local", icon: MonitorUp, color: "bg-secondary" },
      { name: "Server", icon: Database, color: "bg-warning" },
      { name: "Web", icon: Globe2, color: "bg-primary" },
      { name: "Trash", icon: Trash2, color: "bg-danger" }
    ]);
    this.state = {
      ...this.state,
      dropping: false,
      fileBrowser: false,
      previews: [],
      loaded: false
    };
  }
  get accept() {
    return this.data.accept || "/*";
  }
  get files() {
    return fileManager.getMappedFiles(this.value());
  }
  /*clearFiles() {
    this.onChange({ target: { files: [] } });
  }*/
  get FileBrowserModal() {
    return /* @__PURE__ */ jsx(Fragment, { children: /* @__PURE__ */ jsx(
      FileBrowserModal,
      {
        hasTitle: false,
        onClose: () => {
          this.setState({
            fileBrowser: false
          });
        },
        onSelect: (file) => {
          const files = [...this.files, ...file];
          this.onChange({
            target: { files: hasFiles ? files : JSON.stringify(files) }
          });
          this.setState({
            fileBrowser: false
          });
        },
        open: this.state.fileBrowser,
        multiple: this.props.data.multiple,
        accept: this.accept,
        height: 512
      }
    ) });
  }
  getPreviews() {
    return this.state.previews || [];
  }
  DroppbleArea(files, handleChange, handleClearFiles) {
    return /* @__PURE__ */ jsx(Fragment, { children: /* @__PURE__ */ jsxs(
      "div",
      {
        className: `h-full bg-background/50 flex ${files.length === 0 ? "flex-col" : "flex-row"} items-center justify-center ${this.state.dropping ? "drag-over" : ""}`,
        onDragOverCapture: (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.setState({ dropping: true });
        },
        onDragLeaveCapture: (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.setState({ dropping: false });
        },
        onDrop: (e) => {
          e.preventDefault();
          e.stopPropagation();
          const files2 = e.dataTransfer.files;
          handleChange({ target: { files: files2 } });
        },
        children: [
          this.state.dropping ? /* @__PURE__ */ jsxs("div", { className: "w-full flex flex-col items-center text-lg", children: [
            /* @__PURE__ */ jsx(UploadCloud, { className: "w-12 h-12" }),
            "Drop files here!"
          ] }) : this.state.loaded ? /* @__PURE__ */ jsxs(Fragment, { children: [
            files.length === 0 && /* @__PURE__ */ jsx("div", { className: "mb-2", children: /* @__PURE__ */ jsx("small", { className: "text-lg text-center", children: "Drag & Drop or upload from" }) }),
            /* @__PURE__ */ jsx("div", { className: `flex ${files.length === 0 ? "flex-row" : "flex-col"} gap-2`, children: this.origins.map((origin) => {
              const refOrigin = this.props.origins;
              if (files.length === 0 && origin.name === "Trash")
                return null;
              if (refOrigin && refOrigin.length > 0 && !refOrigin.includes(origin.name))
                return null;
              const Icon = origin.icon;
              const size = files.length === 0 ? "w-16" : "w-12";
              return /* @__PURE__ */ jsxs(
                "button",
                {
                  className: `flex ${size} flex-col items-center rounded-sm border bg-card p-2 shadow cursor-pointer transition-colors hover:bg-muted/50`,
                  onClick: (e) => {
                    e.preventDefault();
                    if (origin.name === "Local")
                      return this.input.click();
                    if (origin.name === "Server")
                      return this.setState({ fileBrowser: true });
                    if (origin.name === "Web") {
                      return loopar.prompt({
                        title: "Web file",
                        label: "Enter the URL of the file",
                        placeholder: "https://",
                        ok: (url) => {
                          const file = {
                            name: url.split("/").pop(),
                            src: url
                          };
                          handleChange({
                            target: { files: [file] }
                          });
                        }
                      });
                    }
                    if (origin.name === "Trash") {
                      handleClearFiles();
                    }
                  },
                  children: [
                    /* @__PURE__ */ jsx(Icon, {}),
                    files.length === 0 && origin.name
                  ]
                }
              );
            }) })
          ] }) : /* @__PURE__ */ jsx("span", { className: "file-drop-zone-icon" }),
          /* @__PURE__ */ jsxs(Fragment, { children: [
            files.length > 0 && /* @__PURE__ */ jsx(FileContainer, { children: this.getPreviews().map((file) => /* @__PURE__ */ jsx(
              FilePreview,
              {
                file,
                onDelete: (file2) => {
                  this.onChange({
                    target: {
                      files: this.files.filter(
                        (f) => f.name !== file2.name
                      )
                    }
                  });
                }
              }
            )) }),
            this.FileBrowserModal
          ] })
        ]
      }
    ) });
  }
  render() {
    const files = this.getPreviews();
    const data = this.data;
    if (files.length === 0)
      ;
    const mergeFiles = (files2 = this.files, newFiles) => {
      if (this.props.data.multiple)
        return [...files2, ...newFiles].filter((file, index, self) => {
          return index === self.findIndex((f) => f.name === file.name && f.size === file.size);
        });
      return Array.isArray(newFiles) ? [newFiles[0]] : Array.isArray(files2) ? [files2[0]] : [];
    };
    const handleChange = (e) => {
      this.value(mergeFiles(this.files, Array.from(e.target.files)));
    };
    const handleClearFiles = () => {
      loopar.confirm("Are you sure you want to delete all files?", () => {
        this.value(null);
      });
    };
    return this.renderInput((field) => {
      return /* @__PURE__ */ jsxs(Fragment, { children: [
        this.hasLabel() && /* @__PURE__ */ jsx(FormLabel, { children: data.label }),
        /* @__PURE__ */ jsx(FormControl, { children: /* @__PURE__ */ jsx(
          "div",
          {
            className: `w-full h-10 sm:p-3 p-5 border shadow-md bg-slate-300/50 dark:bg-slate-700/50 ${files.length > 0 && !this.state.dropping ? "has-files" : ""}`,
            style: { minHeight: 270 },
            children: /* @__PURE__ */ jsxs("div", { className: "w-full h-full bg-background p-2", children: [
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "file",
                  className: "hidden",
                  onChange: (e) => {
                    handleChange(e);
                  },
                  multiple: this.props.data.multiple,
                  accept: this.accept,
                  ref: (node) => {
                    this.input = node;
                  }
                }
              ),
              this.DroppbleArea(files, handleChange, handleClearFiles)
            ] })
          }
        ) }),
        /* @__PURE__ */ jsx(FormDescription, { children: data.description }),
        /* @__PURE__ */ jsx(FormMessage, {})
      ] });
    });
  }
  getSrc(file, preview = false) {
    return file ? "/uploads/" + (preview ? "thumbnails/" : "") + file.name : "";
  }
  componentDidMount() {
    super.componentDidMount();
    this.makePreviews(this.files);
  }
  onChange(e) {
    this.makePreviews();
  }
  makePreviews() {
    const files = this.files;
    const promises = Array.from(files).map((file) => {
      return new Promise((resolve, reject) => {
        if (file instanceof File) {
          if (file.type.match("image.*")) {
            const reader = new FileReader();
            reader.onload = (e) => {
              const imageFile = {
                name: file.name,
                src: e.target.result,
                type: "image"
              };
              resolve(imageFile);
            };
            reader.onerror = (e) => {
              reject(e);
            };
            return reader.readAsDataURL(file);
          } else {
            const fileFile = {
              name: file.name,
              src: this.getSrc(file),
              type: "file"
            };
            resolve(fileFile);
          }
        } else {
          return resolve(file);
        }
      });
    });
    Promise.all(promises).then((previews) => {
      this.setState({ previews, loaded: true, dropping: false });
    }).catch((error) => {
      this.setState({ loaded: true, dropping: false });
      console.error("Error reading files:", error);
    });
  }
  /*val() {
    return this.state.meta.data.value;
  }*/
  get mappedFiles() {
    return this.getPreviews();
  }
  get metaFields() {
    return [
      {
        group: "custom",
        elements: {
          accept: { element: INPUT },
          multiple: { element: SWITCH }
        }
      }
    ];
  }
}
const fileInput = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: FileInput
}, Symbol.toStringTag, { value: "Module" }));
class FileUploader extends DivComponent {
  constructor(props) {
    super(props);
    __publicField(this, "origins", ["Local", "Trash"]);
    this.state = {
      ...this.state,
      multiple: true,
      accept: "*",
      withoutLabel: true
    };
  }
  FileInput() {
    return /* @__PURE__ */ jsx(FormWrapper, { children: /* @__PURE__ */ jsx(
      FileInput,
      {
        dontHaveForm: true,
        data: {
          name: "file_upload_input",
          label: "Upload",
          multiple: this.state.multiple,
          accept: this.state.accept
        },
        withoutLabel: true,
        origins: this.origins,
        ref: (ref) => {
          this.fileInput = ref;
        }
      }
    ) });
  }
  render() {
    return super.render(
      this.props.inModal ? /* @__PURE__ */ jsxs(
        Modal,
        {
          icon: "fas fa-folder-open",
          position: "top",
          size: "lg",
          title: "File Uploader",
          open: true,
          onClose: () => {
            this.props.onClose && this.props.onClose();
          },
          children: [
            /* @__PURE__ */ jsx("div", { children: this.FileInput() }),
            /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsxs(
              Button,
              {
                variant: "secondary",
                onClick: () => {
                  this.upload();
                },
                children: [
                  /* @__PURE__ */ jsx(Upload, { className: "w-10 pr-3" }),
                  "Upload"
                ]
              }
            ) })
          ]
        }
      ) : this.FileInput()
    );
  }
  get files() {
    var _a;
    return ((_a = this.fileInput) == null ? void 0 : _a.files) || [];
  }
  upload() {
    const formData = new FormData();
    this.files.forEach((file) => {
      formData.append("files[]", file);
    });
    loopar.method("File Manager", "upload", formData).then((r) => {
      this.props.onUpload && this.props.onUpload();
    });
  }
}
const fileUploader = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: FileUploader
}, Symbol.toStringTag, { value: "Module" }));
class FileBrowser extends React__default.Component {
  constructor(props) {
    super(props);
    __publicField(this, "history", []);
    this.state = {
      originalFiles: props.files || [],
      files: props.files || [],
      isFetchingFiles: true,
      currentRoute: null,
      uploading: false,
      metaIsLoaded: false
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
    Object.values(this.history).join("/");
  }
  async getMeta() {
    if (!this.state.metaIsLoaded) {
      await loopar.getMeta("File Manager", "list");
    }
  }
  componentDidMount() {
    this.getMeta();
  }
  /*typeByExt(ext) {
        return fileManager.getTypeByExtension(ext);
     }
  
     iconByExt(ext) {
        return fileManager.getIconByExtention(ext);
     }*/
  breadcrumbs() {
    return /* @__PURE__ */ jsx("nav", { children: /* @__PURE__ */ jsxs("ol", { className: "breadcrumb", children: [
      /* @__PURE__ */ jsx("li", { className: "breadcrumb-item active", children: /* @__PURE__ */ jsxs(
        "a",
        {
          href: "#",
          onClick: (e) => {
            e.preventDefault();
            this.fetchFiles();
          },
          children: [
            /* @__PURE__ */ jsx("i", { className: "breadcrumb-icon fa fa-angle-left mr-2" }),
            "Layouts"
          ]
        }
      ) }),
      Object.values(this.history).map((route) => /* @__PURE__ */ jsx("li", { className: "breadcrumb-item active", children: /* @__PURE__ */ jsx(
        "a",
        {
          onClick: (e) => {
            e.preventDefault();
            this.fetchFiles(route);
          },
          children: route
        }
      ) }, route))
    ] }) });
  }
  header() {
    return /* @__PURE__ */ jsx("div", { className: "page-title-bar fixed", children: /* @__PURE__ */ jsx("div", { className: "col-12", children: /* @__PURE__ */ jsxs("div", { className: "row align-items-center", children: [
      /* @__PURE__ */ jsxs("div", { className: "col-md-6 col-12", children: [
        this.props.hasTitle ? /* @__PURE__ */ jsx("div", { className: "page-title", children: /* @__PURE__ */ jsx("h4", { children: "File Manager" }) }) : /* @__PURE__ */ jsxs("div", { className: "btn-group", children: [
          /* @__PURE__ */ jsxs(
            "button",
            {
              className: "btn btn-success btn-sm mr-1",
              onClick: (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.fetchFiles();
              },
              children: [
                /* @__PURE__ */ jsx("i", { className: "fa fa-home mr-2" }),
                "Home"
              ]
            }
          ),
          Object.values(this.history).map((route) => /* @__PURE__ */ jsxs(
            "button",
            {
              className: "btn btn-primary btn-sm mr-1",
              onClick: (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.fetchFiles(route);
              },
              children: [
                /* @__PURE__ */ jsx("i", { className: "fa fa-angle-right mr-1" }),
                route
              ]
            },
            route
          ))
        ] }),
        this.props.hasTitle ? this.breadcrumbs() : null
      ] }),
      /* @__PURE__ */ jsx("div", { className: "col-md-6 col-12", children: /* @__PURE__ */ jsx("div", { className: "breadcrumb-bar text-right", children: /* @__PURE__ */ jsx("div", { className: "btn-group", children: /* @__PURE__ */ jsxs(
        "button",
        {
          className: "btn btn-secondary btn-sm mr-1",
          onClick: (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.setState({ uploading: true });
          },
          children: [
            /* @__PURE__ */ jsx("i", { className: "fa fa-upload mr-2" }),
            "Upload"
          ]
        }
      ) }) }) })
    ] }) }) });
  }
  get files() {
    var _a;
    return ((_a = this.filesRef) == null ? void 0 : _a.getFiles()) || [];
  }
  getSelectedFiles() {
    var _a;
    const selectsFiles = ((_a = this.filesRef) == null ? void 0 : _a.getSelectedFiles()) || [];
    return this.files.filter((file) => selectsFiles.includes(file.name));
  }
  render() {
    const { component, rows = [], metaIsLoaded } = this.state;
    const files = rows;
    return /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx("div", { className: "pt-0 pb-8", children: this.header() }),
      /* @__PURE__ */ jsx(FileContainer, { height: "100%", children: !metaIsLoaded ? /* @__PURE__ */ jsx("h4", { children: "Loading Files..." }) : files.length === 0 ? /* @__PURE__ */ jsxs(
        "div",
        {
          className: "col-12 text-center tex-dark",
          style: { opacity: 0.6 },
          children: [
            /* @__PURE__ */ jsx("span", { className: "fa fa-folder-open fa-3x pt-5 pb-3" }),
            /* @__PURE__ */ jsx("h4", { children: "No files found." })
          ]
        }
      ) : component ? React__default.createElement(this.state.component.default, {
        meta: this.state.meta,
        modal: true,
        onlyGrid: true,
        accept: this.props.accept || "/*",
        multiple: this.props.multiple,
        ref: (ref) => {
          this.filesRef = ref;
        }
      }) : null }),
      this.state.uploading ? /* @__PURE__ */ jsx(
        FileUploader,
        {
          data: {
            name: "file",
            label: "File",
            placeholder: "Select file",
            accept: "*",
            multiple: true
          },
          inModal: true,
          onUpload: () => {
            this.fetchFiles();
          },
          onClose: () => {
            this.setState({ uploading: false });
          }
        }
      ) : null
    ] });
  }
  isValidFileType(file, acceptedTypes) {
    const fileType = file.type;
    const fileExtension = file.extension;
    acceptedTypes = Array.isArray(acceptedTypes) ? acceptedTypes : acceptedTypes.split(",");
    for (let i = 0; i < acceptedTypes.length; i++) {
      const acceptedType = acceptedTypes[i];
      if (acceptedType === fileType || acceptedType === fileExtension || acceptedType === "*/*") {
        return true;
      }
      if (acceptedType.endsWith("/*") && fileType.startsWith(acceptedType.slice(0, -2))) {
        return true;
      }
    }
    return false;
  }
  multiple() {
    return typeof this.props.multiple === "undefined" ? true : this.props.multiple;
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
class FileBrowserModal extends FileBrowser {
  constructor(props) {
    super(props);
  }
  render() {
    return /* @__PURE__ */ jsx(
      Modal,
      {
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
              this.props.onSelect && this.props.onSelect(this.getSelectedFiles());
              this.props.onClose && this.props.onClose();
            }
          }
        ],
        content: [super.render()],
        onShow: () => {
        }
      }
    );
  }
}
const fileBrowser = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  FileBrowser,
  FileBrowserModal
}, Symbol.toStringTag, { value: "Module" }));
export {
  FileInput as F,
  fileUploader as a,
  fileBrowser as b,
  fileInput as f
};
