import BaseInput from "$base-input";
import dayjs from "dayjs";
import { format, setHours, setMinutes } from 'date-fns';
import loopar from "$loopar";

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

import DateDemo from "$date-demo";

import { CalendarIcon } from "lucide-react";

export default function TimePicker(props) {
  const { renderInput, data } = BaseInput(props);

  return renderInput(field => {
    const setTimeHandler = (value) => {
      this.value(loopar.dateUtils.getTime(value));
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
                  !field.value && "text-muted-foreground"
                )}
              >
                {field.value ? loopar.dateUtils.getTime(field.value, "DB") : <span>Pick a date</span>}
                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
              </Button>
            </FormControl>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <DateDemo value={loopar.dateUtils.getTime(field.value, "DB")} handleChange={setTimeHandler}/>
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
