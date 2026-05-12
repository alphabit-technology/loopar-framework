import BaseInput from "@base-input";
import dayjs from "dayjs";
import loopar from "loopar";

import { cn } from "@cn/lib/utils"
import { Button } from "@cn/components/ui/button"
import {
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
} from "@cn/components/ui/form"

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@cn/components/ui/popover"

import DateDemo from "@@date/date-picker";

import { CalendarIcon } from "lucide-react";

const toHHmm = (val) => {
  if (!val) return "00:00";
  if (typeof val === "string" && /^\d{1,2}:\d{2}/.test(val)) return val.slice(0, 5);
  const d = dayjs(val);
  return d.isValid() ? d.format("HH:mm") : "00:00";
};

export default function TimePicker(props) {
  const { renderInput, data={} } = BaseInput(props);

  return renderInput(field => {
    const initialHour = toHHmm(field.value);
    const display = field.value ? loopar.dateUtils.getTime(field.value, "DB") : null;

    const setTimeHandler = (val) => {
      const result = loopar.dateUtils.getTime(val);
      field.onChange({ target: { value: result } });
    };

    return (
      <FormItem className="flex flex-col" >
        <FormLabel>{data.label}</FormLabel>
        <Popover>
          <PopoverTrigger asChild>
            <FormControl>
              <Button
                variant={"outline"}
                className={cn(
                  "w-[240px] pl-3 text-left font-normal",
                  !display && "text-muted-foreground"
                )}
              >
                {display ?? <span>Pick a Time</span>}
                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
              </Button>
            </FormControl>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <DateDemo value={initialHour} handleChange={setTimeHandler}/>
          </PopoverContent>
        </Popover>
        <FormDescription>
          {data.description}
        </FormDescription>
        <FormMessage />
      </FormItem>
    )
  })
}
