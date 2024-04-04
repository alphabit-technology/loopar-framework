import { jsx } from "react/jsx-runtime";
import * as React from "react";
import { c as cn } from "../entry-server.js";
const Textarea = React.forwardRef(
  ({ className, ...props }, ref) => {
    return /* @__PURE__ */ jsx(
      "textarea",
      {
        className: cn(
          "lpflex lpmin-h-[80px] lpw-full lprounded-md lpborder lpborder-input lpbg-background lppx-3 lppy-2 lptext-sm lpring-offset-background placeholder:lptext-muted-foreground focus-visible:lpoutline-none focus-visible:lpring-2 focus-visible:lpring-ring focus-visible:lpring-offset-2 disabled:lpcursor-not-allowed disabled:lpopacity-50",
          className
        ),
        ref,
        ...props
      }
    );
  }
);
Textarea.displayName = "Textarea";
export {
  Textarea as T
};
