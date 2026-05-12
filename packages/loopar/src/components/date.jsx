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

import { CalendarIcon } from "lucide-react";

export default function DatePicker(props) {
  const { renderInput, data } = BaseInput(props);

  return renderInput(field => {
    const parsed = dayjs(field.value);
    const isValid = !!field.value && parsed.isValid();
    const fieldDate = isValid ? parsed.toDate() : null;

    const setDateHandler = (val) => {
      if (!val) return;
      const newDate = dayjs(val);
      const date = fieldDate ? new Date(fieldDate) : new Date();
      date.setFullYear(newDate.year());
      date.setMonth(newDate.month());
      date.setDate(newDate.date());

      field.onChange({ target: { value: date } });
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
                  !isValid && "text-muted-foreground"
                )}
              >
                {isValid ? (
                  format(fieldDate, "PPP")
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
              selected={fieldDate ?? undefined}
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
  });
}

DatePicker.metaFields = BaseInput.metaFields;