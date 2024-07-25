import loopar from "$loopar";
import { useState } from "react";
import { ImageIcon } from "lucide-react";
import { useEffect } from "react";
import AOS from "aos";

export function Image ({imageProps={}, coverProps={}, ...props}) {
  const [state, setState] = useState({
    imageLoaded: false,
    isValidImage: false,
    isImageLoading: true
  });

  const [renderProps] = useState(loopar.utils.renderizableProps(props));

  const handleImageError = (e) => {
    setState({imageLoaded: false, isValidImage: false, isImageLoading: false });
  }

  const handleImageLoad = () => {
    setState({imageLoaded: true, isImageLoading: false, isValidImage: true});
  }

  const aspectRatio = () => {
    if(props.aspect) {
      const [w=1, h=1] = props.aspect.split("/");
      return (h / w) * 100;
    }

    return 60;
  }

  useEffect(() => {
    AOS.refresh();
  }, [state.imageLoaded]);
  
  const { isValidImage, isImageLoading } = state;

  return (
    <div 
      className="top-0"
      style={{paddingTop: `${aspectRatio()}%`}}
    >
      <ImageIcon 
        style={{marginTop: `-${aspectRatio()}%`, ...(!isValidImage ? {} : {display: "none"})}}
        className={`h-full w-full object-cover transition-all ease-in text-slate-600/50 duration-300 hover:scale-105 aspect-square`}
      />
      <img
        key={imageProps.src}
        {...renderProps}
        className={`absolute aspect-auto top-0 left-0 right-0 bottom-0 w-full h-full rounded-sm ${isImageLoading ? "opacity-0" : "opacity-100"}`}
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
          },
        },
      },
    },
  ];
}