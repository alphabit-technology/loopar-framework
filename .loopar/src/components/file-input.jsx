import React, { useState, useEffect} from 'react';
import BaseInput from "@base-input";
import fileManager from "@@file/file-manager";
import { FileDrop } from "@@file/file-drop";
import _ from "lodash";

import {
  FormControl,
  FormLabel
} from "@/components/ui/form";

const FileInput = (props) => {
  const { value, data, renderInput } = BaseInput(props);
  const [files, setFiles] = useState(fileManager.getMappedFiles(data.value));

  const handleChange = (e) => {
    value(fileManager.getMappedFiles(e.target?.files));
  };

  useEffect(() => {
    const mappedFiles = fileManager.getMappedFiles(value());
    !_.isEqual(files, mappedFiles) && setFiles(mappedFiles);
  }, [value]);

  const hasFiles = files.length > 0;

  return renderInput((field) => (
    <>
      {data.label && <FormLabel>{data.label}</FormLabel>}
      <FormControl>
        <div
          className={`w-full h-10 p-3 border shadow-md bg-slate-300/50 dark:bg-slate-700/50 ${hasFiles ? "has-files" : ""}`}
          style={{ minHeight: 270 }}
        >
          <div className="h-full bg-background p-2">
            <FileDrop
              onChange={handleChange}
              data={data}
              files={files}
              origins={props.origins}
            />
          </div>
        </div>
      </FormControl>
    </>
  ));
};

FileInput.metaFields = () => {
  return [
    ...BaseInput.metaFields(),
    [
      {
        group: "form",
        elements: {
          accept: { element: INPUT, data: { label: "Accept", placeholder: "image/*" } },
          multiple: { element: SWITCH }
        }
      }
  ]];
}

export default FileInput;