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

import DateDemo from "@date/date-picker";

import { CalendarIcon } from "lucide-react";

export default function TimePicker(props) {
  const { renderInput, data={}, value } = BaseInput(props);

  return renderInput(field => {
    const setTimeHandler = (val) => {
      value(loopar.dateUtils.getTime(val));
    };

    const initialHour = dayjs(field.value).format("HH:mm");

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
                  !field.value && "text-muted-foreground"
                )}
              >
                {field.value ? loopar.dateUtils.getTime(field.value, "DB") : <span>Pick a Time</span>}
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
