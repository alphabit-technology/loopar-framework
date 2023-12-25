import { Modal } from "#dialog";
import loopar from "#loopar";
import Div from "#div";
import FileInput from "#file-input";

export default class FileUploader extends Div {
   origins = [
      { name: "Local", icon: "fa-desktop" }
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

   FileInput() {
      return (
         <FileInput
            meta={{
               data: {
                  name: "file_upload_input",
                  label: "Upload",
                  multiple: this.state.multiple,
                  accept: this.state.accept
               }
            }}
            withoutLabel={true}
            origins={this.origins}
            ref={(ref) => {
               this.fileInput = ref;
            }}
         />
      );

   }

   render() {
      return super.render(
         this.props.inModal ? (
            <Modal
               icon="fas fa-folder-open"
               position="top"
               size="lg"
               title="File Uploader"
               open={true}
               onClose={() => {
                  this.props.onClose && this.props.onClose();
               }}
            >
               <div>
                  {this.FileInput()}
               </div>
               <div>
                  <button
                     className="btn btn-primary"
                     onClick={() => {
                        this.upload();
                     }}
                  >
                     <span className="fa fa-upload pr-2"></span>
                     <span>Upload</span>
                  </button>
               </div>
            </Modal>
         ) : this.FileInput()
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