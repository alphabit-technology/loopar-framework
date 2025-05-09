import React, { useState, useEffect, useRef } from 'react';
import { __META_COMPONENTS__ } from "@loopar/components-loader";
import loopar from "loopar";
import { elementsDict } from "@global/element-definition";
import Tabs from "@tabs";
import {MetaComponent} from "@@meta/meta-component";
import { Separator } from "@cn/components/ui/separator";
import Tab from "@tab";
import { getMetaFields } from "@@tools/meta-fields";
import { DesignerContext, useDesigner } from "@context/@/designer-context";
import Emitter from '@services/emitter/emitter';
import { FormWrapper } from "@context/form-provider";
import _ from "lodash";

function mergeGroups(...arrays) {
  const groupMap = new Map();

  const flattenedArrays = arrays.flat();

  flattenedArrays.forEach(group => {
    const groupName = group.group;

    if (!groupMap.has(groupName)) {
      groupMap.set(groupName, { ...group, elements: { ...group.elements } });
    } else {
      const existingGroup = groupMap.get(groupName);
      const mergedElements = {
        ...existingGroup.elements,
        ...group.elements,
      };
      groupMap.set(groupName, { ...existingGroup, elements: mergedElements });
    }
  });
  
  const allElements = new Set();

  flattenedArrays.forEach(group => {
    Object.keys(group.elements).forEach(elementKey => {
      if (allElements.has(elementKey)) {
        groupMap.forEach((mappedGroup, groupName) => {
          if (groupName !== group.group && mappedGroup.elements[elementKey]) {
            delete mappedGroup.elements[elementKey];
          }
        });
      } else {
        allElements.add(elementKey);
      }
    });
  });

  return Array.from(groupMap.values());
}

export function ElementEditor({ element }) {
  const { updateElement, getElement } = useDesigner();
  const connectedElement = getElement(element);
  if (!connectedElement) return null;

  const [elementName, setElementName] = useState(connectedElement?.element || "");
  const [data, setData] = useState(connectedElement?.data || {});
  const prevData = useRef({ ...data });

  const Element = __META_COMPONENTS__[elementName]?.default || {};

  const handleSetData = (data) => {
    /*if (!_.isEqual(prevData.current, data)) {
      //setData(data);
      prevData.current = { ...data };
    }*/
  }

  const handleSetConnectedElement = (e) => {
    if (!e) return;
    const el = getElement(e);

    if (el && el.data.key == connectedElement?.data.key) {
      handleSetData(el.data);
    }
  }

  useEffect(() => {
    const handleEdit = (el) => {
      el == element && handleSetConnectedElement(el);
    };

    Emitter.on('currentElementEdit', handleEdit);
    return () => {
      Emitter.off('currentElementEdit', handleEdit);
    };
  }, []);
  
  useEffect(() => {
    handleSetConnectedElement(element);
  }, [element]);

  useEffect(() => {
    if (!connectedElement) return;

    handleSetData(connectedElement?.data || {});
    setElementName(connectedElement?.element || "");
  }, [element, connectedElement, connectedElement.data]);

  const metaFields = () => {
    const genericMetaFields = getMetaFields(data);
    const selfMetaFields = Element.metaFields && Element.metaFields() || [];
    return mergeGroups(genericMetaFields, ...selfMetaFields);
  };

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
          hidden: 0,
          required: 0,
        }
      };
    }

    return { group, elements };
  });

  const __FORM_FIELDS__ = {};
  metaFieldsData.map(({ group, elements }) => (
    Object.entries(elements).map(([field, props]) => {
      if (dontHaveMetaElements.includes(field)) return null;
      if (!props.element) return props;

      __FORM_FIELDS__[data.key + field] = data[field];
    })
  ));
    
  const saveData = (_data) => {
    function cleanObject(obj) {
      return Object.fromEntries(
        Object.entries(obj)/*.filter(([_, value]) => value ?? false)*/.map(([key, value]) => [key.replace(data.key, ""), value])
      );
    }

    const newData = cleanObject(_data);
    newData.key = data.key;
    newData.value = data.value;

    if (!_.isEqual(prevData.current, newData)) {
      updateElement(newData.key, newData, false, false);
      prevData.current = { ...newData };
    }
  };
  
  return (
    <DesignerContext.Provider
      value={{}}
    >
      <FormWrapper __DOCUMENT__={__FORM_FIELDS__} onChange={saveData}>
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
                <div className="flex flex-col gap-2">
                  {Object.entries(elements).map(([field, props]) => {
                    if (dontHaveMetaElements.includes(field)) return null;
                    if (!props.element) return props;

                    return (
                      <MetaComponent
                        component={props.element}
                        render={Component => (
                          <Component
                            data={{
                              ...props.data,
                              name: data.key + field,
                              label: props.label || loopar.utils.Capitalize(field.replaceAll("_", " "))
                            }}
                            //onChange={saveData}
                          />
                        )}
                      />
                    );
                  })}
                </div>
              </Tab>
            ))}
          </Tabs>
        </div>
      </FormWrapper>
    </DesignerContext.Provider>
  );
};
