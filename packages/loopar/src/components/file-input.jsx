import BaseInput from "@base-input";
import fileManager from "@@file/file-manager";
import { FileDrop } from "@@file/file-drop";
import {
  FormControl,
  FormLabel
} from "@cn/components/ui/form";

const FileInput = (props) => {
  return (
    <BaseInput
      {...props}
      render={(field, data) => {
        const files = fileManager.getMappedFiles(field.value);
        const hasFiles = files.length > 0;

        const handleChange = (newFiles) => {
          field.onChange(newFiles)
        };

        return (
          <>
            {data.label && <FormLabel>{data.label}</FormLabel>}
            <FormControl>
              <div
                className={`w-full h-10 p-3 border shadow-md bg-slate-300/50 dark:bg-slate-700/50 ${hasFiles ? "has-files" : ""}`}
                style={{ minHeight: 270 }}
              >
                <div className="h-full bg-background p-2">
                  <FileDrop
                    data={data}
                    files={files}
                    origins={props.origins}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </FormControl>
          </>
        );
      }}
    />
  );
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