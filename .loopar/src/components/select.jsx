import BaseInput from "@base-input";
import React, { useState, useEffect, useRef, useCallback} from "react";
import loopar from "loopar";
import { Select } from "./select/base-select";

import {
  FormDescription,
  FormLabel
} from "@/components/ui/form";

export default function MetaSelect(props){
  const [rows, setRows] = useState(props.rows || []);
  const [filteredOptions, setFilteredOptions] = useState([]);
  const titleFields = useRef(["value"]);
  const model = useRef(null);
  const lastSearch = useRef(null);
  
  const { renderInput, value, data } = BaseInput(props);

  useEffect(() => {
    const val = value();
    const initialRows = loopar.utils.isJSON(val) ? [JSON.parse(val)] : [{ value: val, label: val }];
    setRows(getPrepareOptions(initialRows));
  }, []);

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
          titleFields.current = r.titleFields;
          setFilteredOptions(getPrepareOptions(r.rows.map((row) => ({ value: row.name, label: row }))));
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
    const buildLabel = (opt) => {
      if (opt && typeof opt === "object") {
        if (Array.isArray(titleFields.current)) {
          const values = titleFields.current.map((item) => opt[item]).filter((item) => item);

          return values.reduce((a, b) => {
            return [
              ...a,
              [...a.map((item) => item.toLowerCase())].includes(typeof b === "string" ? b.toLowerCase() : b) ? "" : b,
            ];
          }, [])
        } else {
          return opt[titleFields.current];
        }
      }
    };

    return option ? (typeof option === "object"
      ? {
        value: option.value,
        label: buildLabel(option),
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
        acc.push({ value: `${item}`, label: `${item}` })
        
        return acc;
      }, []);
    }
  }

  const getPrepareOptions = (options) => {
    return options.map(option => buildOption(option));
  };

  const currentOption = (option) => {
    const current = buildOption(option);

    if (current) {
      return {
        ...current,
        formattedValue: props.formattedValue,
      };
    }
    return null;
  }

  const [selected, setSelected] = useState(currentOption(data.value));
  
  useEffect(() => {
    setSelected(currentOption(value() || props.value));
  }, [rows, data.value]);

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