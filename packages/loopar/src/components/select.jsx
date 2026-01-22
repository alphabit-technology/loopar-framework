import BaseInput from "@base-input";
import { FormLabel } from "./input/index.js";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import loopar from "loopar";
import { Select } from "./select/base-select.jsx";
import { FormDescription } from "@cn/components/ui/form";

export default function MetaSelect(props) {
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const titleFields = useRef(["label"]);
  const model = useRef(null);
  const abortControllerRef = useRef(null);
  const fieldRef = useRef(null);
  const paginationRef = useRef({ page: 1, limit: 20, total: 0, pages: 0 });
  const currentQueryRef = useRef("");
  
  const { renderInput, data } = BaseInput(props);

  const isLocal = useMemo(() => {
    const options = data.options;
    return !options || typeof options === "object" || options.includes("\n");
  }, [data.options]);

  const buildLabel = useCallback((opt) => {
    if (!opt) return null;
    
    if (typeof opt === "object") {
      if (Array.isArray(titleFields.current)) {
        const values = titleFields.current
          .map(lbl => opt[lbl])
          .filter(val => val);
        
        return values.reduce((acc, el, index) => {
          acc.push(el);
          if (index < values.length - 1) acc.push(" - ");
          return acc;
        }, []);
      } else {
        return opt[titleFields.current];
      }
    }
    
    return opt;
  }, []);

  const buildOption = useCallback((option) => {
    if (!option) return { null: null };
    
    if (typeof option === "object") {
      return {
        value: option.value,
        label: buildLabel(option.label || option.value),
        formattedValue: option.formattedValue,
      };
    }
    
    return {
      value: option || fieldRef.current?.value,
      label: option || fieldRef.current?.value,
    };
  }, [buildLabel]);

  const builtOptions = useMemo(() => {
    const opts = data.options || "";

    if (typeof opts === "object") {
      if (Array.isArray(opts)) {
        return opts.map(i => buildOption(i));
      } else {
        return Object.keys(opts).map((key) => ({
          value: key,
          label: opts[key],
        }));
      }
    } else if (typeof opts === "string") {
      return opts.split(/\r?\n/).map((item) => {
        const [value, label] = item.split(":");
        return { value, label: label || value };
      });
    } else if (Array.isArray(opts)) {
      return opts.map(item => buildOption(item));
    }
    
    return [];
  }, [data.options, buildOption]);

  const getPrepareOptions = useCallback((options) => {
    return options.map(option => buildOption(option));
  }, [buildOption]);

  useEffect(() => {
    if (!fieldRef.current) return;
    
    const val = fieldRef.current.value || "";
    const initialRows = loopar.utils.isJSON(val) 
      ? [JSON.parse(val)] 
      : [{ value: val, label: val }];
    
    setRows(getPrepareOptions(initialRows));
  }, [getPrepareOptions]);

  const getModel = useCallback(() => {
    return model.current?.value;
  }, []);

  const getServerData = useCallback((q, page = 1, append = false) => {
    if (data.disabled) return Promise.resolve();
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    
    setIsLoading(true);
    setError(null);
    
    return new Promise((resolve, reject) => {
      loopar.send({
        action: `/desk/${getModel()}/search`,
        params: { 
          q,
          page,
          limit: paginationRef.current.limit
        },
        signal: abortControllerRef.current.signal,
        success: (r) => {
          titleFields.current = r.title_fields;
          
          if (r.pagination) {
            paginationRef.current = {
              ...paginationRef.current,
              ...r.pagination,
              page
            };
          }
          
          const preparedRows = getPrepareOptions(
            r.rows.map(row => ({
              value: row.name, 
              formattedValue: row.formattedValue,
              label: row 
            }))
          );
          
          setRows(prevRows => {
            if (append && page > 1) {
              const newRows = [...prevRows, ...preparedRows];
              return Array.from(
                new Map(newRows.map(item => [item?.value, item])).values()
              ).filter(Boolean);
            }
            return preparedRows;
          });
          
          setIsLoading(false);
          resolve(preparedRows);
        },
        error: (err) => {
          if (err.name !== 'AbortError') {
            console.error("Error fetching data:", err);
            setError(err.message || "Error loading data");
            setIsLoading(false);
            reject(err);
          }
        },
        freeze: false,
      });
    });
  }, [data.disabled, getModel, getPrepareOptions]);

  const searchTimeoutRef = useRef(null);

  const search = useCallback((target, delay = true) => {
    if (data.disabled) return Promise.resolve();

    const q = target?.target?.value || "";
    currentQueryRef.current = q;
    paginationRef.current.page = 1;
  
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    return new Promise((resolve) => {
      if (isLocal) {
        const filtered = builtOptions.filter((row) => {
          const searchText = typeof row === "object" 
            ? `${row.value} ${row.label}`.toLowerCase()
            : String(row).toLowerCase();
          return searchText.includes(q.toLowerCase());
        }).map((row) => {
          return typeof row === "object" 
            ? row 
            : { value: row, label: row };
        });
        
        setRows(filtered);
        resolve(filtered);
      } else {
        model.current = builtOptions[0];
        
        if (delay) {
          searchTimeoutRef.current = setTimeout(() => {
            getServerData(q, 1, false).then(resolve).catch(() => resolve([]));
          }, 200);
        } else {
          getServerData(q, 1, false).then(resolve).catch(() => resolve([]));
        }
      }
    });
  }, [data.disabled, isLocal, builtOptions, getServerData]);

  const loadMore = useCallback(() => {
    if (isLocal || isLoading) return Promise.resolve();
    
    const { page, pages } = paginationRef.current;
    
    if (page >= pages) {
      return Promise.resolve();
    }
    
    const nextPage = page + 1;
    return getServerData(currentQueryRef.current, nextPage, true);
  }, [isLocal, isLoading, getServerData]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const currentOption = useCallback((option) => {
    if (!option) return null;
    
    const rowOption = rows.find(r => r.value === option);
    const valueDescriptive = rowOption?.label || data.value_descriptive;
    
    return {
      ...(rowOption || buildOption(option)),
      formattedValue: props.formattedValue || valueDescriptive
    };
  }, [rows, data.value_descriptive, props.formattedValue, buildOption]);

  const pagination = useMemo(() => ({
    ...paginationRef.current,
    hasMore: !isLocal && paginationRef.current.page < paginationRef.current.pages
  }), [isLocal, rows]);

  return renderInput((field) => {
    fieldRef.current = field;
    
    return (
      <>
        <FormLabel {...props} field={field} />
        <Select
          field={field}
          options={rows}
          search={search}
          loadMore={loadMore}
          pagination={pagination}
          data={data}
          onSelect={field.onChange}
          selected={currentOption(field.value)}
          isLoading={isLoading}
          error={error}
          isLocal={isLocal}
          renderOption={props.renderOption}
        />
        {(data.description && props.simpleInput !== true) && (
          <FormDescription>{data.description}</FormDescription>
        )}
      </>
    );
  });
}

MetaSelect.droppable=false;

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
};