import { useState, useRef, useCallback, useMemo, useEffect, use } from 'react';
import { dataInterface } from "@global/element-definition";
import { FormItem, FormMessage } from "@/components/ui/form";
import { FormField } from "./form-field";
import { cn } from "@/lib/utils";
import elementManage from "@tools/element-manage";
import loopar from "loopar";
import { useHidden } from "@context/@/hidden-context";
import _ from "lodash";

import { useDocument } from "@context/@/document-context";

const BaseInput = (props) => {
  const [isInvalid, setIsInvalid] = useState(false);
  const fieldControl = useRef(null);
  const names = useMemo(() => elementManage.elementName(props.element), [props.element]);
  const parentHidden = useHidden();
  const { docRef } = useDocument();
  
  const getData = () => {
    if(props.element) {
      const data = props.data || {};

      data.id ??= names.id || names.key;
      data.name ??= names.name || data.id;

      data.label ??= loopar.utils.Capitalize(data.name.replaceAll("_", " "));
      return data;
    } else {
      return props.data || {};
    }
  }

  const [data, setData] = useState(getData());

  const prevData = useRef(data);

  useEffect(() => {
    const newData = getData();
    if(!_.isEqual(prevData.current, newData)){
      setData(newData);
      prevData.current = newData;
    }
  }, [props.data, props.data.value]);

  useEffect(() => {
    if(docRef){
      const data = getData();
      docRef.__REFS__[data.name] = getData();

      return () => {
        delete docRef.__REFS__[data.name];
      };
    }
  }, []);

  const handleInputChange = useCallback((event) => {
    if (event && typeof event === "object") {
      event.target ??= {};
      event.target.value = (event.target.files || event.target.value);
    } else {
      event = { target: { value: event } };
    }

    setTimeout(() => {
      validate();
      props.onChange && props.onChange(event);
      props.onChanged && props.onChanged(event);
    }, 0);
  }, [props.onChange, props.onChanged]);

  const validate = () => {
    if(data.hidden || parentHidden) return { valid: true };
    const validation = dataInterface({ data }, value()).validate();
    setIsInvalid(!validation.valid);
    return validation;
  };

  const value = (val) => {
    if (typeof val === "undefined") return fieldControl.current?.value;

    if (!fieldControl.current) return;

    fieldControl.current.value = val;
    setTimeout(() => {
      fieldControl.current.onChange({ target: { value: val } });
    }, 0);
  };

  const readOnly = props.readOnly || data.readOnly;

  const hasLabel = () => !(props.withoutLabel === true);

  const renderInput = (input, className = "") => {
    const invalidClassName = isInvalid ? "border border-red-500 p-2" : "";

    return (
      <FormField
        name={data.name || data.key || data.id || ""}
        dontHaveForm={props.dontHaveForm}
        {...props}
        render={({ field }) => {
          if (!fieldControl.current) {
            field.value = props.value || data.value;
          }

          fieldControl.current = field;
          const oldChange = field.onChange;

          field.onChange = (e) => {
            if(props.handleChange){
              handleInputChange(props.handleChange(e));
            }else{
              handleInputChange(e);
            }
            
            oldChange(e);
          };

          return (
            <FormItem className={cn("flex flex-col mb-2 rounded shadow-sm", invalidClassName, className)}>
              {input(field, data)}
              <FormMessage>
                {field.message || (isInvalid && field.invalidMessage)}
              </FormMessage>
            </FormItem>
          );
        }}
      />
    );
  };

  if(props.render){
    return renderInput(props.render);
  }

  return { renderInput, value, validate, readOnly, hasLabel, data, handleInputChange, fieldControl };
}

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
