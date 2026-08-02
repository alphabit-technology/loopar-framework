import BaseInput from "@base-input";
import dayjs from "dayjs";
import loopar from "loopar";
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

    const disabledDays = [];
    if (loopar.utils.trueValue(data.disable_past_dates)) disabledDays.push({ before: new Date() });
    if (loopar.utils.trueValue(data.disable_future_dates)) disabledDays.push({ after: new Date() });
    const minDate = data.min_date ? dayjs(data.min_date) : null;
    const maxDate = data.max_date ? dayjs(data.max_date) : null;
    if (minDate?.isValid()) disabledDays.push({ before: minDate.toDate() });
    if (maxDate?.isValid()) disabledDays.push({ after: maxDate.toDate() });

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
              disabled={disabledDays.length ? disabledDays : undefined}
              autoFocus
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

DatePicker.metaFields = () => [
  ...BaseInput.metaFields(),
  {
    group: "form",
    elements: {
      min_date: {
        element: DATE,
        data: { description: "Earliest selectable date. Leave empty for no lower limit." },
      },
      max_date: {
        element: DATE,
        data: { description: "Latest selectable date. Leave empty for no upper limit." },
      },
      disable_past_dates: {
        element: SWITCH,
        data: { description: "Disallow picking dates before today." },
      },
      disable_future_dates: {
        element: SWITCH,
        data: { description: "Disallow picking dates after today." },
      },
    },
  },
];