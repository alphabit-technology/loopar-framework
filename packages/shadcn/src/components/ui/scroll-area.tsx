"use client"

import * as React from "react"
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area"
import { cn } from "@cn/lib/utils"

const ScrollArea = ({ className, children, ...props }: React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root>) => (
  <ScrollAreaPrimitive.Root
    className={cn("lprelative lpoverflow-hidden", className)}
    {...props}
  >
    <ScrollAreaPrimitive.Viewport className="lph-full lpw-full lprounded-[inherit]">
      {children}
    </ScrollAreaPrimitive.Viewport>
    <ScrollBar />
    <ScrollAreaPrimitive.Corner />
  </ScrollAreaPrimitive.Root>
)
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName

const ScrollBar = (
  { className, orientation = "vertical", ...props }: React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>
) => (
  <ScrollAreaPrimitive.ScrollAreaScrollbar
    orientation={orientation}
    className={cn(
      "lpflex lptouch-none lpselect-none lptransition-colors",
      orientation === "vertical" &&
      "lph-full lpw-2.5 lpborder-l lpborder-l-transparent lpp-[1px]",
      orientation === "horizontal" &&
      "lph-2.5 lpflex-col lpborder-t lpborder-t-transparent lpp-[1px]",
      className
    )}
    {...props}
  >
    <ScrollAreaPrimitive.ScrollAreaThumb className="lprelative lpflex-1 lprounded-full lpbg-gray-200 dark:lpbg-gray-800" />
  </ScrollAreaPrimitive.ScrollAreaScrollbar>
)
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName

export { ScrollArea, ScrollBar }
