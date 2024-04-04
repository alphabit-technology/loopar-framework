import { Modal } from "$dialog";
import loopar from "$loopar";
import Div from "$div";
import FileInput from "$file-input";
import { FormWrapper } from "$context/form";
import {Button} from "@/components/ui/button";
import { UploadIcon } from "lucide-react";

export default class FileUploader extends Div {
  origins = ["Local", "Trash"]

  constructor(props) {
    super(props);

    this.state = {
      ...this.state,
      multiple: true,
      accept: "*",
      withoutLabel: true,
    };
  }

  FileInput() {
    return (
      <FormWrapper>
        <FileInput
          dontHaveForm={true}
          data={{
            name: "file_upload_input",
            label: "Upload",
            multiple: this.state.multiple,
            accept: this.state.accept,
          }}
          withoutLabel={true}
          origins={this.origins}
          ref={(ref) => {
            this.fileInput = ref;
          }}
        />
      </FormWrapper>
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
          buttons={[]}
        >
          <div>{this.FileInput()}</div>
          <div>
            <Button
              variant="secondary"
              onClick={() => {
                this.upload();
              }}
            >
              <UploadIcon className="w-10 pr-3"/>
              Upload
            </Button>
          </div>
        </Modal>
      ) : (
        this.FileInput()
      )
    );
  }

  get files() {
    return this.fileInput?.files || [];
  }

  upload() {
    const formData = new FormData();

    this.files.forEach((file) => {
      formData.append("files[]", file.rawFile);
    });

    loopar.method("File Manager", "upload", formData).then((r) => {
      this.props.onUpload && this.props.onUpload();
    });
  }
}
