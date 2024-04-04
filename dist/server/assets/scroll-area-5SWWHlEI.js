import { jsxs, jsx } from "react/jsx-runtime";
import * as React from "react";
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";
import { c as cn } from "../entry-server.js";
const ScrollArea = React.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsxs(
  ScrollAreaPrimitive.Root,
  {
    ref,
    className: cn("relative overflow-hidden", className),
    ...props,
    children: [
      /* @__PURE__ */ jsx(ScrollAreaPrimitive.Viewport, { className: "h-full w-full rounded-[inherit]", children }),
      /* @__PURE__ */ jsx(ScrollBar, {}),
      /* @__PURE__ */ jsx(ScrollAreaPrimitive.Corner, {})
    ]
  }
));
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName;
const ScrollBar = React.forwardRef(({ className, orientation = "vertical", ...props }, ref) => /* @__PURE__ */ jsx(
  ScrollAreaPrimitive.ScrollAreaScrollbar,
  {
    ref,
    orientation,
    className: cn(
      "flex touch-none select-none transition-colors",
      orientation === "vertical" && "h-full w-2.5 border-l border-l-transparent p-[1px]",
      orientation === "horizontal" && "h-2.5 flex-col border-t border-t-transparent p-[1px]",
      className
    ),
    ...props,
    children: /* @__PURE__ */ jsx(ScrollAreaPrimitive.ScrollAreaThumb, { className: "relative flex-1 rounded-full bg-border" })
  }
));
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName;
