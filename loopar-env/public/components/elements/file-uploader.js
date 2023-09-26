import { span, FileInput } from "/components/elements.js";
import { Modal} from "/components/common/dialog.js";
import { loopar } from "/loopar.js";
import Div from "/components/elements/div.js";

export default class FileUploader extends Div {
   origins = [
      {name: "Local", icon: "fa-desktop"}
   ]

   constructor(props) {
      super(props);

      this.state = {
         ...this.state,
         multiple: true,
         accept: '*',
         withoutLabel: true
      }
   }
   
   FileInput(){
      return FileInput({
         meta: {
            data: {
               name: "file_upload_input",
               label: "Upload",
               multiple: this.state.multiple,
               accept: this.state.accept               
            }
         },
         withoutLabel: true,
         origins: this.origins,
         ref: (ref) => {
            this.fileInput = ref;
         }
      });
   }
   
   render(){
      return super.render(
         this.props.inModal ? [
            Modal({
               icon: "fas fa-folder-open",
               position: "top",
               size: "lg",
               title: "File Uploader",
               open: true,
               content: [
                  this.FileInput()
               ],
               buttons: [
                  {
                     name: "ok",
                     className: "btn btn-primary",
                     content: [
                        span({className: "fa fa-upload pr-2"}),
                        span("Upload")
                     ],
                     onClick: () => {
                        this.upload();
                     }
                  }
               ],
               onClose: () => {
                  this.props.onClose && this.props.onClose();
               }
            })
         ] : this.FileInput()
      );
   }

   get files() {
      return this.fileInput?.files || [];
   }

   upload() {
      const formData = new FormData();

      this.files.forEach((file) => {
         formData.append('files[]', file);
      });

      loopar.method('File Manager', 'upload', formData).then((r) => {
         this.props.onUpload && this.props.onUpload();
      });
   }
}