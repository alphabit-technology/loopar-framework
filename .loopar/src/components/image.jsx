import loopar from "$loopar";
import { useState } from "react";
import { ImageIcon } from "lucide-react";
import { useEffect } from "react";
import AOS from "aos"

export function Image ({imageProps={}, coverProps={}, ...props}) {
  const data = props.data || {};
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);

  const [visibleIcon, setVisibleIcon] = useState(false);
  const [renderProps] = useState(loopar.utils.renderizableProps(props));

  const handleImageLoad = () => {
    setImageLoaded(true);
  }

  const handleImageError = () => {
    setImageLoaded(false);
    setIsImageLoading(false);
  }

  useEffect(() => {
    AOS.refresh();
    if(imageLoaded) {
      setIsImageLoading(false);
    }
  }, [imageLoaded]);

  useEffect(() => {
    setVisibleIcon(!isImageLoading && !imageLoaded);
  }, [isImageLoading, imageLoaded]);

  const aspectRatio = () => {
    if(data.aspect_ratio) {
      const [w=1, h=1] = data.aspect_ratio.split(":");
      return (h / w) * 100;
    }

    return 60;
  }

  useEffect(() => {
    if(!imageProps.src) {
      setVisibleIcon(true);
    }
  }, [imageProps.src]);

  return (
    <div 
      className="top-0"
      style={{paddingTop: `${aspectRatio()}%`}}
    >
      <ImageIcon
        style={{
          marginTop: `-${aspectRatio()}%`, 
          display: visibleIcon ? "block" : "none",
          border: "12px solid #fff"
        }}
        className={`h-full w-full transition-all ease-in opacity-5 duration-300 hover:scale-105 aspect-square border-4 rounded-lg`}
      />
      <img
        {...renderProps}
        className={`absolute aspect-auto top-0 left-0 w-0 h-0 rounded-sm ${isImageLoading ? "opacity-0" : "opacity-100"}`}
        {...imageProps}
        onLoad={handleImageLoad}
        onError={handleImageError}
      />
      <div
        className="absolute inset-0 top-0 left-0 right-0 bottom-0 w-full h-full rounded-sm"
        {...coverProps}
      />
    </div>
  );
}


export default function MetaImage(props) {
  return (
    <Image {...props} />
  )
}

 MetaImage.metaFields = () => {
  return [
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
  ];
}