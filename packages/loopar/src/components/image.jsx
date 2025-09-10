import { useState, useMemo} from "react";
import {ImageIcon} from "lucide-react";
import LazyLoad from 'react-lazy-load';
import { cn } from "@cn/lib/utils";

export function FallbackImage(props) {
  const [loading, setLoading] = useState(true);
  const [isValidImage, setIsValidImage] = useState(false);
  const { coverProps, imageProps, data } = props;

  const handleLoad = (valid) => {
    setIsValidImage(valid);
    setLoading(false);
  }

  const aspectRatio = useMemo(() => {
    if (data.aspect_ratio) {
      const [w = 1, h = 1] = data.aspect_ratio.split(":");
      return (h / w) * 100;
    }
    return 60;
  }, [data.aspect_ratio]);

  return (
    <>
    <div 
      className="relative w-full h-full overflow-hidden"
      style={{ paddingTop: `${aspectRatio}%` }}
    >
      {/* Representative image */}
      <div 
        className={
          cn(
            'absolute w-full h-full transition-all duration-300 ease-in-out',
            !loading && !isValidImage && "opacity-0"
          )
        }
        style={{
          top: 0, left: 0, right: 0, bottom: 0,
          ...(coverProps.style || {}),
        }}
      >
      </div>
      {/*<div 
        className={
          cn(
          `absolute w-full h-full rounded box-content`,
           !loading ? "opacity-0" : "bg-primary/8",
           'transition-all duration-300 ease-in-out'
          )
        }
        style={{
          top: 0, left: 0, right: 0, bottom: 0,
        }}
      >
      </div>*/}
    </div>
    <LazyLoad>
      <img
        className={`absolute top-0 left-0 w-0 h-0 opacity-0 rounded`}
        src={imageProps?.src || "/"}
        onLoad={() => handleLoad(true)}
        onError={() => handleLoad(false)}
        alt={imageProps?.alt || ""}
        title={imageProps?.title || ""}
      />
    </LazyLoad>
    {(!isValidImage && !loading ) &&
      <ImageIcon
        style={{
          top: 0, left: 0, right: 0, bottom: 0,
        }}
        className={`absolute h-full w-full transition-all ease-in opacity-10 duration-300 border-9 border-primary/70 border-insi rounded`}
      />
    }
    </>
  )
}

export default function MetaImage(props) {
  return (
    <FallbackImage {...props} />
  )
}

 MetaImage.metaFields = () => {
  return [[
    {
      group: "custom",
      elements: {
        aspect_ratio: {
          element: SELECT,
          data: {
            options: [
              { option: "1:1", value: "1:1" },
              { option: "4:3", value: "4:3" },
              { option: "16:9", value: "16:9" },
              { option: "21:9", value: "21:9" },
              { option: "3:4", value: "3:4" },
              { option: "9:16", value: "9:16" },
              { option: "9:21", value: "9:21" },
            ],
            default: "16:9",
          },
        },
      },
    },
    {
      group: "general",
      elements: {
        background_image: {
          element: IMAGE_INPUT,
          data: { 
            accept: "image/*",
          }
        }
      }
    }
  ]];
}