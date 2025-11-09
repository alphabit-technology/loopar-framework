import {useEffect, useState} from "react";
import {ImageIcon} from "lucide-react";
import LazyLoad from 'react-lazy-load';
import {cn} from "@cn/lib/utils";

export function FallbackFile({ src, ...props }) {
  const [imageStatus, setImageStatus] = useState('loading'); // 'loading' | 'success' | 'error'

  useEffect(() => {
    setImageStatus('loading');
  }, [src]);

  const handleLoad = () => {
    setImageStatus('success');
  }

  const handleError = () => {
    setImageStatus('error');
  }
  
  const Icon = props.icon || ImageIcon;
  const iconColor = props.iconColor || "text-slate-600/50";
  const showIcon = imageStatus === 'error';
  const showImage = imageStatus !== 'error';

  return (
    <LazyLoad 
      height={115} 
      offset={100} 
      debounce={false} 
      throttle={250}
      threshold={0.5}
      className="inset-0 bg-gradient-to-b from-slate-900/20 to-slate-700/30 bg-no-repeat bg-center bg-cover p-0 m-0"
    >
      <div className="relative w-full h-full">
        {showIcon && (
          <Icon
            className={cn(
              "w-full p-3 h-full object-cover transition-all ease-in duration-300 hover:scale-105 aspect-square", 
              iconColor
            )}
          />
        )}
        
        {showImage && (
          <div className="overflow-hidden w-full h-full p-0 m-0">
            <img 
              alt={props.alt || "Image"} 
              loading="lazy"
              decoding="async" 
              data-nimg="1" 
              className={cn(
                "object-contain object-cover object-center w-full h-full transition-all hover:scale-105 aspect-square",
                imageStatus === 'loading' && "opacity-0",
                imageStatus === 'success' && "opacity-100"
              )}
              src={src}
              style={{color: "transparent"}}
              onLoad={handleLoad}
              onError={handleError}
            />
          </div>
        )}
      </div>
    </LazyLoad>
  )
}