import { useState, useRef, useEffect, useId } from "react";
import { __META_COMPONENTS__, ComponentsLoader } from "@loopar/components-loader";
import { useDesigner } from "@context/@/designer-context";
import { DesignElement } from "./src/DesignElement.jsx";
import { Meta } from "./src/Meta.jsx"
import { useWorkspace } from "@workspace/workspace-provider";

import { elementsDict as baseElementsDict } from "@global/element-definition";

export default function MetaComponentBase ({ elements=[], parent, className, parentKey}) {
  const isDesigner = useDesigner().designerMode;

  return elements.map((meta, index) => {
    if(meta && meta.$$typeof === Symbol.for("react.transitional.element")){
      return meta;
    }
    
    const key = (meta.data?.key || parentKey) + (isDesigner ? 'd' : '') + index;

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
  const { ENVIRONMENT } = useWorkspace();
  const [loadComponent, setLoadedComponents] = useState(Object.keys(__META_COMPONENTS__).find(c => c === component));
  const Comp = __META_COMPONENTS__[loadComponent]?.default || __META_COMPONENTS__[loadComponent];

  const def = baseElementsDict[component]?.def || {};

  if(ENVIRONMENT === "server" && (isDesigner || def.designerOnly !== true)) {
    global.__REQUIRE_COMPONENTS__.push(component);
  }
  
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