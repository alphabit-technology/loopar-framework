import BaseInput from "@base-input";
import Quill from './quill/quill';

export default function MetaHtmlBlock(props) {
  const { renderInput, value } = BaseInput(props);

  const handleChange = (content) => {
    value(content);
  }

  return renderInput(() => {
    return (
      <Quill
        data={{value: value()}} 
        onChange={handleChange}
      />
    )
  });
}
