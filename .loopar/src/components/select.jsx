import BaseInput from "$base-input";

import React, { useState, useEffect, useRef, useCallback } from "react";
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

export default class Select extends BaseInput {
  #model = null;
  filteredOptions = [];
  titleFields = ["value"];

  constructor(props) {
    super(props);

    this.state = {
      ...this.state,
      rows: props.rows || [],
    };
  }

  get data(){
    return this.props.data;
  }

  render() {
    const data = this.data || { label: "Select", name: "select", value: ""};

    const onSelect = (e) => {
      this.value(e);
    }

    return this.renderInput((field) => {
      
      return (
        <div>
          {!this.props.dontHaveLabel && <FormLabel>{data.label}</FormLabel>}
          <SelectFn
            field={field}
            options={this.state.rows}
            search={(delay) => this.#search(delay)}
            data={data}
            onSelect={onSelect}
            selected={this.getCurrentSelection()}
          />
          {data.description && (
            <FormDescription>{data.description}</FormDescription>
          )}
        </div>
      )
    });
  }

  componentDidMount() {
    super.componentDidMount();
    const value = this.value();
    
    const initialRows = loopar.utils.isJSON(value) ? [JSON.parse(value)] : [{ option: value, title: value}];

    this.setState({rows: this.getPrepareOptions(initialRows)});
  }

  #search(target, delay = true) {
    const q = target?.target?.value || "";
    return new Promise((resolve, reject) => {
      if (this.isLocal) {
        this.filteredOptions = this.optionsSelect
          .filter((row) => {
            return (typeof row == "object" ? `${row.option} ${row.title}` : row)
              .toLowerCase()
              .includes(q);
          })
          .map((row) => {
            return typeof row == "object" ? row : { option: row, title: row };
          });

        resolve(this.renderResult());
      } else {
        this.#model = this.optionsSelect[0];
        if (delay) {
          clearTimeout(this.lastSearch);
          this.lastSearch = setTimeout(() => {
            this.getServerData(q).then(resolve);
          }, 200);
        } else {
          this.getServerData(q).then(resolve);
        }
      }
    });
  }

  get isLocal() {
    return this.optionsSelect.length > 1;
  }

  get model() {
    return this.#model.option || this.#model.name;
  }

  get options() { }

  get optionsSelect() {
    const opts = this.data.options || "";

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

  get searchQuery() {
    return this.inputSearch?.node?.value || "";
  }

  getServerData(q) {
    return new Promise((resolve, reject) => {
      loopar.send({
        action: `/api/${this.model}/search`,
        params: { q },
        success: (r) => {
          this.titleFields = r.titleFields;
          this.filteredOptions = this.getPrepareOptions(r.rows);
          resolve(this.renderResult());
        },
        error: (r) => {
          console.log(r);
        },
        freeze: false,
      });
    });
  }

  renderResult() {
    //return this.filteredOptions;
    this.setState({ rows: this.filteredOptions });
  }

  optionValue(option) {
    const value = (data) => {
      if (data && typeof data == "object") {
        if (Array.isArray(this.titleFields)) {
          const values = this.titleFields.map((item) => data[item]).filter((item) => item);

          return values.reduce((a, b) => {
            return [
              ...a,
              [...a.map((item) => item.toLowerCase())].includes(typeof b == "string" ? b.toLowerCase() : b) ? "" : b,
            ];
          }, []).join(" ");
        } else {
          return data[this.titleFields];
        }
      }
    };

    return option ? (typeof option == "object"
      ? {
        option: option.option || option.name,
        title: value(option), //option[this.titleFields] || option.value || option.option
        formattedValue: this.props.formattedValue
      }
      : {
        option: option || this.value(),
        title: option || this.value(),
        formattedValue: this.props.formattedValue
      }) : {null: null};
  }

  getPrepareOptions(options) {
    return options.map((item) => this.optionValue(item));
  }

  /**
   *
   * #param {string || object} val
   * #param {boolean} trigger_change
   * #returns
   */
  /*val(val = null, { trigger_change = true } = {}) {
    if (val != null) {
      //this.assignedValue = val;
      this.renderValue(trigger_change);
      return this;
    } else {
      return this.data.value;
    }
  }
*/
  /*value(val) {
    if(typeof val != "undefined") {
      super.value(val);
    } else {
      let value = super.value();
      if(loopar.utils.isJSON(value)) {
        value = JSON.parse(value);
        return value?.option || value;
      }else {
        return value;
      }
    }
  }*/

  getCurrentSelection() {
    const rows = this.state.rows || [];
    const optionValue = this.optionValue(this.value());

    const filter = rows.filter((item) => {
      return this.optionValue(item).option === optionValue.option;
    });

    return filter[0] ? this.optionValue(filter[0]) : optionValue;
  }

  get metaFields() {
    const data = super.metaFields[0];

    data.elements.options = {
      element: TEXTAREA,
      data: {
        description:
          "For simple select insert the options separated by enter. For Document Select insert the Document Name",
      },
    };

    return [data];
  }
}