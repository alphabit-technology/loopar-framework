import BaseInput from "@base-input";
import {FormLabel} from "./input/index.js";
import { useState, useEffect, useRef, useCallback} from "react";
import loopar from "loopar";
import { Select } from "./select/base-select";

import {
  FormDescription
} from "@cn/components/ui/form";

export default function MetaSelect(props){
  const [rows, setRows] = useState(props.rows || []);
  const [filteredOptions, setFilteredOptions] = useState([]);
  const titleFields = useRef(["label"]);
  const model = useRef(null);
  const lastSearch = useRef(null);
  const fieldRef = useRef(null);
  
  const { renderInput, data } = BaseInput(props);

  useEffect(() => {
    const val = fieldRef.current?.value || "";
    const initialRows = loopar.utils.isJSON(val) ? [JSON.parse(val)] : [{ value: val, label: val }];
    setRows(getPrepareOptions(initialRows));
  }, []);

  const search = useCallback((target, delay = true) => {
    if(data.disabled) return;

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
    if(data.disabled) return;
    
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
        value: option || fieldRef.current.value,
        label:  option || fieldRef.current.value,
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
        return acc;
      }, []);
    }
  }

  const getPrepareOptions = (options) => {
    return options.map(option => buildOption(option));
  };

  const currentOption = (option) => {
    if (option) {
      const rowOption = rows.find(r => r.value === option);
      const valueDescriptive =  rowOption?.label || data.value_descriptive;
      return {
        ...(rowOption || buildOption(option)),
        formattedValue: props.formattedValue || valueDescriptive
      };
    }

    return null;
  };

  return renderInput((field) => {
    fieldRef.current = field;
    return (
      <>
        <FormLabel {...props} field={field} />
        <Select
          field={field}
          options={rows}
          search={(delay) => search(delay)}
          data={data}
          onSelect={field.onChange}
          selected={currentOption(field.value)}
        />
        {(data.description && props.simpleInput != true) && (
          <FormDescription>{data.description}</FormDescription>
        )}
      </>
    )
  });
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