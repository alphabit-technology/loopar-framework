import React, {useEffect} from "react";
import fileManager from "$tools/file-manager";
import loopar from "$loopar";
import {ImageIcon} from "lucide-react";
//import {ImageIcon, VideoIcon, MusicIcon, PdfIcon, WordIcon, SheetIcon, PresentationIcon, ArchiveIcon, CodeIcon, TextIcon, FolderIcon, FileIcon} from "lucide-react"
import LazyLoad from 'react-lazy-load';
import { FaFileZipper } from "react-icons/fa6";
import { RiFileExcel2Fill } from "react-icons/ri";
import { BsFillFileEarmarkPdfFill } from "react-icons/bs";
import { FaFile, FaFileAudio, FaFolder } from "react-icons/fa";
import { IoVideocamSharp } from "react-icons/io5";
import { RiFileWord2Fill } from "react-icons/ri";



const fileIcons = {
  image: {
    icon: ImageIcon,
    color: "text-primary",
  },
  video: {
    icon: IoVideocamSharp,
    color: "text-primary",
  },
  audio: {
    icon: FaFileAudio,
    color: "text-primary",
  },
  pdf: {
    icon: BsFillFileEarmarkPdfFill,
    color: "text-red-500",
  },
  zip: {
    icon: FaFileZipper,
    color: "text-yellow-500",
  },
  word: {
    icon: RiFileWord2Fill,
    color: "text-blue-500",
  },
  excel: {
    icon: RiFileExcel2Fill,
    color: "text-green-500",
  },
  archive: {
    icon: FaFileZipper,
    color: "text-yelow-500",
  },
  code: {
    icon: FaFile,
    color: "text-primary",
  },
  text: {
    icon: FaFile,
    color: "text-primary",
  },
  folder: {
    icon: FaFolder,
    color: "text-yellow-500",
  },
  default: {
    icon: FaFile,
    color: "text-primary",
  },
};

function getIconByExtention(extention, type) {
  const icon = fileIcons[extention] || fileIcons[type] || fileIcons["default"];
  return icon;
}

function getFileType(file) {
  if (file.type) {
    return file.type.split("/")[0];
  }

  return file.extention;
}

function getExtention(file) {
  return file.name.split('.').pop();
}

function getFileSize(size) {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;

  while (size > 1024) {
    size /= 1024;
    i++;
  }

  return `${size.toFixed(2)} ${units[i]}`;
}


function ImageWithFallback({ src }) {
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

export default class FilePreview extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      selected: props.selected
    }
  }

  /*getSrc(file, preview = false) {
     return "/uploads/" + (preview ? "thumbnails/" : '') + file.name;
  }*/

  getSrc(preview = false) {
    return "/uploads/" + (preview ? "thumbnails/" : '') + this.file.name;
  }

  get file() {
    return this.props.file
  }

  get extention() {
    return fileManager.getExtention(this.file);
  }

  get type() {
    return fileManager.getFileType(this.file);
  }

  get icon() {
    return fileManager.getIconByExtention(this.extention, this.type);
  }

  get name() {
    return this.file.name;
  }

  get size() {
    return fileManager.getFileSize(this.file?.rawFile?.size || this.file.size);
  }

  get isSelected() {
    return this.state.selected;
  }

  get attributes() {
    return {
      ...this.file,
      selected: this.isSelected,
    }
  }

  componentDidUpdate(prevProps) {
    if (prevProps.selected !== this.props.selected) {
      this.setState({
        selected: this.props.selected
      });
    }
  }

  get docRef() {
    return this.props.docRef;
  }

  get grid() {
    return this.props.grid;
  }

  render() {
    const { type, file } = this;
    const data = this.props.file;

    if(!data) return null;

    console.log(["FilePreview", this.type]);
    const icon = fileIcons[this.type] || fileIcons["default"];
    const Icon = icon.icon;
    const color = icon.color;

    return (
      <div 
        className="w-[130px] h-[180px] flex-col items-center border p-2 shadow-sm hover:shadow-md transition-all cursor-pointer relative"
        onClick={() => { this.select(!this.isSelected); }}
      >
        <>
          {type === "image" ? (
            <ImageWithFallback
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
          <p className="text-xs text-muted-foreground">{this.size}</p>
        </div>
      </div>
    );
  }

  isValidFileType(acceptedTypes = "*/*") {
    const fileType = this.type;
    const fileExtension = this.extention;
    acceptedTypes = Array.isArray(acceptedTypes) ? acceptedTypes : acceptedTypes.split(',');

    for (let i = 0; i < acceptedTypes.length; i++) {
      const acceptedType = acceptedTypes[i];

      if (acceptedType === fileType || acceptedType === fileExtension || acceptedType === '*/*') {

        return true;
      }

      if (acceptedType.endsWith('/*') && fileType.startsWith(acceptedType.slice(0, -2))) {
        return true;
      }
    }

    return false;
  }

  multiple() {
    return typeof this.props.multiple === "undefined" ? true : this.props.multiple;
  }

  /*setFileSelected(selected) {
     const files = this.files;
     const index = files.findIndex((f) => f.name === file.name);

     if (!this.multiple()) {
        files.forEach((f) => {
           f.selected = false;
           //return f;
        });
     }

     if (index !== -1) {
        const file = files[index];
        files[index].selected = selected;

        if (this.props.accept && !this.isValidFileType(file, this.props.accept)) {
           files[index].selected = false

           loopar.dialog({
              type: "error",
              title: "Invalid file type",
              content: `You can only select ${this.props.accept} files`
           });
        }

        this.setState({ files });
     }
  }*/

  select(selected) {
    const data = this.props.file;
    if (this.isValidFileType(this.props.accept) === false) {
      loopar.notify(`You can only select ${this.props.accept} files`, "danger");
      selected = false;
    }

    if (this.grid) {
      if (this.props.multiple === false) {
        Object.values(this.docRef.filesRefs).forEach((ref) => {
          ref && ref !== this && ref.setState({ selected: false });
        });

        this.grid.clearSelection(() => {
          this.grid.selectRow(data, selected);
        });
      } else {
        this.grid.selectRow(data, selected);
      }
    }
    //}
    //
    this.setState({ selected }, () => {
      //trigger();
    });
    /*const trigger = () => {
       //this.props.onSelect && this.props.onSelect({...this.attributes, selected});
    }

    this.type === "folder" && trigger();

    this.setState({ selected }, () => {
       trigger();
    });*/
  }
}