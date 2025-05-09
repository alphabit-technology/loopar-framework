import React, { useState, useEffect } from "react";
import { elementsDict as baseElementsDict } from "@global/element-definition";
import { __META_COMPONENTS__, ComponentsLoader } from "@loopar/components-loader";
import { useDesigner } from "@context/@/designer-context";
import { cn } from "@cn/lib/utils";
import { useDocument } from "@context/@/document-context";
import { useWorkspace } from "@workspace/workspace-provider";
import { buildMetaProps, extractFieldNames, evaluateCondition } from "./meta";
import { MetaRender } from "./MetaRender";
import { DesignElement } from "./DesignElement";

export const Meta = ({ meta, parent, parentKey, className }) => {
  if(meta && meta.$$typeof === Symbol.for("react.transitional.element")){
    return meta;
  }

  const designer = useDesigner();
  const { docRef, formValues } = useDocument();
  const isDesigner = designer.designerMode// && designer.designerModeType != "preview";
  const metaProps = buildMetaProps({ metaProps: meta, parent, isDesigner });
  
  const [loadComponent, setLoadedComponents] = useState(Object.keys(__META_COMPONENTS__).find(c => c === meta.element));
  const Comp = __META_COMPONENTS__[loadComponent]?.default || __META_COMPONENTS__[loadComponent];

  const def = baseElementsDict[meta.element]?.def || {};
  const { ENVIRONMENT } = useWorkspace();

  const isDisplay = () => {
    if (metaProps.data?.display_on){
      const fields = extractFieldNames(metaProps.data?.display_on);

      const values = fields.reduce((acc, field) => {
        acc[field] = formValues[field];
        return acc;
      }, {});

      return evaluateCondition(metaProps.data?.display_on, values);
    }else{
      return ![true, "true", "1", 1].includes(metaProps.data?.hidden);
    }
  }

  /*const [display, setDisplay] = useState(isDisplay());

  useEffect(() => {
    docRef.__REFS__[el.data.name] = {
      ...metaProps.data,
      hidden: !display
    }

    setDisplay(isDisplay());
  }, [formValues]);*/

  if(ENVIRONMENT === "server" && (isDesigner || def.designerOnly !== true)) {
    global.__REQUIRE_COMPONENTS__.push(meta.element);
  }

  const display = isDisplay();
  useEffect(() => {
    if (!Comp && (isDesigner || def.designerOnly !== true)) {
      ComponentsLoader([meta.element], () => {
        setLoadedComponents(Object.keys(__META_COMPONENTS__).find(c => c === meta.element));
      });
    }
  }, []);

  if (Comp || [HTML_BLOCK, MARKDOWN, SEO].includes(meta.element)) {
    const data = metaProps.data || {};

    metaProps.className = cn("relative", (Comp && Comp.designerClasses), metaProps.className, meta.className, className, (!isDesigner || !designer.designing) && 'space-y-4 gap-4', data?.class);

    if (docRef.__META_DEFS__[data.name]) {
      const newData = {
        ...data,
        ...docRef.__META_DEFS__[data.name]?.data || {}
      };

      Object.assign(metaProps, docRef.__META_DEFS__[data.name], { data: newData });
    }

    if (isDesigner && Comp && data.wrapper !== true) {
      return (
        <DesignElement
          Comp={Comp}
          element={metaProps}
          parent={parent}
          parentKey={parentKey}
          def={def}
        />
      )
    } else if (!data.hidden && display) {
      const disabled = data.disabled;
      const Wrapper = disabled ? "div" : React.Fragment;
      const fragmentProps = disabled ? { className: " opacity-40" } : {};

      return (
        <Wrapper {...fragmentProps}>
          <MetaRender
            Comp={Comp}
            meta={meta}
            parent={parent}
            parentKey={parentKey}
            docRef={docRef}
            data={data}
            threshold={0.1}
            metaProps={metaProps}
          />
        </Wrapper>
      )
    }
  } else {
    //console.warn(["Component: " + def.element + " is not loaded yet"]);
    return null;
  }
};