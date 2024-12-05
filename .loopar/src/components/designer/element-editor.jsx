import React, { useState, useEffect} from 'react';
import { __META_COMPONENTS__ } from "@components-loader";
import loopar from "loopar";
import { elementsDict } from "@global/element-definition";
import Tabs from "@tabs";
import { MetaComponent } from "@meta-component";
import { Separator } from "@/components/ui/separator";
import Tab from "@tab";
import { getMetaFields } from "@tools/meta-fields";
import { DesignerContext, useDesigner } from "@context/@/designer-context";

export function ElementEditor({element}) {
  const {designerRef} = useDesigner();
  const [connectedElement, setConnectedElement] = useState(designerRef.getElement(element));
  if(!connectedElement) return null;
  
  const [elementName, setElementName] = useState(connectedElement?.element || "");
  const [data, setData] = useState(connectedElement?.data || {});
  const Element = __META_COMPONENTS__[elementName]?.default || {};

  useEffect(() => {
    setConnectedElement(designerRef.getElement(element));
  }, [element]);

  useEffect(() => {
    setData(connectedElement?.data || {});
    setElementName(connectedElement?.element || "");
  }, [element, connectedElement]);

  const metaFields = () => {
    const genericMetaFields = getMetaFields(data);
    
    const selfMetaFields = Element.metaFields && Element.metaFields() || [];
    const mergedObj = {};

    genericMetaFields.concat(selfMetaFields).forEach(item => {
      const group = item.group;
      if (!mergedObj[group]) {
        mergedObj[group] = { elements: {} };
      }

      const elements = item.elements;
      for (const key in elements) {
        mergedObj[group].elements[key] = elements[key];
      }
    });

    return Object.keys(mergedObj).map(group => ({
      group,
      elements: mergedObj[group].elements,
    }));
  };

  const saveData = () => {
    designerRef.updateElement(data.key, data, false);
  };

  if (!connectedElement) return null;

  typeof data.options === 'object' && (data.options = JSON.stringify(data.options));
  const dontHaveMetaElements = Element.dontHaveMetaElements || [];

  const metaFieldsData = metaFields().map(({ group, elements }) => {
    if (group === 'form' && elementsDict[elementName]?.def?.isWritable && ["designer", "fragment"].includes(elementName) === false) {
      elements['divider_default'] = (
        <Separator className="my-3" />
      );

      elements['default_value'] = {
        element: elementName,
        data: {
          ...data,
          key: data.key + "_default",
          label: "Default",
          //name: "default_value",
          hidden: 0
        }
      };
    }

    return { group, elements };
  });

  return (
    <DesignerContext.Provider 
      value={{}}
    >
      <div className="flex flex-col">
        <h2 className="pt-2 text-xl">
          {loopar.utils.Capitalize(elementName)} Editor
        </h2>
        <Tabs
          data={{ name: "element_editor_tabs" }}
          key={data.key + "_tabs"}
        >
          {metaFieldsData.map(({ group, elements }) => (
            <Tab
              label={loopar.utils.Capitalize(group)}
              name={group + "_tab"}
              key={group + "_tab"}
            >
              {Object.entries(elements).map(([field, props]) => {
                if (dontHaveMetaElements.includes(field)) return null;
                if (!props.element) {
                  return props;
                }

                if(!data[field]) {
                  data[field] = props.data?.value;
                }

                const value = data[field];

                return (
                  <MetaComponent
                    component={props.element}
                    render={Component => (
                      <Component
                        dontHaveForm={true}
                        data={{
                          ...props.data,
                          name: data.key + field,
                          value: value,
                          label: props.label || loopar.utils.Capitalize(field.replaceAll("_", " "))
                        }}
                        onChange={(e) => {
                          data[field] = e.target ? e.target.value : e;
                          saveData();
                        }}
                      />
                    )}
                  />
                )
              })}
            </Tab>
          ))}
        </Tabs>
      </div>
    </DesignerContext.Provider>
  );
};
