import React, {useEffect} from "react";
import {ImageIcon} from "lucide-react";
import LazyLoad from 'react-lazy-load';

export function FallbackImage({ src }) {
 const [state, setState] = React.useState({
    imageLoaded: false,
    isValidImage: false,
    isImageLoading: true
  });

  const handleImageError = (e) => {
    setState({imageLoaded: false, isValidImage: false, isImageLoading: false });
  }

  const handleImageLoad=()=>{
    setState({imageLoaded: true, isImageLoading: false, isValidImage: true});
  }

  useEffect(() => {
    setState({imageLoaded: false, isValidImage: false, isImageLoading: true });
  }, [src]);

  const { imageLoaded } = state;

  return (
    <LazyLoad height={120} offset={100} debounce={false} throttle={100} once
      className="inset-0 bg-gradient-to-b from-slate-900/70 to-slate-500/80 bg-no-repeat bg-center bg-cover p-0 m-0"
    >
      <>
      <ImageIcon 
        height={120} 
        className={`h-120 w-full object-cover transition-all ease-in text-slate-600/50 duration-300 hover:scale-105 aspect-square ${imageLoaded ? "hidden" : "block"}`}
      />
      <div className="overflow-hidden w-full h-full p-0 m-0">
        <img 
          alt="React Rendezvous" 
          loading="lazy"
          decoding="async" 
          data-nimg="1" 
          className={`h-auto w-auto object-cover transition-all hover:scale-105 aspect-square`}
          srcSet={src}
          style={{color: "transparent", ...(!imageLoaded ? {width: 0, height: 0} : {height: "100%"})}}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      </div>
      </>
    </LazyLoad>
  )
}