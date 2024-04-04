import { jsx } from "react/jsx-runtime";
import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { c as cn } from "../entry-server.js";
import { C as Check } from "./check-siG4PdgZ.js";
const Checkbox$1 = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  CheckboxPrimitive.Root,
  {
    ref,
    className: cn(
      "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
      className
    ),
    ...props,
    children: /* @__PURE__ */ jsx(
      CheckboxPrimitive.Indicator,
      {
        className: cn("flex items-center justify-center text-current"),
        children: /* @__PURE__ */ jsx(Check, { className: "h-4 w-4" })
      }
    )
  }
));
Checkbox$1.displayName = CheckboxPrimitive.Root.displayName;
export {
  Checkbox$1 as C
};
