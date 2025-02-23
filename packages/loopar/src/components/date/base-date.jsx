import BaseInput from "@base-input";
import dayjs from "dayjs";
import { format } from 'date-fns';

import { cn } from "@cn/lib/utils"
import { Button } from "@cn/components/ui/button"
import { Calendar } from "@cn/components/ui/calendar"
import {
  FormControl,
  FormDescription,
  FormField,
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

export default class BaseDate extends BaseInput {
  visibleInput = false;

  render(){
    const data = this.data;
    const formControl = this.props.form;

    const setTimeHandler = (value) => {
      const [hours, minutes] = value.split(":");
      const date = dayjs(data.value).toDate();
      date.setHours(hours);
      date.setMinutes(minutes);

      this.handleInputChange(null, date);
    };

    const setDateHandler = (value) => {
      const newDate = dayjs(value);
      const [year, month, day] = [newDate.year(), newDate.month() + 1, newDate.date()];

      const date = dayjs(data.value).toDate();
      date.setFullYear(year);
      date.setMonth(month - 1);
      date.setDate(day);

      this.handleInputChange(null, date);
    }

    /*const setDateHandler1 = (value) => {
      let date = new Date(data.value);
      const newDate = new Date(value);

      date = setYear(date, newDate.getFullYear());
      date = setMonth(date, newDate.getMonth()); // date-fns maneja los meses de 0 a 11
      date = setDate(date, newDate.getDate());

      this.handleInputChange(null, date);
    };*/

    const initial = dayjs(data.value).toDate();
    const initialHour = dayjs(data.value).format("HH:mm");

    return (
      <FormField
        control={formControl}
        name={data.name}
        defaultValue={initial}
        //value={initial}
        render={({ field }) => (
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
                      format(field.value, "PPP HH:mm:ss a")
                    ) : (
                      <span>Pick a date</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <BaseTabs className="w-[280px]" defaultValue="calendar">
                  <TabsList className="flex justify-between">
                    <TabsTrigger className="w-full" value="calendar"><CalendarIcon/></TabsTrigger>
                    <TabsTrigger className="w-full" value="time"><TimerIcon/></TabsTrigger>
                  </TabsList>
                  <TabsContent value="calendar">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={(date) => {
                        setDateHandler(date);
                        field.onChange(this.data.value);
                      }}
                      disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01")
                      }
                      initialFocus
                    />
                  </TabsContent>
                  <TabsContent value="time">
                    <DateDemo value={initialHour} handleChange={(time)=>{
                      setTimeHandler(time);

                      //const value = handleTimeChange(this.data.value)
                      field.onChange(this.data.value);
                    }}/>
                  </TabsContent>
                </BaseTabs>
              </PopoverContent>
            </Popover>
            <FormDescription>
              {data.description}
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    )
  }
  componentDidMount() {
    super.componentDidMount();

    /*if(typeof document === "undefined") return;
    const pickerInline = document.querySelector("#timepicker-inline-12");
    const timepickerMaxMin = new Timepicker(pickerInline, {
      format12: true,
      inline: true,
    });*/

    /*loopar.scriptManager.loadStylesheet("/assets/plugins/datetime/css/dt");

    loopar.scriptManager.loadScript("/assets/plugins/datetime/js/dt", () => {
      if (this.input?.node) {
        this.dtsel = new dtsel.DTS(this.input.node, {
          direction: "BOTTOM",
          showTime: this.type === "datetime" || this.type === "time",
          showDate: this.type !== "time",
          onUpdateInput: (e) => {
            e.preventDefault();
            this.handleInputChange({ target: { value: e.value } });
          },
        });

        this.setState({});
      }
    });*/
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    super.componentDidUpdate(prevProps, prevState, snapshot);

    /*const formattedValue = dayjs(this.props.data.value).format(
      this.props.format
    );

    if (prevProps.meta.data.value !== formattedValue && this.dtsel) {
      this.props.data.value = formattedValue;
      this.dtsel.inputElem.value = formattedValue;

      this.handleInputChange({ target: { value: formattedValue } });
    }*/
  }

  val(val) {
    /*if (val) {
      val = dayjs(val).format(this.format);
      this.dtsel.inputElem.value = val;
    } else {
      return this.dtsel ? this.dtsel.inputElem.value : this.data.value;
    }*/
  }
}
