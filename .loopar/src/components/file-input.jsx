import React, { useState, useRef, useEffect, useCallback, useMemo} from 'react';
import BaseInput from "@base-input";
import { FileBrowserModal } from "@file-browser";
import FilePreview from "@file-preview";
import FileContainer from "@file-container";
import fileManager from "@tools/file-manager";
import { MonitorUpIcon, DatabaseIcon, Globe2Icon, UploadCloudIcon, Trash2Icon, Loader2Icon } from "lucide-react";
import loopar from "loopar";

import {
  FormControl,
  FormLabel
} from "@/components/ui/form";

const origins = [
  { name: "Local", icon: MonitorUpIcon, color: "bg-secondary" },
  { name: "Server", icon: DatabaseIcon, color: "bg-warning" },
  { name: "Web", icon: Globe2Icon, color: "bg-primary" },
  { name: "Trash", icon: Trash2Icon, color: "bg-danger" }
];

const FileInput = (props) => {
  const { value, data, renderInput } = BaseInput(props);

  const [dropping, setDropping] = useState(false);
  const [fileBrowserOpen, setFileBrowserOpen] = useState(false);
  const [previews, setPreviews] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const inputRef = useRef(null);

  const accept = data.accept || "/*";
  const [files, setFiles] = useState(fileManager.getMappedFiles(value()));

  const makePreviews = useCallback((files = [], callback) => {
    const promises = files.map((file) => new Promise((resolve, reject) => {
      const getSrc = (f) => {
        if (f.type.match("video.*")) return URL.createObjectURL(f);
        if (f.type.match("audio.*")) return URL.createObjectURL(f);
        if(f.type.match("image.*")) return URL.createObjectURL(f);
        return null;
      };

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
          /*const getSrc = (f) => {
            if (f.type.match("video.*")) return URL.createObjectURL(f);
            if (f.type.match("audio.*")) return URL.createObjectURL(f);
            return null;
          };*/

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

    Promise.all(promises)
      .then((newPreviews) => {
        if (JSON.stringify(previews) !== JSON.stringify(newPreviews)) {
          setPreviews(newPreviews);
        }
        setLoaded(true);
        setDropping(false);
        props.onChange && props.onChange(newPreviews);
        callback && callback(newPreviews);
      })
      .catch((error) => {
        setLoaded(true);
        setDropping(false);
        console.error("Error reading files:", error);
      });
  }, [previews]);

  const handleChange = (e) => {
    const f = mergeFiles(files, Array.from(e.target.files));
    makePreviews(f, value);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const droppedFiles = e.dataTransfer.files;
    handleChange({ target: { files: droppedFiles } });
  };

   const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDropping(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDropping(false);
  };

  useEffect(() => {
    makePreviews(files);
  }, [files]);

  useEffect(() => {
    const mappedFiles = fileManager.getMappedFiles(value());
    if (JSON.stringify(files) !== JSON.stringify(mappedFiles)) {
      setFiles(mappedFiles);
    }
  }, [value]);

  const mergeFiles = (files = [], newFiles) => {
    if (data.multiple) {
      return [...files, ...newFiles].filter((file, index, self) => (
        index === self.findIndex((f) => f.name === file.name && f.size === file.size)
      ));
    }
    return Array.isArray(newFiles) ? [newFiles[0]] : Array.isArray(files) ? [files[0]] : [];
  };

  const handleClearFiles = () => {
    loopar.confirm('Are you sure you want to delete all files?', () => {
      makePreviews([], value);
    });
  };

  const hasFiles = previews.length > 0;

  const DroppbleArea = useMemo(() => (
    <div
      className={`h-full bg-background/50 flex ${!hasFiles ? "flex-col" : "flex-row"} items-center justify-center ${dropping ? "drag-over" : ""}`}
      onDragOverCapture={handleDragOver}
      onDragLeaveCapture={handleDragLeave}
      onDrop={handleDrop}
    >
      {dropping ? (
        <div className="w-full flex flex-col items-center text-lg">
          <UploadCloudIcon className="w-12 h-12" />
          Drop files here!
        </div>
      ) : (
        loaded ? (
          <>
            {!hasFiles && <div className="mb-2">
              <small className="flex text-lg text-center w-full">
                Drag & Drop or upload from
              </small>
            </div>}
            <div className={`flex ${!hasFiles ? "flex-row" : "flex-col"} gap-2`}>
              {origins.map(origin => {
                if (!hasFiles && origin.name === "Trash") return null;
                const refOrigin = props.origins;
                if (refOrigin && refOrigin.length > 0 && !refOrigin.includes(origin.name)) return null;

                const Icon = origin.icon;
                const size = !hasFiles ? "w-16" : "w-12";
                return (
                  <button
                    key={origin.name}
                    className={`flex ${size} flex-col items-center rounded border bg-card p-2 shadow cursor-pointer transition-colors hover:bg-muted/50`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (origin.name === "Local") return inputRef.current.click();
                      if (origin.name === "Server") return setFileBrowserOpen(true);
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
        ) : <Loader2Icon className="text-slate-500 w-10 h-10 animate-spin" />
      )}
      <>
        {hasFiles && (
          <FileContainer>
            {previews.map((file) => (
              <FilePreview
                key={file.name}
                file={file}
                onDelete={() => {
                  handleChange({
                    target: {
                      files: files.filter((f) => f.name !== file.name),
                    },
                  });
                }}
              />
            ))}
          </FileContainer>
        )}
        {fileBrowserOpen && <FileBrowserModal
          hasTitle={false}
          onClose={() => setFileBrowserOpen(false)}
          onSelect={(file) => {
            const newFiles = [...files, ...file];
            handleChange({
              target: { files: hasFiles ? newFiles : JSON.stringify(newFiles) },
            });
            setFileBrowserOpen(false);
          }}
          multiple={data.multiple}
          accept={accept}
          height={512}
        />}
      </>
    </div>
  ), [dropping, loaded, hasFiles, previews, files, fileBrowserOpen, handleChange, handleClearFiles, accept, data.multiple, props.origins]);

  return renderInput((field) => (
    <>
      {data.label && <FormLabel>{data.label}</FormLabel>}
      <FormControl>
        <div
          className={`w-full h-10 p-3 border shadow-md bg-slate-300/50 dark:bg-slate-700/50 ${hasFiles ? "has-files" : ""}`}
          style={{ minHeight: 270 }}
        >
          <div className="h-full bg-background p-2">
            <input
              type="file"
              className="hidden"
              onChange={handleChange}
              multiple={data.multiple}
              accept={accept}
              ref={inputRef}
            />
            {DroppbleArea}
            <div
              className={`h-full bg-background/50 flex ${!hasFiles ? "flex-col" : "flex-row"} items-center justify-center ${dropping ? "drag-over" : ""}`}
              onDragOverCapture={(e) => {
                e.preventDefault();
                setDropping(true);
              }}
              onDragLeaveCapture={(e) => {
                e.preventDefault();
                setDropping(false);
              }}
              onDrop={handleDrop}
            >
              {/* Resto de la lógica para mostrar el área de arrastre y carga */}
            </div>
          </div>
        </div>
      </FormControl>
    </>
  ));
};

export default FileInput;
