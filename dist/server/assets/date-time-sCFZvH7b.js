import { jsxs, jsx } from "react/jsx-runtime";
import { B as BaseInput } from "./base-input-uYDrqEOF.js";
import dayjs from "dayjs";
import { format } from "date-fns";
import { B as Button, c as cn } from "../entry-server.js";
import { C as Calendar$1 } from "./calendar-YV3LS00t.js";
import { c as FormItem, F as FormLabel, a as FormControl, b as FormDescription, d as FormMessage } from "./form-z4zN6fsS.js";
import { P as Popover, a as PopoverTrigger, b as PopoverContent } from "./popover-orKr8AdK.js";
import { D as DateDemo } from "./date-demo-OY3A1V7q.js";
import { T as Tabs$1, a as TabsList, b as TabsTrigger, c as TabsContent } from "./tabs-w0GUUrmU.js";
import { C as Calendar } from "./calendar-D6Nf96XO.js";
import { c as createLucideIcon } from "./createLucideIcon-SgSXnVj5.js";
import "./div-rCeXGfsc.js";
import "./component-hNq1V6er.js";
import "./file-manager-elzUYIBp.js";
import "./element-manage-OWCB4Xyr.js";
import "react";
import "./base-component-BnGRdg1n.js";
import "./element-title-oSDJ5F20.js";
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
import "react-day-picker";
import "./chevron-left-fnrBQ1gk.js";
import "./chevron-right-1anJVGLe.js";
import "@radix-ui/react-separator";
import "react-hook-form";
import "./label-yp0wPYLz.js";
import "@radix-ui/react-label";
import "@radix-ui/react-popover";
import "@radix-ui/react-toggle-group";
import "@radix-ui/react-toggle";
import "@radix-ui/react-tabs";
/**
 * @license lucide-react v0.299.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Timer = createLucideIcon("Timer", [
  ["line", { x1: "10", x2: "14", y1: "2", y2: "2", key: "14vaq8" }],
  ["line", { x1: "12", x2: "15", y1: "14", y2: "11", key: "17fdiu" }],
  ["circle", { cx: "12", cy: "14", r: "8", key: "1e1u0o" }]
]);
class DateTime extends BaseInput {
  render() {
    const data = this.data;
    return this.renderInput((field) => {
      const initialHour = dayjs(field.value).format("HH:mm");
      const setTimeHandler = (value) => {
        const [hours, minutes] = value.split(":");
        const date = dayjs(field.value).toDate();
        date.setHours(hours);
        date.setMinutes(minutes);
        this.value(date);
      };
      const setDateHandler = (value) => {
        const newDate = dayjs(value);
        const [year, month, day] = [newDate.year(), newDate.month() + 1, newDate.date()];
        const date = dayjs(field.value).toDate();
        date.setFullYear(year);
        date.setMonth(month - 1);
        date.setDate(day);
        this.value(date);
      };
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
                field.value ? format(dayjs(field.value).isValid() ? new Date(field.value) : /* @__PURE__ */ new Date(), "PPP HH:mm:ss a") : /* @__PURE__ */ jsx("span", { children: "Pick a date" }),
                /* @__PURE__ */ jsx(Calendar, { className: "ml-auto h-4 w-4 opacity-50" })
              ]
            }
          ) }) }),
          /* @__PURE__ */ jsx(PopoverContent, { className: "w-auto p-0", align: "start", children: /* @__PURE__ */ jsxs(Tabs$1, { className: "w-[280px]", defaultValue: "calendar", children: [
            /* @__PURE__ */ jsxs(TabsList, { className: "flex justify-between", children: [
              /* @__PURE__ */ jsx(TabsTrigger, { className: "w-full", value: "calendar", children: /* @__PURE__ */ jsx(Calendar, {}) }),
              /* @__PURE__ */ jsx(TabsTrigger, { className: "w-full", value: "time", children: /* @__PURE__ */ jsx(Timer, {}) })
            ] }),
            /* @__PURE__ */ jsx(TabsContent, { value: "calendar", children: /* @__PURE__ */ jsx(
              Calendar$1,
              {
                mode: "single",
                selected: field.value,
                onSelect: setDateHandler,
                disabled: (date) => date > /* @__PURE__ */ new Date() || date < /* @__PURE__ */ new Date("1900-01-01"),
                initialFocus: true
              }
            ) }),
            /* @__PURE__ */ jsx(TabsContent, { value: "time", children: /* @__PURE__ */ jsx(DateDemo, { value: initialHour, handleChange: setTimeHandler }) })
          ] }) })
        ] }),
        /* @__PURE__ */ jsx(FormDescription, { children: data.description }),
        /* @__PURE__ */ jsx(FormMessage, {})
      ] });
    });
  }
}
export {
  DateTime as default
};
