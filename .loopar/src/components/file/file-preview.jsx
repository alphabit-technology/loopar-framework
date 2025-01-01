import React, {use, useEffect} from "react";
import fileManager from "@tools/file-manager";
import {cn} from "@/lib/utils";
import { fileIcons } from "./defaults";
import { FallbackImage } from "./fallback-image";

export default function FilePreview(props) {
  const [selected, setSelected] = React.useState(props.selected);

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
      <>
        {type === "image" ? (
          <FallbackImage
            className="img-fluid"
            src={file.previewSrc || file.src}
            fallbackSrc='/assets/images/blank-image.svg'
            alT={data.name}
        />) : null}

        {type !== "image" ? (
          <div className="flex items-center justify-center w-full pt-5">
            <Icon className={`w-20 h-20 ${color}`} />
          </div>
        ) : null}

      </>
      <div className="space-y-1 text-sm w-full flex flex-col absolute bottom-0 p-1">
        <h3 className="font-medium leading-none truncate w-full">{data.name}</h3>
        <p className="text-xs text-muted-foreground">{size}</p>
      </div>
    </div>
  );
}