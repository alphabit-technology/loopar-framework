import React, { useState, useRef, useEffect, useId } from 'react';
import BaseInput from "@base-input";
import { FileBrowserModal } from "@file-browser";
import FilePreview from "@file-preview";
import FileContainer from "@file-container";
import fileManager from "@tools/file-manager";
import { MonitorUpIcon, DatabaseIcon, Globe2Icon, UploadCloudIcon, Trash2Icon } from "lucide-react";
import loopar from "$loopar";

import {
  FormControl,
  FormDescription,
  FormLabel,
  FormMessage
} from "@/components/ui/form";

const origins = [
  { name: "Local", icon: MonitorUpIcon, color: "bg-secondary" },
  { name: "Server", icon: DatabaseIcon, color: "bg-warning" },
  { name: "Web", icon: Globe2Icon, color: "bg-primary" },
  { name: "Trash", icon: Trash2Icon, color: "bg-danger" }
];

const FileInput = (props) => {
  const { value, data, renderInput, fieldControl, handleInputChange } = BaseInput(props);

  const [state, setState] = useState({
    dropping: false,
    fileBrowserOpen: false,
    previews: [],
    loaded: false,
  });

  const inputRef = useRef(null);

  const accept = data.accept || "/*";
  const [files, setFiles] = useState(fileManager.getMappedFiles(value()));

  const makePreviews = (files = [], callback) => {
    const promises = files.map((file) => new Promise((resolve, reject) => {
      if (file instanceof File) {
        if (file.type.match("image.*")) {
          const reader = new FileReader();
          reader.onload = (e) => {
            resolve({
              name: file.name,
              src: e.target.result,
              previewSrc: e.target.result,
              type: "image",
              rawFile: file,
            });
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        } else {
          resolve({
            name: file.name,
            src: getSrc(file),
            type: "file",
            rawFile: file,
          });
        }
      } else {
        resolve(file);
      }
    }));

    Promise.all(promises).then((previews) => {
      setState({ previews, loaded: true, dropping: false });
      callback && callback(previews);
    }).catch((error) => {
      setState({ loaded: true, dropping: false });
      console.error("Error reading files:", error);
    });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setState(prevState => ({ ...prevState, dropping: true }));
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setState(prevState => ({ ...prevState, dropping: false }));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const droppedFiles = e.dataTransfer.files;
    handleChange({ target: { files: droppedFiles } });
  };

  const handleChange = (e) => {
    const f = mergeFiles(files, Array.from(e.target.files));
    makePreviews(f, value);
  };
  
  const mergeFiles = (files = [], newFiles) => {
    if (data.multiple) {
      return [...files, ...newFiles].filter((file, index, self) => (
        index === self.findIndex((f) => f.name === file.name && f.size === file.size)
      ));
    }
    return Array.isArray(newFiles) ? [newFiles[0]] : Array.isArray(files) ? [files[0]] : [];
  };

  const getSrc = (file, preview = false) => (
    file ? `/uploads/${preview ? 'thumbnails/' : ''}${file.name}` : ''
  );

  useEffect(() => {
    makePreviews(files);
  }, []);

  useEffect(() => {
    setFiles(fileManager.getMappedFiles(value()));
  }, [data.value]);

  useEffect(() => {
    makePreviews(files);
  }, [files]);

  const handleClearFiles = () => {
    loopar.confirm('Are you sure you want to delete all files?', () => {
      makePreviews([], value);
    });
  };

  const hasFiles = state.previews.length > 0;

  const DroppbleArea = (files) => (
    <div
      className={`h-full bg-background/50 flex ${!hasFiles ? "flex-col" : "flex-row"} items-center justify-center ${state.dropping ? "drag-over" : ""}`}
      onDragOverCapture={handleDragOver}
      onDragLeaveCapture={handleDragLeave}
      onDrop={handleDrop}
    >
      {state.dropping ?
        <div className="w-full flex flex-col items-center text-lg">
          <UploadCloudIcon className="w-12 h-12" />
          Drop files here!
        </div>
        :
        state.loaded ?
          <>
            {!hasFiles && <div className="mb-2">
              <small className="flex text-lg text-center w-full">
                Drag & Drop or upload from
              </small>
            </div>}
            <div className={`flex ${!hasFiles ? "flex-row" : "flex-col"} gap-2`}>
              {origins.map(origin => {
                const refOrigin = props.origins;
                if (!hasFiles && origin.name === "Trash") return null;
                if (refOrigin && refOrigin.length > 0 && !refOrigin.includes(origin.name)) return null;

                const Icon = origin.icon;
                const size = !hasFiles ? "w-16" : "w-12";
                return (
                  <button
                    className={`flex ${size} flex-col items-center rounded-sm border bg-card p-2 shadow cursor-pointer transition-colors hover:bg-muted/50`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (origin.name === "Local") return inputRef.current.click();
                      if (origin.name === "Server") return setState(prevState => ({ ...prevState, fileBrowserOpen: true }));
                      if (origin.name === "Web") {
                        loopar.prompt({
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
                    {!hasFiles && origin.name}
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
        {state.previews.length > 0 && <FileContainer>
          {state.previews.map((file) => (
            <>
            <FilePreview
              file={file}
              onDelete={() => {
                handleChange({
                  target: {
                    files: files.filter((f) => f.name !== file.name),
                  },
                });
              }}
            />
            </>
          ))}
        </FileContainer>}
        {state.fileBrowserOpen && <FileBrowserModal
          hasTitle={false}
          onClose={() => setState(prevState => ({ ...prevState, fileBrowserOpen: false }))}
          onSelect={(file) => {
            const newFiles = [...files, ...file];
            handleChange({
              target: { files: hasFiles ? newFiles : JSON.stringify(newFiles) },
            });
            setState(prevState => ({ ...prevState, fileBrowserOpen: false }));
          }}
          open={state.fileBrowserOpen}
          multiple={data.multiple}
          accept={accept}
          height={512}
        />}
      </>
    </div>
  );

  return renderInput((field) => (
    <>
      {data.label && <FormLabel>{data.label}</FormLabel>}
      <FormControl>
        <div
          className={`w-full h-10 p-3 border shadow-md bg-slate-300/50 dark:bg-slate-700/50 ${hasFiles > 0 && !state.dropping ? "has-files" : ""}`}
          style={{ minHeight: 270 }}
        >
          <div className=" h-full bg-background p-2">
            <input
              type="file"
              className="hidden"
              onChange={handleChange}
              multiple={data.multiple}
              accept={accept}
              ref={inputRef}
            />
            {DroppbleArea(files)}
          </div>
        </div>
      </FormControl>
      <FormDescription>
        {data.description}
      </FormDescription>
      <FormMessage />
    </>
  ));
}

export default FileInput;
