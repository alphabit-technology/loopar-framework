import BaseInput from "@base-input";
import dayjs from "dayjs";
import { format } from 'date-fns';

import { cn } from "@cn/lib/utils"
import { Button } from "@cn/components/ui/button"
import { Calendar } from "@cn/components/ui/calendar"
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

import DateDemo from "@date-demo";
import { CalendarIcon, TimerIcon } from "lucide-react";

import { Tabs as BaseTabs, TabsContent, TabsList, TabsTrigger } from "@cn/components/ui/tabs";


export default function DateTime(props) {
  const { renderInput, data, value } = BaseInput(props);

  return renderInput(field => {
    //const initialDate = dayjs(field.value).toDate();
    const initialHour = dayjs(field.value).format("HH:mm");

    const setTimeHandler = (val) => {
      const [hours, minutes] = val.split(":");
      const date = dayjs(field.value).toDate();
      date.setHours(hours);
      date.setMinutes(minutes);

      value(date);
    };

    const setDateHandler = (val) => {
      const newDate = dayjs(val);
      const [year, month, day] = [newDate.year(), newDate.month() + 1, newDate.date()];

      const date = dayjs(field.value).toDate();
      date.setFullYear(year);
      date.setMonth(month - 1);
      date.setDate(day);

      value(date);
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
                  format(dayjs(field.value).isValid() ? new Date(field.value) : new Date(), "PPP HH:mm:ss a")
                ) : (
                  <span>Pick a date & time</span>
                )}
                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
              </Button>
            </FormControl>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <BaseTabs className="w-[280px]" defaultValue="calendar">
              <TabsList className="flex justify-between">
                <TabsTrigger className="w-full" value="calendar"><CalendarIcon /></TabsTrigger>
                <TabsTrigger className="w-full" value="time"><TimerIcon /></TabsTrigger>
              </TabsList>
              <TabsContent value="calendar">
                <Calendar
                  mode="single"
                  selected={field.value}
                  onSelect={setDateHandler}
                  disabled={(date) =>
                    date > new Date() || date < new Date("1900-01-01")
                  }
                  initialFocus
                />
              </TabsContent>
              <TabsContent value="time">
                <DateDemo value={initialHour} handleChange={setTimeHandler} />
              </TabsContent>
            </BaseTabs>
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
