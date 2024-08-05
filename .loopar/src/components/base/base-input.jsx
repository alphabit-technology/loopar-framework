import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { dataInterface } from "$global/element-definition";
import { FormItem, FormMessage } from "@/components/ui/form";
import { FormField } from "@form-field";
import { cn } from "@/lib/utils";
import elementManage from "$tools/element-manage";
import loopar from "$loopar";
//import { useDesigner } from "@context/@/designer-context";

const BaseInput = (props) => {
  const [isInvalid, setIsInvalid] = useState(false);
  const fieldControl = useRef(null);
  const names = useMemo(() => elementManage.elementName(props.element), [props.element]);
  //const {designerMode} = useDesigner();

  const getData = () => {
    //const names ??= elementManage.elementName(this.props.element);
    if(props.element) {
      const data = props.data || {};

      data.id ??= names.id;
      data.name ??= names.name;
      data.label ??= loopar.utils.Capitalize(data.name.replaceAll("_", " "));
      return data;
    } else {
      return props.data || {};
    }
  }

  const [data, setData] = useState(getData());
  const [val, setVal] = useState(data.value);

  /*useEffect(() => {
    setData(getData());
  }, [props.data]);*/

  useEffect(() => {
    data.value = val;
    setData(data);
  }, [val]);

  //const data = getData();

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
  }, [props]);

  /*useEffect(() => {
    if (props.onChange && !props.prevProps?.onChange) {
      handleInputChange(value());
    }
  }, [props.onChange, handleInputChange]);*/

  /*useEffect(() => {
    setNames(elementManage.elementName(props.element));
  }, [props.element]);*/

  const validate = () => {
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

  /*useEffect(() => {
    fieldControl.current?.onChange({ target: { value: data.value } }  )
  }, [fieldControl.current]);*/

  /*useEffect(() => {
    fieldControl.current?.onChange({ target: { value: data.value } }  )
    setData(getData());
  }, [fieldControl?.current?.value]);*/

  const renderInput = (input, className = "") => {
    //const currentData = data;
    const invalidClassName = isInvalid ? "border border-red-500 p-2" : "";
    
    return (
      <FormField
        name={data.name}
        dontHaveForm={props.dontHaveForm}
        render={({ field }) => {
          if (!fieldControl.current) field.value = data.value;
          if(field.value !== val){
            //setVal(field.value);
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
            <FormItem className={cn("flex flex-col mb-2 rounded-lg shadow-sm", invalidClassName, className)}>
              {input(field, data)}
              <FormMessage>
                {field.message || (isInvalid && field.invalidMessage)}
              </FormMessage>
            </FormItem>
          );
        }}
        onChange={handleInputChange}
        data={data}
      />
    );
  };

  if(props.render){
    return renderInput(props.render);
  }

  return { renderInput, value, validate, readOnly, hasLabel, data, handleInputChange, fieldControl };
};

BaseInput.metaFields = () =>{
  return [
    {
      group: "form",
      elements: {
        //tag: {element: INPUT},
        label: { element: INPUT },
        name: { element: INPUT },
        description: { element: TEXTAREA },
        placeholder: { element: TEXTAREA },
        format: {
          element: SELECT,
          data: {
            options: [
              { option: "data", value: "Data" },
              { option: "text", value: "Text" },
              { option: "email", value: "Email" },
              { option: "decimal", value: "Decimal" },
              { option: "percent", value: "Percent" },
              { option: "currency", value: "Currency" },
              { option: "int", value: "Int" },
              { option: "long_int", value: "Long Int" },
              { option: "password", value: "Password" },
              { option: "read_only", value: "Read Only" },
            ],
            selected: "data",
          },
        },
        type: {
          element: SELECT,
          data: {
            options: [
              { option: "default", value: "Default" },
              { option: "primary", value: "Primary" },
              { option: "success", value: "Success" },
              { option: "info", value: "Info" },
              { option: "link", value: "link" },
            ],
            selected: "default",
            description: "Valid for not preformated inputs",
          },
        },
        //action: { element: INPUT },

        not_validate_type: { element: SWITCH },
        required: { element: SWITCH },
        unique: { element: SWITCH },
        set_only_time: { element: SWITCH },
        readonly: { element: SWITCH },
        in_list_view: { element: SWITCH },
        searchable: { element: SWITCH },
      },
    },
  ];
}

BaseInput.donHaveMetaFields = () => {
  return ["text"];
}

export default BaseInput;
