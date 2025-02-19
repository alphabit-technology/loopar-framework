import React, { useState, useRef, useEffect, useId } from "react";
import { __META_COMPONENTS__, ComponentsLoader } from "@components-loader";
import { useDesigner } from "@context/@/designer-context";
import { DesignElement } from "./src/DesignElement.jsx";
import { Meta } from "./src/Meta.jsx"

export default function MetaComponentBase ({ elements=[], parent, className, parentKey}) {
  return elements.map(meta => {
    if(meta && meta.$$typeof === Symbol.for("react.transitional.element")){
      return meta;
    }
    
    const key = parentKey + (meta.data?.key || useId());

    return (
      <Meta 
        meta={meta}
        parent={parent}
        className={className}
        parentKey={parentKey}
        key={key}
      />
    )
  });
}

export const MetaComponent = ({ component = "div", render, ...props }) => {
  const isDesigner = useDesigner().designerMode;
  const ref = useRef(null);

  const [loadComponent, setLoadedComponents] = useState(Object.keys(__META_COMPONENTS__).find(c => c === component));
  const Comp = __META_COMPONENTS__[loadComponent]?.default || __META_COMPONENTS__[loadComponent];

  useEffect(() => {
    if (!Comp) {
      ComponentsLoader([component], () => {
        setLoadedComponents(Object.keys(__META_COMPONENTS__).find(c => c === component));
      });
    }
  }, []);

  if(!Comp) return null;

  if (isDesigner) {
    return (
      <DesignElement Comp={Comp} element={{ ...props, ...{ element: component } }}>
        {render && render(Comp, ref)}
      </DesignElement>
    )
  }

  return render(Comp, ref);
}