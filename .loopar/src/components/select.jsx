import BaseInput from "$base-input";

import React, { useState, useEffect, useRef, useCallback, useContext} from "react";
import { CaretSortIcon, CheckIcon, Cross2Icon } from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import loopar from "$loopar";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

import {
  FormDescription,
  FormLabel
} from "@/components/ui/form"


function SelectFn({ search, data, onSelect, options = [], selected={} }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(false);
  const containerRef = useRef(null);

  options = options.filter(option => option && option.option);

  const PAGE_SIZE = 20;
  const paginatedRows = {};
  
  for (let i = 0; i < options.length; i += PAGE_SIZE) {
    const pageNumber = i / PAGE_SIZE + 1;
    paginatedRows[pageNumber] = options.slice(i, i + PAGE_SIZE);
  }

  const [currentPage, setCurrentPage] = useState(1);
  const [visibleRows, setVisibleRows] = useState(paginatedRows[1] || []);

  const loadMoreRows = useCallback(() => {
    setCurrentPage(prevPage => prevPage + 1);
  }, []);

  useEffect(() => {
    if (paginatedRows[currentPage]) {
      setVisibleRows(prevRows => {
        const newRows = [...prevRows, ...paginatedRows[currentPage]];
        return [...new Map(newRows.map(item => [item.option, item])).values()];
      });
    }
  }, [currentPage, selected]);

  useEffect(() => {
    if(!containerRef.current) return;
    const handleScroll = () => {
      if (!containerRef.current) return;
      const container = containerRef.current;
      if (container.scrollHeight - container.scrollTop === container.clientHeight) {
        loadMoreRows();
      }
    };

    const container = containerRef.current;
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [loadMoreRows, containerRef.current]);

  useEffect(() => {
    if (selected && selected.option) {
      if (!visibleRows.some(option => option.option === selected.option)) {
        setVisibleRows(prevRows => [selected, ...prevRows]);
      }
    }
  }, [selected]);

  const openHandler = useCallback((e) => {
    setOpen(e);
    search(null, false).then(result => {
      // handle result if needed
    });
  }, [search]);

  const searchHandler = useCallback((e) => {
    search(e, true);
  }, [search]);

  const setValueHandler = useCallback((e) => {
    openHandler(false);
    onSelect(e);
  }, [onSelect]);

  const current = selected && typeof selected === "object" ? selected : { option: selected };

  return (
    <Popover open={open} onOpenChange={openHandler} className="pb-4">
      <PopoverTrigger asChild >
        <Button
          variant="outline"
          role="combobox"
          className={cn(
            "w-full justify-between pr-1",// max-w-sm
            !current.option && "text-muted-foreground"
          )}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            openHandler(!open);
          }}
          onMouseEnter={setActive}
          onMouseLeave={() => setActive(false)}
        >
          {current.option ? (current.formattedValue || current.title || current.option) : (
            <span className="truncate text-slate-600/70">
              Select {data.label}
            </span>
            )}
          <div className="flex flex-row items-center justify-between">
            <Cross2Icon
              className={`h-5 w-5 shrink-0 ${active ? "opacity-50" : "opacity-0"}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setValueHandler(null);
                //searchHandler(null);
              }}
            />
            <CaretSortIcon className="ml-1 h-5 w-5 shrink-0 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full min-w-[var(--radix-popover-trigger-width)]" align="start">
        <Command>
          <CommandInput
            placeholder={`Search ${data.label}...`}
            className="h-9"
            onKeyUp={searchHandler}
          />
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup
            className="max-h-[250px] overflow-auto"
            ref={containerRef}
          >
            {visibleRows.map((option) => { 
              if(!option) return null;
              const value = option.title || option.value || option.option;

              return (
              <CommandItem
                value={option.option}
                key={option.option}
                onSelect={() => setValueHandler(option.option)}
                className={cn(
                  "flex items-center",
                  option.option === current.option && "bg-secondary text-white"
                )}
              >
                {value}
                <CheckIcon
                  className={cn(
                    "ml-auto h-4 w-4",
                    option.option === current.option
                      ? "opacity-100"
                      : "opacity-0"
                  )}
                />
              </CommandItem>
            )})}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

const Select = (props) => {
  const [rows, setRows] = useState(props.rows || []);
  const [filteredOptions, setFilteredOptions] = useState([]);
  const titleFields = useRef(["value"]);
  const model = useRef(null);
  const lastSearch = useRef(null);

  const { renderInput, value, validate } = BaseInput(props);

  const data = props.data || { label: "Select", name: "select", value: "" };

  /*const handleInputChange = useCallback((event) => {
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
  }, [props]);*/

  useEffect(() => {
    const value = data.value;
    const initialRows = loopar.utils.isJSON(value) ? [JSON.parse(value)] : [{ option: value, title: value }];
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

    /*return typeof opts == 'object' && Array.isArray(opts) ? opts :
         opts.split(/\r?\n/).map(item => ({option: item, value: item}));*/
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
        action: `/api/${getModel()}/search`,
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

  const getCurrentSelection = () => {
    const currentRows = rows || [];
    const currentOptionValue = optionValue(value());

    const filter = currentRows.filter((item) => {
      return optionValue(item).option === currentOptionValue.option;
    });

    return filter[0] ? optionValue(filter[0]) : currentOptionValue;
  };

   return renderInput((field) => (
    <div>
      {!props.dontHaveLabel && <FormLabel>{data.label}</FormLabel>}
      <SelectFn
        field={field}
        options={rows}
        search={(delay) => search(delay)}
        data={data}
        onSelect={(e) => value(e)}
        selected={getCurrentSelection()}
      />
      {data.description && (
        <FormDescription>{data.description}</FormDescription>
      )}
    </div>
  ));

  //return renderInput(customRenderInput);
};

Select.metaFields = () =>  {
  const data = BaseInput.metaFields()[0];

  data.elements.options = {
    element: TEXTAREA,
    data: {
      description:
        "For simple select insert the options separated by enter. For Document Select insert the Document Name",
    },
  };

  return [data];
}

export default Select;