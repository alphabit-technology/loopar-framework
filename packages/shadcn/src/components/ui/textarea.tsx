import * as React from "react"

import { cn } from "@cn/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> { }

const Textarea = ({ className, ...props }: TextareaProps) => (
  <textarea
    className={cn(
      "lpflex lpmin-h-[80px] lpw-full lprounded-md lpborder lpborder-input lpbg-background lppx-3 lppy-2 lptext-sm lpring-offset-background placeholder:lptext-muted-foreground focus-visible:lpoutline-none focus-visible:lpring-2 focus-visible:lpring-ring focus-visible:lpring-offset-2 disabled:lpcursor-not-allowed disabled:lpopacity-50",
      className
    )}
    {...props}
  />
)
Textarea.displayName = "Textarea"

export { Textarea }
