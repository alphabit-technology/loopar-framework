import BaseInput from "@base-input";
import { Designer } from "./designer/base-designer";
import { useDesigner } from "@context/@/designer-context";

export default function MetaDesigner(props) {
  const { renderInput, data } = BaseInput(props);
  const {designerMode} = useDesigner();

  return renderInput((field) => {
    const handleChange = (value) => {
      field.onChange(value);
    };
    
    return (
      <Designer
        key={designerMode ? data.key : data.key + "_designer"}
        metaComponents={JSON.parse(field.value)}
        data={{
          ...data,
          key: designerMode ? data.key : data.key + "_designer",
        }}
        onChange={handleChange}
      />
    )
  });
}
