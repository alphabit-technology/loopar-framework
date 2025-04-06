import React, {useEffect, useState} from "react";
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
    <LazyLoad height={115} offset={100} debounce={false} throttle={100} threshold={0.95}
      className="inset-0 bg-gradient-to-b from-slate-900/20 to-slate-700/30 bg-no-repeat bg-center bg-cover p-0 m-0"
    >
      <>
        {(!isValidImage && !loading) &&
          <Icon
            className={cn(`w-full p-3 h-full object-cover transition-all ease-in duration-300 hover:scale-105 aspect-square`, iconColor)}
          />
        }
        <div className={`overflow-hidden w-full ${isValidImage ? "h-full" :''} p-0 m-0`}>
          <img 
            alt={props.alt || "Image"} 
            loading="lazy"
            decoding="async" 
            data-nimg="1" 
            className={`object-containt object-cover object-center w-full h-full transition-all hover:scale-105 aspect-square`}
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