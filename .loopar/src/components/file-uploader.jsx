import { Modal } from "@dialog";
import loopar from "$loopar";
import FileInput from "@file-input";
import { FormWrapper } from "@context/form";
import {Button} from "@/components/ui/button";
import { UploadIcon } from "lucide-react";
import { useRef } from "react";

export default function FileUploader(props){
  const origins = ["Local", "Trash"];
  const fileInput = useRef(null);

  const getFiles = () => {
    return fileInput.current.files || [];
  }

  const upload = () => {
    const formData = new FormData();

    getFiles().forEach((file) => {
      formData.append("files[]", file.rawFile);
    });

    loopar.method("File Manager", "upload", formData).then((r) => {
      props.onUpload && props.onUpload();
    });
  }

  const FileInputFn = () => (
    <FormWrapper>
      <FileInput
        dontHaveForm={true}
        data={{
          name: "file_upload_input",
          label: "Upload",
          multiple: true,
          accept: "*",
        }}
        withoutLabel={true}
        origins={origins}
        ref={fileInput}
      />
    </FormWrapper>
  )

  return (
    props.inModal ? (
      <Modal
        icon="fas fa-folder-open"
        position="top"
        size="lg"
        title="File Uploader"
        open={true}
        onClose={() => {
          props.onClose && props.onClose();
        }}
        buttons={[]}
      >
        <div>{FileInputFn()}</div>
        <div>
          <Button
            variant="secondary"
            onClick={upload}
          >
            <UploadIcon className="w-10 pr-3"/>
            Upload
          </Button>
        </div>
      </Modal>
    ) : (
      FileInputFn()
    )
  );
}
