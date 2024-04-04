import BaseInput from "$base-input";
import dayjs from "dayjs";
import { format } from 'date-fns';

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
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

import { CalendarIcon } from "lucide-react";

export default class DatePicker extends BaseInput {
  render(){
    const data = this.data;
    
    return this.renderInput(field => {
      const setDateHandler = (value) => {
        const newDate = dayjs(value);
        const [year, month, day] = [newDate.year(), newDate.month() + 1, newDate.date()];

        const date = dayjs(field.value).toDate();
        date.setFullYear(year);
        date.setMonth(month - 1);
        date.setDate(day);

        this.value(date);
      }
      
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
                  {field.value ? (
                    format(dayjs(field.value).isValid() ? field.value : new Date(), "PPP HH:mm:ss a")
                  ) : (
                    <span>Pick a date</span>
                  )}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={field.value}
                onSelect={setDateHandler}
                disabled={(date) =>
                  date > new Date() || date < new Date("1900-01-01")
                }
                initialFocus
              />
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
}
