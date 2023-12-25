//import { div, span, label, input, i, figure, figcaption, ul, li, image, a } from "/components/elements.js";
import { fileManager } from "@loopar/tools/file-manager.js";
import { loopar } from "@loopar/loopar.js";

class ImageWithFallback extends React.Component {
   constructor(props) {
      super(props);
      this.state = {
         isValidImage: true,
         isImageLoading: true
      };
   }

   handleImageError() {
      this.setState({ isValidImage: false, isImageLoading: false });
   }

   handleImageLoad() {
      this.setState({ isImageLoading: false });
   }

   render() {
      const { src, fallbackSrc, alt } = this.props;
      const { isValidImage, isImageLoading } = this.state;

      return [
         //span({ className: "fa fa-image fa-8x", style: {opacity: 0.4}}),
         image({
            className: this.props.className,
            src: fallbackSrc,
            alt: alt,
            style: {
               opacity: 0.7,
               position: "absolute",
               width: "100%",
               height: "100%",
               objectFit: "cover",
               transition: "opacity 0.7s ease-in-out",
               backgroundColor: "var(--light)"
            },
         }),
         isValidImage ? (
            image({
               className: this.props.className,
               src: src,
               alt: alt,
               onLoad: () => this.handleImageLoad(),
               onError: () => this.handleImageError(),
               style: {
                  opacity: isImageLoading ? 0 : 1,
                  position: "absolute",
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  transition: "opacity 0.6s ease-in-out"
               }
            })
         ) : null
      ]
   }
}

class FilePreviewClass extends React.Component {
   constructor(props) {
      super(props);
      this.state = {
         selected: props.selected
      }
   }

   getSrc(file, preview = false) {
      return "/uploads/" + (preview ? "thumbnails/" : '') + file.name;
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
      return fileManager.getFileSize(this.file);
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

   getSrc(preview = false) {
      return "/uploads/" + (preview ? "thumbnails/" : '') + this.file.name;
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
      const {type, icon, file} = this;
      const data = this.props.file;
      
      return <>
         <div className="grid-item">
            <div className="card card-figure" style={{ paddingBottom: 0, ...(this.isSelected ? { boxShadow: "inset 0 0 0 3px var(--primary)", background: "var(--secondary)" } : {}) }}>
               <figure className="figure" onClick={() => { this.select(!this.isSelected); }}>
                  <div className="figure-attachment">
                     {type === "image" ? React.createElement(ImageWithFallback, {
                        className: "img-fluid",
                        src: file.previewSrc || file.src,
                        fallbackSrc: '/uploads/empty-image.svg',
                        alt: this.name
                     }) : null}
                     <a href={this.getSrc()} className="img-link" data-size="600x450">
                        <span className="img-caption d-none">{this.name}</span>
                     </a>
                     {type !== "folder" ? <div className="figure-attachment figure-action " style={{ backgroundColor: '#000000cf', width: "100%", display: "flex", justifyContent: "center", alignItems: "center", padding: "0.5rem" }}>
                        <a className="btn btn-sm btn-danger" onClick={e => { e.preventDefault(); this.props.onDelete && this.props.onDelete(this.attributes); }}>
                           <span className="oi oi-trash"></span>
                        </a>
                     </div> : null}
                     {type !== "image" ? <i className={`fa ${icon.icon} fa-7x text-${icon.color}`}></i> : null}
                  </div>
                  <figcaption className="figure-caption">
                     <ul className="list-inline d-flex text-muted mb-0">
                        <li className="list-inline-item text-truncate mr-auto">
                           {this.name}
                        </li>
                        <li className="list-inline-item">
                           <div className="custom-control custom-control-inline custom-checkbox" style={{ marginRight: 0 }}>
                              <input className="custom-control-input" key={`file-${data.name}`} type="checkbox" id={`file-${data.name}`} {...(!this.grid ? { checked: this.isSelected } : {})} onChange={e => { e.preventDefault(); this.select(e.target.checked); }} ref={selector => { (this.grid && selector) && (this.grid.selectors[data.name] = selector); }} />
                              <label className="custom-control-label" onClick={e => { e.preventDefault(); this.select(!this.isSelected); }}></label>
                           </div>
                        </li>
                     </ul>
                  </figcaption>
               </figure>
         </div>
      </div>
   }

   isValidFileType(acceptedTypes="*/*") {
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
      if(this.isValidFileType(this.props.accept) === false) {
         loopar.notify(`You can only select ${this.props.accept} files`, "danger");
         selected = false;
      }

      if(this.grid){
         if(this.props.multiple === false) {
            Object.values(this.docRef.filesRefs).forEach((ref) => {
               ref && ref !== this && ref.setState({ selected: false });
            });

            this.grid.clearSelection(() => {
               this.grid.selectRow(data, selected);
            });
         }else {
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

export const FilePreview = (props) => {
   return React.createElement(FilePreviewClass, props);
}