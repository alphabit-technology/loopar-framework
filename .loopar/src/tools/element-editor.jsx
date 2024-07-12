import React, { useState, useMemo } from 'react';
import loopar from "$loopar";
import { elementsDict } from "$global/element-definition";
import Tabs from "@tabs";
import { MetaComponent } from "@meta-component";
import { Separator } from "@/components/ui/separator";
import Tab from "@tab";
import { getMetaFields } from "@tools/meta-fields";
//import { useDesigner } from "@custom-hooks";

export function ElementEditor({updateElement, connectedElement}) {

  const [state, setState] = useState({
    connectedElement: connectedElement,
    data: connectedElement?.data || {}
  });

  const formValues = useMemo(() => connectedElement?.data || {}, [connectedElement]);

  const metaFields = () => {
    const genericMetaFields = getMetaFields(getData());
    const selfMetaFields = [] // props.connectedElement?.metaFields || [];

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
    const data = getData();
    updateElement(data.key, data, false);
    setTimeout(() => {
      setState(prevState => ({ ...prevState, data: data }));
    });
  };

  const getData = () => {
    const data = formValues;
    data.key ??= state.connectedElement.data.name;
    return data;
  };

  //const connectedElement = state.connectedElement || null;
  if (!connectedElement) return null;

  const data = formValues;
  typeof data.options === 'object' && (data.options = JSON.stringify(data.options));

  const dontHaveMetaElements = connectedElement.dontHaveMetaElements || [];

  const metaFieldsData = metaFields().map(({ group, elements }) => {
    if (group === 'form' && elementsDict[connectedElement.element]?.def?.isWritable && ["designer", "fragment"].includes(connectedElement.element) === false) {
      elements['divider_default'] = (
        <Separator className="my-3" />
      );

      elements['default_value'] = {
        element: connectedElement.element,
        data: {
          ...connectedElement.data,
          key: connectedElement.data.key + "_default",
          label: "Default",
          name: "default_value",
          hidden: 0
        }
      };
    }

    return { group, elements };
  });

  return (
    <div className="flex flex-col">
      <h1 className="pt-2 text-xl">
        {loopar.utils.Capitalize(connectedElement.element)} Editor
      </h1>
      <Tabs
        data={{ name: "element_editor_tabs" }}
        key={connectedElement.data.key + "_tabs"}
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

              const value = data[field];
              formValues[field] = value;

              return (
                <MetaComponent
                  component={props.element}
                  render={Component => (
                    <Component
                      key={connectedElement.data.key + "_" + field}
                      dontHaveForm={true}
                      data={{
                        ...props.data,
                        name: field,
                        value: value,
                        label: props.label || loopar.utils.Capitalize(field.replaceAll("_", " "))
                      }}
                      onChange={(e) => {
                        formValues[field] = e.target ? e.target.value : e;
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
  );
};
