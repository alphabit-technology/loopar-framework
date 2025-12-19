import { useState, useRef, useCallback, useMemo, useEffect, useReducer } from 'react';
import { dataInterface } from "@global/element-definition";
import { FormItem, FormMessage } from "@cn/components/ui/form";
import { FormField } from "./form-field";
import { cn } from "@cn/lib/utils";
import elementManage from "@@tools/element-manage";
import loopar from "loopar";
import { useHidden } from "@context/@/hidden-context";
import { useDesigner } from "@context/@/designer-context";
import { isEqual } from 'es-toolkit/predicate';
import { debounce } from 'es-toolkit/function';
import { useDocument } from "@context/@/document-context";

const inputReducer = (state, action) => {
  switch (action.type) {
    case 'SET_DATA':
      return { ...state, data: action.payload };
    case 'SET_INVALID':
      return { ...state, isInvalid: action.payload };
    case 'SET_FIELD_VALUE':
      return { ...state, fieldValue: action.payload };
    case 'SET_IS_UPDATING':
      return { ...state, isUpdating: action.payload };
    case 'RESET':
      return { ...state, ...action.payload };
    default:
      return state;
  }
};

const BaseInput = (props) => {
  const { 
    element, 
    data: propData, 
    onChange, 
    onChanged, 
    readOnly: propReadOnly, 
    withoutLabel, 
    render: propRender 
  } = props;
  
  const names = useMemo(
    () => element ? elementManage.elementName(element) : {}, 
    [element]
  );
  
  const parentHidden = useHidden();
  const { docRef } = useDocument();
  const { designerMode } = useDesigner();
  
  const getInitialData = useCallback(() => {
    if (element) {
      const data = propData || {};
      data.id ??= names.id || names.key;
      data.name ??= names.name || data.id;
      data.label ??= loopar.utils.Capitalize(
        data.name?.replaceAll("_", " ") || ""
      );
      return data;
    }
    return propData || {};
  }, [element, propData, names.id, names.key, names.name]);

  const initialState = {
    data: getInitialData(),
    isInvalid: false,
    fieldValue: undefined,
    isUpdating: false
  };

  const [state, dispatch] = useReducer(inputReducer, initialState);
  
  const fieldRef = useRef(null);
  const prevData = useRef(null);
  const prevFieldValue = useRef(state.fieldValue);
  const debouncedOnChangeRef = useRef(null);

  useEffect(() => {
    if (!designerMode) return;

    const newData = getInitialData();
    if (!isEqual(prevData.current, newData)) {
      prevData.current = newData;
      dispatch({ type: 'SET_DATA', payload: newData });
    }
  }, [propData, designerMode, getInitialData]);

  useEffect(() => {
    if (!docRef) return;
    
    const fieldName = state.data.name;
    if (fieldName) {
      docRef.__REFS__[fieldName] = state.data;
      return () => {
        delete docRef.__REFS__[fieldName];
      };
    }
  }, [docRef, state.data]);

  const extractValue = useCallback((event) => {
    if (event && typeof event === "object") {
      return event.target.files || event.target.value;
    }
    return event;
  }, []);

  const validate = useCallback(() => {
    if (state.data.hidden || parentHidden) {
      return { valid: true };
    }
    
    if (!fieldRef.current) {
      return { valid: true };
    }
    
    try {
      const validation = dataInterface(
        { data: state.data }, 
        fieldRef.current.value
      ).validate();
      
      if (validation.valid !== !state.isInvalid) {
        dispatch({ 
          type: 'SET_INVALID', 
          payload: !validation.valid 
        });
      }
      
      return validation;
    } catch (error) {
      console.error("Validation error:", error);
      return { valid: true };
    }
  }, [state.data, state.isInvalid, parentHidden]);

  useEffect(() => {
    debouncedOnChangeRef.current = debounce((event) => {
      onChange?.(event);
      onChanged?.(event);
    }, 10);

    return () => {
      if (debouncedOnChangeRef.current) {
        debouncedOnChangeRef.current.cancel();
      }
    };
  }, [onChange, onChanged]);

  useEffect(() => {
    if (designerMode || state.fieldValue === undefined || state.isUpdating) {
      if (!onChange) return;
    }
    
    const event = { target: { value: state.fieldValue } };
    
    if (!state.data.hidden && !parentHidden) {
      validate();
    }

    queueMicrotask(() => {
      debouncedOnChangeRef.current?.(event);
    });
  }, [
    state.fieldValue, 
    designerMode, 
    state.isUpdating,
    state.data.hidden, 
    parentHidden, 
    validate,
    onChange
  ]);

  const handleInputChange = useCallback((event) => {
    if (designerMode || state.isUpdating) return;

    if (!onChange) {
      dispatch({ type: 'SET_IS_UPDATING', payload: true });
    }

    const newValue = extractValue(event);

    if (!isEqual(prevFieldValue.current, newValue)) {
      dispatch({ type: 'SET_FIELD_VALUE', payload: newValue });
      prevFieldValue.current = newValue;
    }
    
    requestAnimationFrame(() => {
      dispatch({ type: 'SET_IS_UPDATING', payload: false });
    });
  }, [designerMode, state.isUpdating, extractValue, onChange]);

  const readOnly = propReadOnly || state.data.readOnly;
  const hasLabel = () => withoutLabel !== true;

  const renderInput = useCallback((input, className = "") => {
    const fieldName = state.data.name || state.data.key || state.data.id || "";
    const isDisabled = !!state.data.disabled;
    
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
            if (isDisabled || state.isUpdating) return;
            
            const newValue = extractValue(e);
            
            if (isEqual(prevFieldValue.current, newValue)) return;
            
            if (field.onChange) {
              field.onChange(e);
            }
            
            handleInputChange(e);
          }, [field.onChange, isDisabled]);

          return (
            <FormItem className={cn("flex flex-col rounded shadow-sm", className)}>
              {input({ 
                ...field, 
                onChange: combinedOnChange, 
                isInvalid: state.isInvalid,
                ref: fieldRef 
              }, state.data)}
              <FormMessage>
                {field.message || (state.isInvalid && field.invalidMessage)}
              </FormMessage>
            </FormItem>
          );
        }}
      />
    );
  }, [
    props.control, 
    props.disabled, 
    props.defaultValue, 
    props.rules, 
    state.data,
    state.isInvalid,
    state.isUpdating,
    handleInputChange, 
    extractValue
  ]);

  if (propRender) {
    return renderInput(propRender);
  }

  return { 
    renderInput, 
    validate, 
    readOnly, 
    hasLabel, 
    data: state.data 
  };
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