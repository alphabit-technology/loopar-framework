import BaseInput from "$base-input";
import { FileBrowserModal } from "$file-browser";
import FilePreview from "$file-preview";
import FileContainer from "$file-container";
import fileManager from "$tools/file-manager";
import loopar from "$loopar";
import { MonitorUpIcon, DatabaseIcon, Globe2Icon, UploadCloudIcon, Trash2Icon } from "lucide-react";
import {
  FormControl,
  FormDescription,
  FormLabel,
  FormMessage
} from "@/components/ui/form";

export default class FileInput extends BaseInput {
  groupElement = FILE_INPUT;
  inputType = "file";
  visibleInput = false;

  origins = [
    { name: "Local", icon: MonitorUpIcon, color: "bg-secondary" },
    { name: "Server", icon: DatabaseIcon, color: "bg-warning" },
    { name: "Web", icon: Globe2Icon, color: "bg-primary" },
    { name: "Trash", icon: Trash2Icon, color: "bg-danger" }
  ];

  constructor(props) {
    super(props);

    this.state = {
      ...this.state,
      dropping: false,
      fileBrowser: false,
      previews: [],
      loaded: false,
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
    return (
      <>
        <FileBrowserModal
          hasTitle={false}
          onClose={() => {
            this.setState({
              fileBrowser: false,
            });
          }}
          onSelect={(file) => {
            const files = [...this.files, ...file];
            this.onChange({
              target: { files: hasFiles ? files : JSON.stringify(files) },
            });
            this.setState({
              fileBrowser: false,
            });
          }}
          open={this.state.fileBrowser}
          multiple={this.props.data.multiple}
          accept={this.accept}
          height={512}
        />
      </>
    )
  }

  getPreviews() {
    return this.state.previews || [];
  }

  DroppbleArea(files, handleChange, handleClearFiles) {
    return (
      <>
        <div
          className={`h-full bg-background/50 flex ${files.length === 0 ? "flex-col" : "flex-row"} items-center justify-center ${this.state.dropping ? "drag-over" : ""}`}
          onDragOverCapture={(e) => {
            e.preventDefault();
            e.stopPropagation();
            this.setState({ dropping: true });
          }}
          onDragLeaveCapture={(e) => {
            e.preventDefault();
            e.stopPropagation();
            this.setState({ dropping: false });
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();

            const files = e.dataTransfer.files;
            handleChange({ target: { files: files } });
          }}
        >
          {this.state.dropping ?
            <div className="w-full flex flex-col items-center text-lg">
              <UploadCloudIcon className="w-12 h-12" />
              Drop files here!
            </div>
            :
            this.state.loaded ?
              <>
                {files.length === 0 && <div className="mb-2">
                  <small className="flex text-lg text-center w-full">
                    Drag & Drop or upload from
                  </small>
                </div>}
                <div className={`flex ${files.length === 0 ? "flex-row" : "flex-col"} gap-2`}>
                  {this.origins.map(origin => {
                    const refOrigin = this.props.origins;
                    if (files.length === 0 && origin.name === "Trash") return null;
                    if (refOrigin && refOrigin.length > 0 && !refOrigin.includes(origin.name)) return null;

                    const Icon = origin.icon;
                    const size = files.length === 0 ? "w-16" : "w-12";
                    return (
                      <button
                        className={`flex ${size} flex-col items-center rounded-sm border bg-card p-2 shadow cursor-pointer transition-colors hover:bg-muted/50`}
                        onClick={(e) => {
                          e.preventDefault();
                          if (origin.name === "Local") return this.input.click();
                          if (origin.name === "Server") return this.setState({ fileBrowser: true });
                          if (origin.name === "Web") {
                            return loopar.prompt({
                              title: "Web file",
                              label: "Enter the URL of the file",
                              placeholder: "https://",
                              ok: (url) => {
                                const file = {
                                  name: url.split("/").pop(),
                                  src: url,
                                };
                                handleChange({
                                  target: { files: [file] },
                                });
                              },
                            });
                          }

                          if (origin.name === "Trash") {
                            handleClearFiles();
                          }
                        }}
                      >
                        <Icon />
                        {files.length === 0 && origin.name}
                      </button>
                    );
                  })}
                </div>
              </>
              :
              <span className="file-drop-zone-icon">
                {/* <i className="fa fa-spinner fa-spin mr-2 fa-3x"></i> */}
              </span>
          }
          <>
            {files.length > 0 && <FileContainer>
              {this.getPreviews().map((file) => (
                <FilePreview
                  file={file}
                  onDelete={(file) => {
                    this.onChange({
                      target: {
                        files: this.files.filter(
                          (f) => f.name !== file.name
                        ),
                      },
                    });
                  }}
                />
              ))}
            </FileContainer>}
            {this.FileBrowserModal}
          </>
        </div>
      </>
    )
  }

  render() {
    let hasFiles = true;
    const files = this.getPreviews();
    const data = this.data;

    if (files.length === 0) {
      hasFiles = false;
    }

    const mergeFiles = (files = this.files, newFiles) => {
      if (this.props.data.multiple) return [...files, ...newFiles].filter((file, index, self) => {
        return index === self.findIndex((f) => f.name === file.name && f.size === file.size);
      });

      return Array.isArray(newFiles) ? [newFiles[0]] : Array.isArray(files) ? [files[0]] : [];
    };

    const handleChange = (e) => {
      this.makePreviews(mergeFiles(this.files, Array.from(e.target.files)), () => {
        this.value(this.getPreviews());
      });
    }

    const handleClearFiles = () => {
      loopar.confirm('Are you sure you want to delete all files?', () => {
        this.value([]);
      });
    }

    return this.renderInput((field) => {
      return (
        <>
          {this.hasLabel() && <FormLabel>{data.label}</FormLabel>}
          <FormControl>
            <div
              className={`w-full h-10 p-3 border shadow-md bg-slate-300/50 dark:bg-slate-700/50 ${files.length > 0 && !this.state.dropping ? "has-files" : ""}`}
              style={{ minHeight: 270 }}
            >
              <div className=" h-full bg-background p-2">
                <input
                  type="file"
                  className="hidden"
                  onChange={e => {
                    e.target.files.length > 0 && handleChange(e, field);
                  }}
                  multiple={this.props.data.multiple}
                  accept={this.accept}
                  ref={(node) => {
                    this.input = node;
                  }}
                />
                {this.DroppbleArea(files, handleChange, handleClearFiles)}
              </div>
            </div>
          </FormControl>
          <FormDescription>
            {data.description}
          </FormDescription>
          <FormMessage />
        </>
      )
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

  makePreviews(files = this.files, callback) {
    const promises = Array.from(files).map((file) => {
      return new Promise((resolve, reject) => {
        if (file instanceof File) {
          if (file.type.match("image.*")) {
            const reader = new FileReader();

            reader.onload = (e) => {
              const imageFile = {
                name: file.name,
                src: e.target.result,
                type: "image",
                rawFile: file, // Necessary for the FormData object to send server
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
              type: "file",
              rawFile: file,  // Necessary for the FormData object to send server
            };
            return resolve(fileFile);
          }
        } else {
          return resolve(file);
        }
      });
    });

    Promise.all(promises).then((previews) => {
      this.setState({ previews, loaded: true, dropping: false }, () => {
        callback && callback();
      });
    }).catch((error) => {
      this.setState({ loaded: true, dropping: false }, () => {
        callback && callback();
      });
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
          multiple: { element: SWITCH },
        },
      },
    ];
  }
}
