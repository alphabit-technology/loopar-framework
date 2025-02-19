import React, {useEffect, useState} from "react";
import {ImageIcon} from "lucide-react";
import LazyLoad from 'react-lazy-load';

export function FallbackImage(props) {
  const [loading, setLoading] = useState(true);
  const [isValidImage, setIsValidImage] = useState(false);
  const [imgRef, setImgRef] = useState(null);
  const { coverProps, imageProps, data } = props;

  const handleLoad = (valid) => {
    setIsValidImage(valid);
  }

  useEffect(() => {
    if(imgRef) setTimeout(() => setLoading(false), 100);
  }, [imgRef]);
  
  const aspectRatio = () => {
    if(data.aspect_ratio) {
      const [w=1, h=1] = data.aspect_ratio.split(":");
      return (h / w) * 100;
    }

    return 60;
  }

  return (
    <>
      <LazyLoad>
        <>
          <div className="overflow-hidden w-full h-full p-0 m-0">
            <img
              className={`absolute aspect-auto top-0 left-0 w-0 h-0 rounded-xm ${isValidImage ? "opacity-0" : "opacity-100"}`}
              {...imageProps}
              src={imageProps?.src || "/"}
              onLoad={() => handleLoad(true)}
              onError={() => handleLoad(false)}
              ref={setImgRef}
            />
          </div>
        </>
      </LazyLoad>

      <div
        className="top-0"
        style={{ paddingTop: `${aspectRatio()}%` }}
      >
        {(!isValidImage && !loading ) &&
          <ImageIcon
            style={{
              marginTop: `-${aspectRatio()}%`, 
              border: "12px solid #fff"
            }}
            className={`h-full w-full transition-all ease-in opacity-5 duration-300 hover:scale-105 aspect-square border-4 rounded-lg`}
          />
        }
        <div
          className="absolute inset-0 top-0 left-0 right-0 bottom-0 w-full h-full rounded-xm "
          {...coverProps}
        />
      </div>
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