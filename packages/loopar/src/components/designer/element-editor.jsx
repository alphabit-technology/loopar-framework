import { useRef, useMemo } from 'react';
import { __META_COMPONENTS__ } from "@loopar/components-loader";
import loopar from "loopar";
import { elementsDict } from "@global/element-definition";
import Tabs from "@tabs";
import {MetaComponent} from "@@meta/meta-component";
import { Separator } from "@cn/components/ui/separator";
import Tab from "@tab";
import { getMetaFields } from "@@tools/meta-fields";
import { DesignerContext, useDesigner } from "@context/@/designer-context";
import { FormWrapper } from "@context/form-provider";
import { isEqual } from 'es-toolkit/predicate';

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

export function ElementEditor() {
  const { updateElement, updatingElement } = useDesigner();

  if (!updatingElement) return null;

  const elementName = updatingElement.element;

  const data = useMemo(() => {
    return {...updatingElement.data,};
  }, [updatingElement.data, elementName]);

  const elementKey = updatingElement.node ?? data.key;

  const Element = __META_COMPONENTS__[elementName]?.default || {};

  typeof data.options === 'object' && (data.options = JSON.stringify(data.options));

  const dontHaveMetaElements = Element.dontHaveMetaElements || []

  const metaFields = useMemo(() => {
    const genericMetaFields = getMetaFields(updatingElement);
    const selfMetaFields = Element.metaFields && Element.metaFields() || [];
    return mergeGroups(genericMetaFields, ...selfMetaFields);
  }, [data, Element]);

  const metaFieldsData = useMemo(() => {
    return metaFields.map(({ group, elements }) => {
      if (group === 'form' && elementsDict[elementName]?.def?.isWritable && ["designer", "fragment"].includes(elementName) === false) {
        elements['divider_default'] = (
          <Separator className="my-3" />
        );
  
        elements['default_value'] = {
          element: elementName,
          key: elementKey + "_default",
          data: {
            ...data,
            label: "Default",
            hidden: 0,
            required: 0,
          }
        };
      }
  
      return { group, elements };
    });
  }, [metaFields, elementName, data]);

  const __FORM_FIELDS__ = useMemo(() => {
    const formFields = {};
    metaFieldsData.forEach(({ group, elements }) => {
      Object.entries(elements).forEach(([field, props]) => {
        if (dontHaveMetaElements.includes(field)) return null;
        if (!props.element) return props;
        // Same "missing" semantics as applyMetaDefaults (@@tools/meta-defaults):
        // only undefined/null/"" fall back to the default, so explicit falsy
        // values (false, 0) set by the user are not overwritten in the form.
        const value = data[field];
        formFields[elementKey + field] =
          (value === undefined || value === null || value === "")
            ? props?.data?.default_value
            : value;
      });
    });

    return formFields;
  }, [metaFieldsData, dontHaveMetaElements, data, elementKey]);

  const prevData = useRef(__FORM_FIELDS__);
  const editingKey = useRef(elementKey);

  if (editingKey.current !== elementKey) {
    editingKey.current = elementKey;
    prevData.current = __FORM_FIELDS__;
  }

  const saveData = (_data) => {
    if(!prevData.current || isEqual(prevData.current, _data)) return;

    prevData.current = { ..._data };

    function cleanObject(obj) {
      return Object.fromEntries(
        // Drop only truly empty values; false/0 are legitimate user values
        // (the old `value ?? false` filter made switches impossible to turn off).
        Object.entries({...obj}).filter(([_, value]) => value !== undefined && value !== null && value !== "")
      );
    }

    function cleanKey(obj) {
      return Object.fromEntries(
        Object.entries({...obj}).map(([key, value]) => [key.replace(elementKey, ""), value])
      );
    }

    const newData = cleanKey(_data);
    //newData.key = elementKey;
    newData.value = data.value;

    updateElement(elementKey, cleanObject(newData), false, true);
  };
  
  const formRef = useRef(null);

  return (
    <DesignerContext.Provider
      value={{}}
    >
      <FormWrapper
        key={`${elementKey}${updatingElement.__version__ ?? ""}`}
        __DATA__={__FORM_FIELDS__}
        onChange={saveData}
        formRef={formRef}
      >
        <div className="flex flex-col">
          <div className="p-3 pb-0">
           <span className='text-2xl'>{loopar.utils.Capitalize(elementName)}</span>
           <span className="text-muted-foreground text-sm">{elementKey}</span>
          </div>
          <Tabs
            data={{ name: "element_editor_tabs" }}
            tabsClassName="flex flex-wrap justify-start border"
          >
            {metaFieldsData.map(({ group, elements }) => (
              <Tab
                key={`${elementKey}-${group}-tab`}
                label={loopar.utils.Capitalize(group)}
                name={group + "_tab"}
              >
                <div className="flex flex-col gap-2">
                  {Object.entries(elements).map(([field, props]) => {
                    if (dontHaveMetaElements.includes(field)) return null;
                    if (!props.element) {
                      return <div key={`${elementKey}-${group}-${field}`}>{props}</div>;
                    }

                    return (
                      <MetaComponent
                        key={`${elementKey}-${group}-${field}`}
                        component={props.element}
                        render={Component => (
                          <Component
                            data={{
                              ...props.data,
                              name: elementKey + field,
                              label: props.data?.label || loopar.utils.Capitalize(field.replaceAll("_", " ")),
                            }}
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
