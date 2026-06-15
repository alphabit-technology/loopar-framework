import { useMemo, useCallback } from "react";
import BaseInput from "@base-input";
import { Designer } from "./designer/base-designer";
import { useDesigner } from "@context/@/designer-context";

function DesignerField({ field, node, data, designerMode }) {
  // Memoize the parse so `metaComponents` keeps a STABLE reference between
  // renders and is only re-parsed when the serialized value actually changes.
  // Previously JSON.parse ran on every render, producing a fresh object that
  // forced BaseDesigner's deep-equal sync effect (and a re-populate) to run
  // each time — wasted work on top of every drop/edit.
  const metaComponents = useMemo(() => JSON.parse(field.value), [field.value]);
  const handleChange = useCallback((value) => field.onChange(value), [field]);

  return (
    <Designer
      node={designerMode ? node + "_designer" : node}
      metaComponents={metaComponents}
      data={{
        ...data,
      }}
      onChange={handleChange}
    />
  );
}

export default function MetaDesigner(props) {
  const { renderInput, data } = BaseInput(props);
  const { designerMode } = useDesigner();
  const node = props.node || data.key;

  return renderInput((field) => (
    <DesignerField
      field={field}
      node={node}
      data={data}
      designerMode={designerMode}
    />
  ));
}
