import BaseInput from "$base-input";
import dayjs from "dayjs";
import { format } from 'date-fns';

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

export default class TimePicker extends BaseInput {
  render(){
    const data = this.data;
    
    return this.renderInput(field => {
      const setTimeHandler = (value) => {
        const [hours, minutes] = value.split(":");
        const date = dayjs(field.value).toDate();
        date.setHours(hours);
        date.setMinutes(minutes);

        this.value(date);
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
}
