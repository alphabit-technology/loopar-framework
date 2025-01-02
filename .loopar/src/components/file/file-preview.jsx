import React, {useState} from "react";
import fileManager from "@tools/file-manager";
import {cn} from "@/lib/utils";
import { fileIcons } from "./defaults";
import { FallbackFile } from "./fallback-file";

export default function FilePreview(props) {
  const [selected, setSelected] = useState(props.selected);
  const file = props.file;
  const type = fileManager.getFileType(file);
  const size = fileManager.getFileSize(file?.rawFile?.size || file.size)
  const data = props.file;

  if(!data) return null;

  const icon = fileIcons[type] || fileIcons["default"];
  const Icon = icon.icon;
  const color = icon.color;

  const handleSetlect = () => {
    props.onSelect && props.onSelect(data);
    setSelected(!selected);
  }

  return (
    <div 
      className={cn(
        "w-[130px] h-[180px] flex-col items-center border p-2 shadow-sm hover:shadow-md transition-all cursor-pointer relative",
        selected && "border-primary",
      )}
      onClick={handleSetlect}
      key={data.name}
    >
      <FallbackFile
        src={file.previewSrc || file.src}
        icon={Icon}
        iconColor={color}
      />
      <div className="space-y-1 text-sm w-full flex flex-col absolute bottom-0 p-1">
        <h3 className="font-medium leading-none truncate w-full">{data.name}</h3>
        <p className="text-xs text-muted-foreground">{size}</p>
      </div>
    </div>
  );
}