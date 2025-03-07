import React, { useState, useEffect, useRef, useCallback} from "react";
import { CaretSortIcon, CheckIcon, Cross2Icon } from "@radix-ui/react-icons";
import { cn } from "@cn/lib/utils";
import { Button } from "@cn/components/ui/button";
import {invalidClass} from "../input/index.js";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@cn/components/ui/command"

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@cn/components/ui/popover"

export function Select({ search, data, onSelect, options = [], selected={}, field }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(false);
  const containerRef = useRef(null);

  //options = options.filter(option => option && option.value);

  const PAGE_SIZE = 20;
  //const paginatedRows = {};
  
  const getPaginatedRows = () => {
    const paginatedRows = {};
    for (let i = 0; i < options.length; i += PAGE_SIZE) {
      const pageNumber = i / PAGE_SIZE + 1;
      paginatedRows[pageNumber] = options.slice(i, i + PAGE_SIZE);
    }

    return paginatedRows;
  }

  const [currentPage, setCurrentPage] = useState(1);
  const [paginatedRows, setPaginateRows] = useState(getPaginatedRows());
  const [visibleRows, setVisibleRows] = useState(paginatedRows[1] || []);

  const loadMoreRows = useCallback(() => {
    setCurrentPage(prevPage => prevPage + 1);
  }, []);

  useEffect(() => {
    setPaginateRows(getPaginatedRows());
  }, [options]);

  useEffect(() => {
    if (paginatedRows[currentPage] && open) {
      setVisibleRows(prevRows => {
        const newRows = [...prevRows, ...paginatedRows[currentPage]];
        return [...new Map(newRows.map(item => [item.value, item])).values()];
      });
    }
  }, [currentPage, selected, open, paginatedRows]);

  // useEffect(() => {
  //   if (selected && selected.value) {
  //     if (!visibleRows.some(option => option.value === selected.value)) {
  //       setVisibleRows(prevRows => [selected, ...prevRows]);
  //     }
  //   }
  // }, [selected]);
  
  useEffect(() => {
    if (!containerRef.current) return;
    
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

  const current = selected && (typeof selected == "object" && selected.value) ? selected : {};

  let renderOption = current.value ?
    current.formattedValue || current.label || current.value :
    <span className="truncate text-slate-600/70">
      Select {data.label}
    </span>;

  const RenderOption = () => {
    if (typeof renderOption == "object" && renderOption.$$typeof !== Symbol.for("react.transitional.element")) {
      return <>{renderOption}</>
    } else {
      return renderOption
    }
  }

  return (
    <Popover open={open} onOpenChange={openHandler} className="pb-4">
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className={cn(
            "w-full justify-between pr-1",// max-w-sm
            !current.value && "text-muted-foreground",
            field.isInvalid && invalidClass.border
          )}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            openHandler(!open);
          }}
          onMouseEnter={setActive}
          onMouseLeave={() => setActive(false)}
        >
          {RenderOption()}
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
              if (!option) return null;
              const value = option.formattedValue || option.label || option.value;

              return (
              <CommandItem
                value={option.value}
                key={option.value}
                onSelect={() => setValueHandler(option.value)}
                data-disabled="false"
                className={cn(
                  "flex items-center",
                  option.value === current.value && "bg-secondary text-white"
                )}
              >
                  {value}
                <CheckIcon
                  className={cn(
                    "ml-auto h-4 w-4",
                    option.value === current.value
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