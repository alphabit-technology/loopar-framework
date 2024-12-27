import BaseInput from "@base-input";
import React, { useState, useEffect, useRef, useCallback} from "react";
import loopar from "loopar";
import { Select } from "./select/base-select";

import {
  FormDescription,
  FormLabel
} from "@/components/ui/form"


export default function MetaSelect(props){
  const [rows, setRows] = useState(props.rows || []);
  const [filteredOptions, setFilteredOptions] = useState([]);
  const titleFields = useRef(["value"]);
  const model = useRef(null);
  const lastSearch = useRef(null);
  const [selected, setSelected] = useState(null);
  const { renderInput, value, data } = BaseInput(props);

  useEffect(() => {
    const val = value();
    const initialRows = loopar.utils.isJSON(val) ? [JSON.parse(val)] : [{ option: val, title: val }];
    setRows(getPrepareOptions(initialRows));
  }, []);

  const optionsSelect = () => {
    const opts = data.options || "";

    if (typeof opts == "object") {
      if (Array.isArray(opts)) {
        return opts;
      } else {
        return Object.keys(opts).map((key) => ({
          option: key,
          title: opts[key],
        }));
      }
    } else if (typeof opts == "string") {
      return opts.split(/\r?\n/).map((item) => {
        const [option, title] = item.split(":");
        return { option, title: option || title };
      });
    }
  }

  const search = useCallback((target, delay = true) => {
    const q = target?.target?.value || "";
    return new Promise((resolve, reject) => {
      if (isLocal()) {
        setFilteredOptions(optionsSelect()
          .filter((row) => {
            return (typeof row == "object" ? `${row.option} ${row.title}` : row)
              .toLowerCase()
              .includes(q);
          })
          .map((row) => {
            return typeof row == "object" ? row : { option: row, title: row };
          }));

        resolve();
      } else {
        model.current = optionsSelect()[0];
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
    return optionsSelect().length > 1;
  };

  const getModel = () => {
    return model.current?.option || model.current?.name;
  }

  const getServerData = (q) => {
    return new Promise((resolve) => {
      loopar.send({
        action: `/desk/${getModel()}/search`,
        params: { q },
        success: (r) => {
          titleFields.current = r.titleFields;
          setFilteredOptions(getPrepareOptions(r.rows));
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

  const optionValue = (option) => {
    const getValue = (data) => {
      if (data && typeof data === "object") {
        if (Array.isArray(titleFields.current)) {
          const values = titleFields.current.map((item) => data[item]).filter((item) => item);

          return values.reduce((a, b) => {
            return [
              ...a,
              [...a.map((item) => item.toLowerCase())].includes(typeof b === "string" ? b.toLowerCase() : b) ? "" : b,
            ];
          }, []).join(" ");
        } else {
          return data[titleFields.current];
        }
      }
    };

    return option ? (typeof option === "object"
      ? {
        option: option.option || option.name,
        title: getValue(option),
        formattedValue: props.formattedValue
      }
      : {
        option: option || value(),
        title: option || value(),
        formattedValue: props.formattedValue
      }) : { null: null };
  };

  const getPrepareOptions = (options) => {
    return options.map((item) => optionValue(item));
  };

  useEffect(() => {
    const currentRows = rows || [];
    const currentOptionValue = optionValue(value() || data.value);

    const filter = currentRows.filter((item) => {
      return optionValue(item).option == currentOptionValue.option;
    });

    setSelected(filter[0] ? optionValue(filter[0]) : currentOptionValue);
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

MetaSelect.metaFields = () =>  {
  const data = BaseInput.metaFields()[0];

  data.elements.options = {
    element: TEXTAREA,
    data: {
      description:
        "For simple select insert the options separated by enter. For Entity Select, insert the Entity Name",
    },
  };

  return [data];
}