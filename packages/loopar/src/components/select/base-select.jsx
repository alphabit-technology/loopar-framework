import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { CaretSortIcon, CheckIcon, Cross2Icon } from "@radix-ui/react-icons";
import { cn } from "@cn/lib/utils";
import { Button } from "@cn/components/ui/button";
import { invalidClass } from "../input/index.js";
import { Loader2 } from "lucide-react";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@cn/components/ui/command";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@cn/components/ui/popover";

const PAGE_SIZE = 20;

export function Select({ 
  search, 
  data, 
  onSelect, 
  options = [], 
  selected = {}, 
  field,
  isLoading = false,
  error = null 
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [visibleRows, setVisibleRows] = useState([]);
  
  const containerRef = useRef(null);
  const observerRef = useRef(null);
  const sentinelRef = useRef(null);

  const paginatedRows = useMemo(() => {
    const pages = {};
    for (let i = 0; i < options.length; i += PAGE_SIZE) {
      const pageNumber = Math.floor(i / PAGE_SIZE) + 1;
      pages[pageNumber] = options.slice(i, i + PAGE_SIZE);
    }
    return pages;
  }, [options]);

  const totalPages = useMemo(() => {
    return Math.ceil(options.length / PAGE_SIZE);
  }, [options.length]);

  const loadMoreRows = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
    setVisibleRows(paginatedRows[1] || []);
  }, [options, paginatedRows]);

  useEffect(() => {
    if (!paginatedRows[currentPage] || !open) return;
    
    setVisibleRows(prevRows => {
      if (currentPage === 1) {
        return paginatedRows[1] || [];
      }
      
      const newRows = [...prevRows, ...paginatedRows[currentPage]];
      const uniqueRows = Array.from(
        new Map(newRows.map(item => [item?.value, item])).values()
      ).filter(Boolean);
      
      return uniqueRows;
    });
  }, [currentPage, open, paginatedRows]);

  useEffect(() => {
    if (!open || !sentinelRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && currentPage < totalPages) {
          loadMoreRows();
        }
      },
      {
        root: containerRef.current,
        rootMargin: '50px',
        threshold: 0.1
      }
    );

    observer.observe(sentinelRef.current);
    observerRef.current = observer;

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [open, loadMoreRows, currentPage, totalPages]);

  const openHandler = useCallback((shouldOpen) => {
    setOpen(shouldOpen);
    
    if (shouldOpen) {
      setCurrentPage(1);
      search(null, false).catch(err => {
        console.error("Search error:", err);
      });
    }
  }, [search]);

  const searchHandler = useCallback((e) => {
    setCurrentPage(1);
    search(e, true).catch(err => {
      console.error("Search error:", err);
    });
  }, [search]);

  const setValueHandler = useCallback((value) => {
    openHandler(false);
    onSelect(value);
  }, [onSelect, openHandler]);

  const clearHandler = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setValueHandler(null);
  }, [setValueHandler]);

  const current = useMemo(() => {
    return selected && typeof selected === "object" && selected.value 
      ? selected 
      : {};
  }, [selected]);

  const renderOption = useMemo(() => {
    if (current.value) {
      return current.formattedValue || current.label || current.value;
    }
    return (
      <span className="truncate text-slate-600/70">
        Select {data.label}
      </span>
    );
  }, [current, data.label]);

  const RenderOption = () => {
    if (
      typeof renderOption === "object" && 
      renderOption?.$$typeof !== Symbol.for("react.transitional.element")
    ) {
      return <>{renderOption}</>;
    }
    return renderOption;
  };

  const renderButton = (extraProps = {}) => (
    <Button
      variant="outline"
      role="combobox"
      aria-expanded={open}
      aria-label={`Select ${data.label}`}
      className={cn(
        "w-full justify-between pr-1",
        !current.value && "text-muted-foreground",
        field?.isInvalid && invalidClass.border
      )}
      {...extraProps}
    >
      <span className="truncate flex-1 text-left">
        {RenderOption()}
      </span>
      <div className="flex flex-row items-center justify-between ml-2">
        {!data.disabled && current.value && (
          <Cross2Icon
            className={cn(
              "h-5 w-5 shrink-0 transition-opacity",
              active ? "opacity-50" : "opacity-0"
            )}
            onClick={clearHandler}
          />
        )}
        <CaretSortIcon className="ml-1 h-5 w-5 shrink-0 opacity-50" />
      </div>
    </Button>
  );

  if (data.disabled) {
    return renderButton({ disabled: true });
  }

  return (
    <Popover open={open} onOpenChange={openHandler}>
      <PopoverTrigger asChild>
        {renderButton({
          onClick: (e) => {
            e.preventDefault();
            e.stopPropagation();
            openHandler(!open);
          },
          onMouseEnter: () => setActive(true),
          onMouseLeave: () => setActive(false),
        })}
      </PopoverTrigger>
      <PopoverContent 
        className="w-full min-w-[var(--radix-popover-trigger-width)] p-0" 
        align="start"
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={`Search ${data.label}...`}
            className="h-9"
            onKeyUp={searchHandler}
          />
          
          {isLoading && (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">
                Loading...
              </span>
            </div>
          )}
          
          {error && (
            <div className="p-4 text-sm text-destructive">
              Error: {error}
            </div>
          )}
          
          {!isLoading && !error && visibleRows.length === 0 && (
            <CommandEmpty>No results found.</CommandEmpty>
          )}
          
          {!isLoading && !error && visibleRows.length > 0 && (
            <CommandGroup
              className="max-h-[250px] overflow-auto"
              ref={containerRef}
            >
              {visibleRows.map((option) => {
                if (!option) return null;
                
                const value = option.formattedValue || option.label || option.value;
                const isSelected = option.value === current.value;

                return (
                  <CommandItem
                    value={option.value}
                    key={option.value}
                    onSelect={() => setValueHandler(option.value)}
                    className={cn(
                      "flex items-center cursor-pointer",
                      isSelected && "bg-accent"
                    )}
                  >
                    <span className="flex-1 truncate">{value}</span>
                    <CheckIcon
                      className={cn(
                        "ml-auto h-4 w-4 shrink-0",
                        isSelected ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                );
              })}
              
              {currentPage < totalPages && (
                <div 
                  ref={sentinelRef} 
                  className="h-1 w-full"
                  aria-hidden="true"
                />
              )}
              
              {currentPage < totalPages && (
                <div className="flex items-center justify-center p-2">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              )}
            </CommandGroup>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
}