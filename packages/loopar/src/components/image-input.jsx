import FileInput from "@file-input";

export default function ImageInput(props) {
  const data = props.data || {};
  return <FileInput {...props} multiple={data.multiple || false} accept={"image/*"} />;
}

ImageInput.metaFields = () => {
  return [
    ...FileInput.metaFields(),
    [
      {
        group: "form",
        elements: {
          background_image: {
            element: IMAGE_INPUT,
            data: { 
              accept: "image/*",
            }
          }
        }
      }
    ]
  ]
}