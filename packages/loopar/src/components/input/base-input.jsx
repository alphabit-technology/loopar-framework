import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { dataInterface } from "@global/element-definition";
import { FormItem, FormMessage } from "@cn/components/ui/form";
import { FormField } from "./form-field";
import { cn } from "@cn/lib/utils";
import elementManage from "@@tools/element-manage";
import loopar from "loopar";
import { useHidden } from "@context/@/hidden-context";
import { useDesigner } from "@context/@/designer-context";
import _ from "lodash";

import { useDocument } from "@context/@/document-context";

const BaseInput = (props) => {
  const [isInvalid, setIsInvalid] = useState(false);
  const fieldRef = useRef(null);
  const [fieldValue, setFieldValue] = useState(props.value || (props.data && props.data.value) || "");

  const names = useMemo(() => elementManage.elementName(props.element), [props.element]);
  const parentHidden = useHidden();
  const { docRef } = useDocument();
  const { designerMode } = useDesigner();

  const getData = () => {
    if (props.element) {
      const data = props.data || {};
      data.id ??= names.id || names.key;
      data.name ??= names.name || data.id;
      data.label ??= loopar.utils.Capitalize(data.name.replaceAll("_", " "));
      return data;
    }
    return props.data || {};
  };

  const [data, setData] = useState(getData());
  const prevData = useRef(data);

  useEffect(() => {
    if(!designerMode) return;

    const newData = getData();
    if (!_.isEqual(prevData.current, newData)) {
      setData(newData);
      prevData.current = newData;
    }
  }, [props.data]);

  useEffect(() => {
    if (docRef) {
      const data = getData();
      docRef.__REFS__[data.name] = data;
      return () => {
        delete docRef.__REFS__[data.name];
      };
    }
  }, []);

  const handleInputChange = useCallback((event) => {
    if(designerMode) return;

    let newValue;
    if (event && typeof event === "object") {
      newValue = event.target.files || event.target.value;
    } else {
      newValue = event;
    }
    setFieldValue(newValue);
  }, []);

  useEffect(() => {
    if(designerMode) return;
    const event = { target: { value: fieldValue } };
    validate();
    
    props.onChange?.(event);
    props.onChanged?.(event);
  }, [fieldValue]);

  const validate = () => {
    if(designerMode) return;
    if (data.hidden || parentHidden) return { valid: true };
    const validation = dataInterface({ data }, fieldValue).validate();
    setIsInvalid(!validation.valid);
    return validation;
  };

  const value = (val) => {
    if (typeof val === "undefined") return fieldValue;
    setFieldValue(val);
  };

  const readOnly = props.readOnly || data.readOnly;
  const hasLabel = () => props.withoutLabel !== true;

  const renderInput = (input, className = "") => {
    const invalidClassName = isInvalid ? "border border-red-500 p-2" : "";

    return (
      <FormField
        name={data.name || data.key || data.id || ""}
        {...props}
        render={({ field }) => {
          fieldRef.current = field;
          const combinedOnChange = (e) => {
            if (field.onChange) field.onChange(e);
            handleInputChange(e);
          };

          return (
            <FormItem className={cn("flex flex-col mb-2 rounded shadow-sm", invalidClassName, className)}>
              {input({ ...field, onChange: combinedOnChange }, data)}
              <FormMessage>
                {field.message || (isInvalid && field.invalidMessage)}
              </FormMessage>
            </FormItem>
          );
        }}
      />
    );
  };

  if (props.render) {
    return renderInput(props.render);
  }

  return { renderInput, value, validate, readOnly, hasLabel, data, fieldControl:fieldRef };
};


BaseInput.metaFields = () => {
  return [[
    {
      group: "form",
      elements: {
        id: { element: INPUT },
        label: { element: INPUT },
        name: { element: INPUT },
        description: { element: TEXTAREA },
        placeholder: { element: TEXTAREA },
        required: { element: SWITCH },
        unique: { element: SWITCH },
        set_only_time: { element: SWITCH },
        readonly: { element: SWITCH },
        in_list_view: { element: SWITCH },
        searchable: { element: SWITCH }
      },
    },
  ]];
}

BaseInput.donHaveMetaFields = () => {
  return ["text"];
}

export default BaseInput;
