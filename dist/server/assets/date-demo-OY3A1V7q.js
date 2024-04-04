import { jsx, jsxs } from "react/jsx-runtime";
import * as React from "react";
import { useState, useRef, useEffect } from "react";
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";
import { c as cn } from "../entry-server.js";
import * as TogglePrimitive from "@radix-ui/react-toggle";
import { cva } from "class-variance-authority";
const toggleVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors hover:bg-muted hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline: "border border-input bg-transparent hover:bg-accent hover:text-accent-foreground"
      },
      size: {
        default: "h-10 px-3",
        sm: "h-9 px-2.5",
        lg: "h-11 px-5"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);
const Toggle = React.forwardRef(({ className, variant, size, ...props }, ref) => /* @__PURE__ */ jsx(
  TogglePrimitive.Root,
  {
    ref,
    className: cn(toggleVariants({ variant, size, className })),
    ...props
  }
));
Toggle.displayName = TogglePrimitive.Root.displayName;
const ToggleGroupContext = React.createContext({
  size: "default",
  variant: "default"
});
const ToggleGroup = React.forwardRef(({ className, variant, size, children, ...props }, ref) => /* @__PURE__ */ jsx(
  ToggleGroupPrimitive.Root,
  {
    ref,
    className: cn("flex items-center justify-center gap-1", className),
    ...props,
    children: /* @__PURE__ */ jsx(ToggleGroupContext.Provider, { value: { variant, size }, children })
  }
));
ToggleGroup.displayName = ToggleGroupPrimitive.Root.displayName;
const ToggleGroupItem = React.forwardRef(({ className, children, variant, size, ...props }, ref) => {
  const context = React.useContext(ToggleGroupContext);
  return /* @__PURE__ */ jsx(
    ToggleGroupPrimitive.Item,
    {
      ref,
      className: cn(
        toggleVariants({
          variant: context.variant || variant,
          size: context.size || size
        }),
        className
      ),
      ...props,
      children
    }
  );
});
ToggleGroupItem.displayName = ToggleGroupPrimitive.Item.displayName;
const AnalogTimePicker = (props) => {
  const { handleChange, value } = props;
  const [hours, minutes] = value.split(":").map((value2) => parseInt(value2));
  const [AmPm, setAmPm] = useState(hours > 12 ? "PM" : "AM");
  const [selectorType, setSelectorType] = useState(null);
  const [selectedHour, setSelectedHour] = useState(hours);
  const [selectedMinute, setSelectedMinute] = useState(minutes);
  const [dragging, setDragging] = useState(false);
  const clockRef = useRef(null);
  const [clockSize, markSize] = [200, 20];
  const clockRadius = clockSize / 2;
  const markRadius = clockRadius - markSize / 2;
  const hourColor = "bg-slate-500";
  const minuteColor = "bg-green-500";
  const handleMouseDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const typeSelector = e.currentTarget.getAttribute("type-selector");
    if (typeSelector) {
      setSelectorType(typeSelector);
    }
    setDragging(true);
    updateHourFromMouseEvent(e);
  };
  const handleMouseMove = (e) => {
    if (dragging && clockRef.current) {
      updateHourFromMouseEvent(e);
    }
  };
  const handleMouseUp = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectorType(null);
    setDragging(false);
  };
  const updateHourFromMouseEvent = (e) => {
    if (clockRef.current) {
      const rect = clockRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX) + Math.PI / 2;
      let degrees = (angle * (180 / Math.PI) + 360) % 360;
      if (selectorType === "Minutes") {
        const minutes2 = Math.round(degrees / 6) % 60;
        setSelectedMinute(minutes2);
        setTimeHandler(`${selectedHour}:${minutes2}`);
      } else if (selectorType === "Hours") {
        const hours2 = Math.round(degrees / 30) % 12 || 12;
        setHour(hours2);
      }
    }
  };
  const setTimeHandler = (value2) => {
    handleChange && handleChange(value2);
  };
  const amPmHandler = (value2) => {
    setAmPm(value2);
  };
  useEffect(() => {
    setHour(selectedHour);
  }, [AmPm, selectedHour]);
  useEffect(() => {
    setTimeHandler(`${selectedHour}:${selectedMinute}`);
  }, [selectedHour, selectedMinute]);
  const setHour = (hour = selectedHour) => {
    let newHour = hour;
    if (AmPm === "PM") {
      newHour = hour < 12 ? hour + 12 : hour;
    } else {
      newHour = hour >= 12 ? hour - 12 : hour;
    }
    setSelectedHour(newHour);
  };
  const calculateMarkPosition = (index, isHourMark) => {
    const angle = index * (isHourMark ? 30 : 6) * (Math.PI / 180);
    const radius = isHourMark ? markRadius - 15 : markRadius;
    const x = clockRadius + radius * Math.cos(angle) - (isHourMark ? markSize / 2 : 1);
    const y = clockRadius + radius * Math.sin(angle) - (isHourMark ? markSize / 2 : 1);
    return { x, y };
  };
  return /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center p-2", children: [
    /* @__PURE__ */ jsx("div", { className: "flex w-full items-center justify-end", children: /* @__PURE__ */ jsxs(ToggleGroup, { type: "single", defaultValue: AmPm, value: AmPm, children: [
      /* @__PURE__ */ jsx(ToggleGroupItem, { onClick: () => amPmHandler("AM"), value: "AM", children: "Am" }),
      /* @__PURE__ */ jsx(ToggleGroupItem, { onClick: () => amPmHandler("PM"), value: "PM", children: "Pm" })
    ] }) }),
    /* @__PURE__ */ jsxs(
      "div",
      {
        className: `relative rounded-full border-4 border-slate-600`,
        style: { width: clockSize + 10, height: clockSize + 10, padding: 85 },
        ref: clockRef,
        onMouseMove: handleMouseMove,
        onMouseLeave: handleMouseUp,
        onMouseUp: handleMouseUp,
        children: [
          Array.from({ length: 12 }).map((_, index) => {
            const { x, y } = calculateMarkPosition(index, true);
            const hour = index + 3 > 12 ? index - 9 : index + 3;
            return /* @__PURE__ */ jsx(
              "div",
              {
                className: "absolute h-5 w-5 select-none rounded-full text-center leading-5",
                style: { left: x, top: y },
                children: hour
              },
              index
            );
          }),
          Array.from({ length: 60 }).map((_, index) => {
            const isHourMark = index % 5 === 0;
            const { x, y } = calculateMarkPosition(index, false);
            return /* @__PURE__ */ jsx(
              "div",
              {
                className: `absolute rounded-full ${isHourMark ? hourColor : minuteColor}`,
                style: {
                  left: x,
                  top: y,
                  width: 6,
                  height: 1,
                  ...isHourMark ? { left: x - 3, width: 10, height: 3 } : {},
                  transform: `rotate(${index * 6}deg)`
                }
              },
              `mark-${index}`
            );
          }),
          /* @__PURE__ */ jsxs("div", { className: `rounded-full ${hourColor}`, style: { width: "100%", height: "100%" }, children: [
            /* @__PURE__ */ jsx(
              "div",
              {
                className: `absolute cursor-grab rounded ${hourColor}`,
                "type-selector": "Hours",
                style: {
                  width: 18,
                  height: `${clockRadius * 0.6}px`,
                  left: "calc(50% - 9px)",
                  bottom: "50%",
                  transform: `rotate(${selectedHour % 12 * 30}deg)`,
                  transformOrigin: "50% 100%"
                },
                onMouseDown: handleMouseDown,
                onMouseUp: handleMouseUp
              }
            ),
            /* @__PURE__ */ jsx(
              "div",
              {
                className: `absolute w-[12px] cursor-grab rounded ${minuteColor}`,
                "type-selector": "Minutes",
                style: {
                  height: `${clockRadius * 0.85}px`,
                  left: "calc(50% - 6px)",
                  bottom: "50%",
                  transform: `rotate(${selectedMinute % 60 * 6}deg)`,
                  transformOrigin: "50% 100%"
                },
                onMouseDown: handleMouseDown,
                onMouseUp: handleMouseUp
              }
            ),
            /* @__PURE__ */ jsx(
              "div",
              {
                className: `absolute h-6 w-6 rounded-full ${minuteColor}`,
                style: {
                  left: "50%",
                  top: "50%",
                  transform: "translate(-50%, -50%)"
                }
              }
            ),
            /* @__PURE__ */ jsx(
              "div",
              {
                className: "absolute h-4 w-4 rounded-full bg-slate-800",
                style: {
                  left: "50%",
                  top: "50%",
                  transform: "translate(-50%, -50%)"
                }
              }
            )
          ] })
        ]
      }
    )
  ] });
};
const DateDemo = AnalogTimePicker;
export {
  DateDemo as D
};
