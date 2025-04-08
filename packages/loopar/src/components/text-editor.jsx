import BaseInput from "@base-input";
import Quill from './quill/quill';
import {loopar} from "loopar";

export default function MetaHtmlBlock(props) {
  const { renderInput } = BaseInput(props);

  return renderInput((field) => {
    const handleChange = (e) => {
      field.onChange({target: { value: JSON.stringify(e) }});
    }

    return (
      <Quill
        value={loopar.utils.JSONparse(field.value, {})}
        onChange={handleChange}
      />
    )
  });
}
