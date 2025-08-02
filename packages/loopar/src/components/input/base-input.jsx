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
  const { element, data: propData, onChange, onChanged, readOnly: propReadOnly, withoutLabel, render: propRender } = props;
  
  const names = useMemo(() => element ? elementManage.elementName(element) : {}, [element]);
  const parentHidden = useHidden();
  const { docRef } = useDocument();
  const { designerMode } = useDesigner();
  
  const getInitialData = useCallback(() => {
    if (element) {
      const data = propData || {};
      data.id ??= names.id || names.key;
      data.name ??= names.name || data.id;
      data.label ??= loopar.utils.Capitalize(data.name?.replaceAll("_", " ") || "");
      return data;
    }
    return propData || {};
  }, [element, propData, names]);

  const [data, setData] = useState(getInitialData);
  const [isInvalid, setIsInvalid] = useState(false);
  const [fieldValue, setFieldValue] = useState(undefined);
  
  const fieldRef = useRef(null);
  const prevData = useRef(data);
  const prevFieldValue = useRef(fieldValue);
  const isUpdatingRef = useRef(false);

  useEffect(() => {
    if (!designerMode) return;

    const newData = getInitialData();
    if (!_.isEqual(prevData.current, newData)) {
      setData(newData);
      prevData.current = newData;
    }
  }, [propData, designerMode, getInitialData]);

  useEffect(() => {
    if (!docRef) return;
    
    const fieldName = data.name;
    if (fieldName) {
      docRef.__REFS__[fieldName] = data;
      return () => {
        delete docRef.__REFS__[fieldName];
      };
    }
  }, [docRef, data]);

  const extractValue = useCallback((event) => {
    if (event && typeof event === "object") {
      return event.target.files || event.target.value;
    }
    return event;
  }, []);

  const handleInputChange = useCallback((event) => {
    if (designerMode || isUpdatingRef.current) return;

    // Prevents multiple updates during the same event loop
    // But only if onChange is not provided, to allow external control
    !onChange && (isUpdatingRef.current = true);

    const newValue = extractValue(event);

    if (!_.isEqual(prevFieldValue.current, newValue)) {
      setFieldValue(newValue);
      prevFieldValue.current = newValue;
    }
    
    requestAnimationFrame(() => {
      isUpdatingRef.current = false;
    });
  }, [designerMode, extractValue]);

  const validate = useCallback(() => {
    if (data.hidden || parentHidden) return { valid: true };
    
    if (!fieldRef.current) return { valid: true };
    
    try {
      const validation = dataInterface({ data }, fieldRef.current.value).validate();
      
      setIsInvalid(prev => {
        const newInvalid = !validation.valid;
        return prev === newInvalid ? prev : newInvalid;
      });
      
      return validation;
    } catch (error) {
      console.error("Validation error:", error);
      return { valid: true };
    }
  }, [data, parentHidden]);

  const debouncedOnChange = useMemo(() => {
    return _.debounce((event) => {
      onChange?.(event);
      onChanged?.(event);
    }, 10);
  }, [onChange, onChanged]);

  useEffect(() => {
    if ((designerMode || fieldValue === undefined || isUpdatingRef.current) && !onChange) return;
    
    const event = { target: { value: fieldValue } };
    
    if (!data.hidden && !parentHidden) {
      validate();
    }

    queueMicrotask(() => {
     
      debouncedOnChange(event);
    });
  }, [fieldValue, designerMode, validate, data.hidden, parentHidden, debouncedOnChange]);

  const readOnly = propReadOnly || data.readOnly;
  const hasLabel = () => withoutLabel !== true;

  const renderInput = useCallback((input, className = "") => {
    const fieldName = data.name || data.key || data.id || "";
    const isDisabled = !!data.disabled;
    
    const fieldProps = {
      name: fieldName,
      disabled: props.disabled,
      control: props.control,
      defaultValue: props.defaultValue,
      rules: props.rules
    };
    
    return (
      <FormField
        {...fieldProps}
        render={({ field }) => {
          if (fieldRef.current !== field) {
            fieldRef.current = field;
          }
          
          const combinedOnChange = useCallback((e) => {
            if (isDisabled || isUpdatingRef.current) return;
            
            const newValue = extractValue(e);
            if (_.isEqual(prevFieldValue.current, newValue)) return;
            
            if (field.onChange) {
              field.onChange(e);
            }
            
            handleInputChange(e);
          }, [field.onChange, isDisabled, e => extractValue(e)]);

          return (
            <FormItem className={cn("flex flex-col rounded shadow-sm", className)}>
              {input({ 
                ...field, 
                onChange: combinedOnChange, 
                isInvalid,
                ref: fieldRef 
              }, data)}
              <FormMessage>
                {field.message || (isInvalid && field.invalidMessage)}
              </FormMessage>
            </FormItem>
          );
        }}
      />
    );
  }, [props.control, props.disabled, props.defaultValue, props.rules, data, handleInputChange, isInvalid, extractValue]);

  if (propRender) {
    return renderInput(propRender);
  }

  return { renderInput, validate, readOnly, hasLabel, data };
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
};

BaseInput.donHaveMetaFields = () => {
  return ["text"];
};

export default BaseInput;