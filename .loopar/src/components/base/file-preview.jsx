import React, {useEffect} from "react";
import fileManager from "$tools/file-manager";
import loopar from "$loopar";
import { FileIcon } from "lucide-react";
import { ImageIcon } from "lucide-react";
import LazyLoad from 'react-lazy-load';
import MetaImage from "@image"
import MetaComponent from "@meta-component"

function ImageWithFallback({ src, fallbackSrc, alt }) {
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
      className="rounded-md inset-0 bg-gradient-to-b from-slate-900/70 to-slate-500/80 bg-no-repeat mb-10"
    >
      <>
      <ImageIcon 
        height={100} 
        className={`h-120 w-full object-cover transition-all ease-in text-slate-600/50 duration-300 hover:scale-105 aspect-square ${imageLoaded ? "hidden" : "block"}`}
      />
      <div className="overflow-hidden rounded-md w-full">
        <img 
          alt="React Rendezvous" 
          loading="lazy"
          //height={!imageLoaded ? 0 : "150"} 
          decoding="async" 
          data-nimg="1" 
          className={`h-auto w-auto object-cover transition-all hover:scale-105 aspect-square`}
          srcSet={src}
          style={{color: "transparent", ...(!imageLoaded ? {width: 0, height: 0} : {})}}
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

  componentDidUpdate(prevProps, prevState, snapshot) {
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
    const { type, icon, file } = this;
    const data = this.props.file;

    if(!data) return null;

    return (
      <div 
        className="w-[130px] h-[180px] flex-col items-center bg-card border p-2 rounded-md shadow-sm hover:shadow-md transition-all cursor-pointer relative"
        onClick={() => { this.select(!this.isSelected); }}
        //style={{ paddingBottom: 0, ...(this.isSelected ? { boxShadow: "inset 0 0 0 3px var(--primary)", background: "var(--secondary)" } : {}) }}
      >
        <>
          {type === "image" ? (
            <ImageWithFallback
              className="img-fluid"
              src={file.previewSrc || file.src}
              fallbackSrc='/assets/images/blank-image.svg'
              alT={data.name}
          />) : null}
          {/*<a href={this.getSrc()} className="img-link" data-size="600x450">
            <span className="img-caption d-none">{this.name}</span>
          </a>*/}
          {
          /*  type !== "folder" ? 
            <div 
              className="figure-attachment figure-action " 
              style={{ backgroundColor: '#000000cf', width: "100%", display: "flex", justifyContent: "center", alignItems: "center", padding: "0.5rem" }}
            >
              <a 
                className="btn btn-sm btn-danger" 
                onClick={e => { e.preventDefault(); this.props.onDelete && this.props.onDelete(this.attributes); }}
              >
                <span className="oi oi-trash"></span>
              </a>
            </div> : null*/
          }
          {/*
            type !== "image" ? 
            <FileIcon className="w-full h-20"/>
            : null
          */}
        </>
        <div className="space-y-1 text-sm w-full flex flex-col absolute bottom-0 p-1">
          <h3 className="font-medium leading-none truncate w-full">{data.name}</h3>
          <p className="text-xs text-muted-foreground">{this.size}</p>
          {/*<ul className="list-inline d-flex text-muted mb-0">
            <li className="list-inline-item text-truncate mr-auto">
              {this.name}
            </li>
            <li className="list-inline-item">
              <div className="custom-control custom-control-inline custom-checkbox" style={{ marginRight: 0 }}>
                <input className="custom-control-input" key={`file-${data.name}`} type="checkbox" id={`file-${data.name}`} {...(!this.grid ? { checked: this.isSelected } : {})} onChange={e => { e.preventDefault(); this.select(e.target.checked); }} ref={selector => { (this.grid && selector) && (this.grid.selectors[data.name] = selector); }} />
                <label className="custom-control-label" onClick={e => { e.preventDefault(); this.select(!this.isSelected); }}></label>
              </div>
            </li>
        </ul>*/}
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