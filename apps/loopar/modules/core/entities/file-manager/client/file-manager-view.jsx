
'use strict';

import ViewContext from '@context/view-context';
import DeskGUI from "@context/base/desk-gui";

import { fileIcons } from "@@file/defaults";

import fileManager from "@@file/file-manager";

import {useEffect, useState} from "react";
import {ImageIcon} from "lucide-react";
import LazyLoad from 'react-lazy-load';
import {cn} from "@cn/lib/utils";

export function FallbackFile({ src, ...props }) {
  const [loading, setLoading] = useState(true);
  const [isValidImage, setIsValidImage] = useState(false);
  const [imgRef, setImgRef] = useState(null);

  const handleLoad = (valid) => {
    setIsValidImage(valid);
  }

  useEffect(() => {
    if(imgRef) setTimeout(() => setLoading(false), 100);
  }, [imgRef]);
  
  const Icon = props.icon || ImageIcon;
  const iconColor = props.iconColor || "text-slate-600/50";

  return (
    <LazyLoad offset={100} debounce={false} throttle={100} threshold={0.95}
      className="inset-0 w-full bg-gradient-to-b from-slate-900/20 to-slate-700/30 bg-no-repeat bg-center bg-cover p-0 m-0"
    >
      <>
        {(!isValidImage && !loading) &&
          <Icon
            className={cn(`w-full p-3 h-full object-containt transition-all ease-in duration-300 aspect-ratio-1/1`, iconColor)}
          />
        }
        <div className={`overflow-hidden w-full ${isValidImage ? "h-full" :''} p-0 m-0`}>
          <img 
            alt={props.alt || "Image"} 
            loading="lazy"
            decoding="async" 
            data-nimg="1" 
            className={`object-containt w-full h-full transition-all aspect-ratio-1/1`}
            srcSet={src}
            style={{color: "transparent", ...(!isValidImage ? {width: 0, height: 0} : {height: "100%"})}}
            onLoad={() => handleLoad(true)}
            onError={() => handleLoad(false)}
            ref={setImgRef}
          />
        </div>
      </>
    </LazyLoad>
  )
}

export default class FileManagerView extends ViewContext {
  has_header = false;
  constructor(props) {
    super(props);
  }

  render() {
    const {data} = this.Document;
    const file = JSON.parse(data.file_ref)[0];

    const type = fileManager.getFileType(file);

    const icon = fileIcons[type] || fileIcons["default"];
    const Icon = icon.icon;
    
    return (
      <DeskGUI
        docRef={this}
      >
        <div className='flex flex-1 flex-col items-center justify-between w-full h-full p-3'>
          <div className="container">
            <FallbackFile
              src={file.previewSrc || file.src}
              icon={Icon}
              iconColor={file.color}
            />
          </div>
        </div>
      </DeskGUI>
    )
  }
}