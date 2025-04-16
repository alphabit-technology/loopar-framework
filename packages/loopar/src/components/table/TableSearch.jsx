import {MetaComponent} from "@meta-component";
import { FormWrapper } from "@context/form-provider";
import { useTable } from "./TableContext"
import { useMemo, useRef, useCallback } from "react";

export function TableSearch(props){
  const {meta, baseColumns} = useTable();
  const formRef = useRef(null);
  const debounceTimer = useRef(null);

  const saveData = useCallback((timer) => {
    const values = formRef.current.getValues();
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    
    debounceTimer.current = setTimeout(() => {
      props.onChange(values);
    }, timer);
  }, []);
  
  const searchFields = useMemo(() => {
    return baseColumns().filter(col => fieldIsWritable(col) &&
        [INPUT, TEXTAREA, SELECT, CHECKBOX, SWITCH].includes(col.element) &&
        (col.data.searchable || col.data.name === "name")
    );
  }, [baseColumns]);

  const searchData = meta && meta.q && typeof meta.q == "object" ? meta.q : {};

  return (
    <FormWrapper __DOCUMENT__={searchData} className="w-full" formRef={formRef}>
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 items-center">
        {searchFields.length > 0 && searchFields.map((c) => {
          if (c.data.name !== "selector_all") {
            if (fieldIsWritable(c)) {
              const data = {
                ...{
                  simpleInput: false,
                  withoutLabel: true,
                },
                ...c.data,
                required: 0,
                disabled: false,
              };

              data.name = c.data.name;
              data.label = c.data.label;
              data.size = "sm";
              
              return (
                <MetaComponent
                  component={c.element}
                  render={Component => (
                    <Component
                      data={{
                        ...data,
                      }}
                      dontHaveLabel={true}
                      onChange={(e) => {
                        saveData([SELECT, SWITCH, CHECKBOX].includes(c.element) || e.target.value == "" ? 0: 300)
                      }}
                    />
                  )}
                />
              )
            }
          }
        })}
      </div>
    </FormWrapper>
  );
}