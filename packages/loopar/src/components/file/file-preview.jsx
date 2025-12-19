import {useEffect, useState} from "react";
import fileManager, {getExtention} from "@global/file-manager.js";
import {cn} from "@cn/lib/utils";
import { fileIcons } from "./defaults";
import { FallbackFile } from "./fallback-file";
import Emitter from '@services/emitter/emitter';

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

  useEffect(() => {
    setSelected(props.selected);
  }, [props.selected]);

  const handleSelect = () => {
    props.onSelect && props.onSelect(data, !selected);
    setSelected(!selected);

    Emitter.emit('onSelect', {
      file: data,
      selected: !selected,
    });
  }

  return (
    <div 
      className={cn(
        "w-[130px] h-[180px] flex-col items-center border p-2 shadow-sm hover:shadow-md transition-all cursor-pointer relative",
        selected && "border-primary",
      )}
      onClick={handleSelect}
      key={data.name}
    >
      <FallbackFile
        src={file.previewSrc || file.src}
        icon={Icon}
        iconColor={color}
      />
      <div className="pt-2 space-y-0 text-sm w-full flex flex-col absolute bottom-0 left-0 p-1">
        <h3 className="font-medium leading-none truncate w-full" title={data.name}>
          {data.name.replace(/\.[^/.]+$/, '')}
        </h3>
        <p className="text-xs text-muted-foreground flex flex-row items-center justify-between">
          <span>{size}</span>
          <span>.{getExtention(data.name)}</span>
        </p>
      </div>
    </div>
  );
}