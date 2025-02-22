import { Modal } from "@dialog";
import loopar from "loopar";
import FileInput from "@file-input";
import { FormWrapper } from "@context/form";
import { Button } from "@cn/components/ui/button";
import { UploadIcon } from "lucide-react";
import { useState } from "react";

const origins = ["Local", "Trash"];

export default function FileUploader(props) {
  const [files, setFiles] = useState([]);

  const upload = () => {
    const formData = new FormData();
    (files.target?.value || []).forEach((file) => {
      if (file.rawFile instanceof File) {
        formData.append("files[]", file.rawFile);
      }
    });

    loopar.method("File Manager", "upload", {}, {
      body: formData,
      success: (r) => {
        console.log(["Upload", r]);
        props.onUpload && props.onUpload();
      }
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
          accept: "/*",
        }}
        withoutLabel={true}
        origins={origins}
        onChange={setFiles}
      />
    </FormWrapper>
  )

  return (
    props.inModal ? (
      <Modal
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
        <div className="flex justify-end mt-3">
          <Button
            variant="secondary"
            onClick={upload}
          >
            <UploadIcon className="w-10 pr-3" />
            Upload
          </Button>
        </div>
      </Modal>
    ) : (
      FileInputFn()
    )
  );
}
