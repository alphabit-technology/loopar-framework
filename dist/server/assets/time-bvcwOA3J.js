import { jsxs, jsx } from "react/jsx-runtime";
import { B as BaseInput } from "./base-input-uYDrqEOF.js";
import dayjs from "dayjs";
import { format } from "date-fns";
import { B as Button, c as cn } from "../entry-server.js";
import { c as FormItem, F as FormLabel, a as FormControl, b as FormDescription, d as FormMessage } from "./form-z4zN6fsS.js";
import { P as Popover, a as PopoverTrigger, b as PopoverContent } from "./popover-orKr8AdK.js";
import { D as DateDemo } from "./date-demo-OY3A1V7q.js";
import { C as Calendar } from "./calendar-D6Nf96XO.js";
import "./div-rCeXGfsc.js";
import "./component-hNq1V6er.js";
import "./file-manager-elzUYIBp.js";
import "./element-manage-OWCB4Xyr.js";
import "react";
import "./base-component-BnGRdg1n.js";
import "./element-title-oSDJ5F20.js";
import "./createLucideIcon-SgSXnVj5.js";
import "react-dom/server";
import "clsx";
import "tailwind-merge";
import "react-router-dom";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "universal-cookie";
import "./form-field-WWLBJIO2.js";
import "./form-context-8n26Uc_0.js";
import "./workspace-provider-ZZuPyRcj.js";
import "@hookform/resolvers/zod";
import "@radix-ui/react-separator";
import "react-hook-form";
import "./label-yp0wPYLz.js";
import "@radix-ui/react-label";
import "@radix-ui/react-popover";
import "@radix-ui/react-toggle-group";
import "@radix-ui/react-toggle";
class TimePicker extends BaseInput {
  render() {
    const data = this.data;
    return this.renderInput((field) => {
      const setTimeHandler = (value) => {
        const [hours, minutes] = value.split(":");
        const date = dayjs(field.value).toDate();
        date.setHours(hours);
        date.setMinutes(minutes);
        this.value(date);
      };
      const initialHour = dayjs(field.value).format("HH:mm");
      return /* @__PURE__ */ jsxs(FormItem, { className: "flex flex-col", children: [
        /* @__PURE__ */ jsx(FormLabel, { children: data.label }),
        /* @__PURE__ */ jsxs(Popover, { children: [
          /* @__PURE__ */ jsx(PopoverTrigger, { asChild: true, children: /* @__PURE__ */ jsx(FormControl, { children: /* @__PURE__ */ jsxs(
            Button,
            {
              variant: "outline",
              className: cn(
                "w-[240px] pl-3 text-left font-normal",
                !field.value && "text-muted-foreground"
              ),
              children: [
                field.value ? format(dayjs(field.value).isValid() ? field.value : /* @__PURE__ */ new Date(), "PPP HH:mm:ss a") : /* @__PURE__ */ jsx("span", { children: "Pick a date" }),
                /* @__PURE__ */ jsx(Calendar, { className: "ml-auto h-4 w-4 opacity-50" })
              ]
            }
          ) }) }),
          /* @__PURE__ */ jsx(PopoverContent, { className: "w-auto p-0", align: "start", children: /* @__PURE__ */ jsx(DateDemo, { value: initialHour, handleChange: setTimeHandler }) })
        ] }),
        /* @__PURE__ */ jsx(FormDescription, { children: data.description }),
        /* @__PURE__ */ jsx(FormMessage, {})
      ] });
    });
  }
}
export {
  TimePicker as default
};
