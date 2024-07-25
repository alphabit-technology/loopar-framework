import FileInput from "$file-input";

export default function ImageInput(props) {
  const data = props.data || {};
  return <FileInput {...props} multiple={data.multiple || false} accept={data.accept || "image/*"} />;
}