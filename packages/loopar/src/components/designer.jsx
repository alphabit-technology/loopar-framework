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
    
    const node = props.node || data.key;
    return (
      <Designer
        node={designerMode ? node + "_designer" : node}
        metaComponents={JSON.parse(field.value)}
        data={{
          ...data,
        }}
        onChange={handleChange}
      />
    )
  });
}
