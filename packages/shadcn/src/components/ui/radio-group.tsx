"use client"

import * as React from "react"
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group"
import { Circle } from "lucide-react"
import { cn } from "@cn/lib/utils"

const RadioGroup = ({ className, ...props }: React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>) => {
  return (
    <RadioGroupPrimitive.Root
      className={cn("lpgrid lpgap-2", className)}
      {...props}
    />
  )
}
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName

const RadioGroupItem = ({ className, ...props }: React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>) => {
  return (
    <RadioGroupPrimitive.Item
      className={cn(
        "lpaspect-square lph-4 lpw-4 lprounded-full lpborder lpborder-primary lptext-primary lpring-offset-background focus:lpoutline-none focus-visible:lpring-2 focus-visible:lpring-ring focus-visible:lpring-offset-2 disabled:lpcursor-not-allowed disabled:lpopacity-50",
        className
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="lpflex lpitems-center lpjustify-center">
        <Circle className="lph-2.5 lpw-2.5 lpfill-current lptext-current" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  )
}
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName

export { RadioGroup, RadioGroupItem }
