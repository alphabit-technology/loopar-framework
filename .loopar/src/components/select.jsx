import BaseInput from "@base-input";
import React, { useState, useEffect, useRef, useCallback} from "react";
import loopar from "loopar";
import { Select } from "./select/base-select";

import {
  FormDescription,
  FormLabel
} from "@/components/ui/form";
import { sep } from "pathe";

export default function MetaSelect(props){
  const [rows, setRows] = useState(props.rows || []);
  const [filteredOptions, setFilteredOptions] = useState([]);
  const titleFields = useRef(["label"]);
  const model = useRef(null);
  const lastSearch = useRef(null);
  
  const { renderInput, value, data } = BaseInput(props);

  useEffect(() => {
    const val = value();
    const initialRows = loopar.utils.isJSON(val) ? [JSON.parse(val)] : [{ value: val, label: val }];
    setRows(getPrepareOptions(initialRows));
  }, []);

  //const [valueDescriptive, setValueDescriptive] = useState(data.value_descriptive);

  const search = useCallback((target, delay = true) => {
    const q = target?.target?.value || "";
    return new Promise((resolve, reject) => {
      if (isLocal()) {
        setFilteredOptions(buildOptions().filter((row) => {
          return (typeof row == "object" ? `${row.value} ${row.label}` : row)
            .toLowerCase()
            .includes(q);
        }).map((row) => {
          return typeof row == "object" ? row : { value: row, label: row };
        }));

        resolve();
      } else {
        model.current = buildOptions()[0];

        if (delay) {
          clearTimeout(lastSearch.current);
          lastSearch.current = setTimeout(() => {
            getServerData(q).then(resolve);
          }, 200);
        } else {
          getServerData(q).then(resolve);
        }
      }
    });
  }, []);

  const isLocal = () => {
    return buildOptions().length > 1;
  };

  const getModel = () => {
    return model.current?.value;
  }

  const getServerData = (q) => {
    return new Promise((resolve) => {
      loopar.send({
        action: `/desk/${getModel()}/search`,
        params: { q },
        success: (r) => {
          titleFields.current = r.title_fields;
          setFilteredOptions(getPrepareOptions(r.rows.map(row => ({ value: row.name, label: row }))));
          resolve();
        },
        error: (r) => {
          console.log(r);
        },
        freeze: false,
      });
    });
  };

  useEffect(() => {
    setRows(filteredOptions);
  }, [filteredOptions]);

  const buildOption = (option) => {
    const separator = (arr, separator) => 
      arr.reduce((acc, el, index) => {
        acc.push(el);
        if (index < arr.length - 1) acc.push(separator);
        return acc;
      }, []);
    
    const buildLabel = (opt) => {
      if (opt) {
        if (typeof opt === "object") {
          if (Array.isArray(titleFields.current)) {
            const values = titleFields.current.map(lbl => opt[lbl]).filter(val => val);
            
            return separator(values, " - ");
          } else {
            return opt[titleFields.current];
          }
        } else {
          return opt;
        }
      }
    };

    return option ? (typeof option === "object"
      ? {
        value: option.value,
        label: buildLabel(option.label || option.value),
        formattedValue: option.formattedValue,
      }
      : {
        value: option || value(),
        label:  option || value(),
      }) : { null: null };
  };

  const buildOptions = () => {
    const opts = data.options || "";

    if (typeof opts == "object") {
      if (Array.isArray(opts)) {
        return opts.map(i => buildOption(i))
      } else {
        return Object.keys(opts).map((key) => ({
          value: key,
          label: opts[key],
        }));
      }
    } else if (typeof opts == "string") {
      return opts.split(/\r?\n/).map((item) => {
        const [value, label] = item.split(":");
        return { value, label: label || value };
      });
    } else if (Array.isArray(opts)) {
      return opts.reduce((acc, item) => {
        acc.push(buildOption(item))
        //acc.push({ value: `${item}`, label: `${item}` })
        
        return acc;
      }, []);
    }
  }

  const getPrepareOptions = (options) => {
    return options.map(option => buildOption(option));
  };

  const currentOption = (option, formattedValue) => {
    if (option) {
      const rowOption = rows.find(r => r.value === option);
      const valueDescriptive =  rowOption?.label || data.value_descriptive;
      return {
        ...(rowOption || buildOption(option)),
        formattedValue: props.formattedValue || valueDescriptive
      };
    }

    return null;
  }

  const [selected, setSelected] = useState(currentOption(props.value || data.value));
  
  useEffect(() => {
    setSelected(currentOption(props.value));
  }, [props.value]);

  useEffect(() => {
    setSelected(currentOption(data.value));
  }, [data.value]);

  return renderInput((field) => (
    <>
      {!props.dontHaveLabel && <FormLabel>{data.label}</FormLabel>}
      <Select
        field={field}
        options={rows}
        search={(delay) => search(delay)}
        data={data}
        onSelect={field.onChange}
        selected={selected}
      />
      {(data.description && props.simpleInput != true) && (
        <FormDescription>{data.description}</FormDescription>
      )}
    </>
  ));
};

MetaSelect.metaFields = () => {
  return [
  ...BaseInput.metaFields(),
    [
      {
        group: "form",
        elements: {
          options: {
            element: TEXTAREA,
            data: {
              description:
                "For simple select insert the options separated by enter. For Entity Select, insert the Entity Name",
            },
          },
        },
      },
    ]
  ];
}