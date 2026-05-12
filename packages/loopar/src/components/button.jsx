import React, { useRef, useState } from "react";
import {Button} from "@cn/components/ui/button";
import {useDocument} from "@context/@/document-context";
import { ChevronRight, Check } from "lucide-react";
import { cn } from "@cn/lib/utils";
import loopar from "loopar";
import { VARIANTS } from "./base/ComponentDefaults";

const buttons = {
  primary: "primary",
  secondary: "secondary",
  default: "default",
  ghost: "ghost",
  destructive: "destructive",
};

export const SlideButton = ({
  onConfirm,
  text = "Slide to confirm",
  confirmedText = "Confirmed",
  threshold = 0.95,
  disabled = false,
  className,
}) => {
  const trackRef = useRef(null);
  const handleRef = useRef(null);
  const [offset, setOffset] = useState(0);
  const [confirmed, setConfirmed] = useState(false);
  const [dragging, setDragging] = useState(false);
  const stateRef = useRef({ startX: 0, max: 0, offset: 0 });

  const setOffsetSafe = (v) => {
    stateRef.current.offset = v;
    setOffset(v);
  };

  const computeMax = () => {
    if (!trackRef.current || !handleRef.current) return 0;
    const trackW = trackRef.current.offsetWidth;
    const handleW = handleRef.current.offsetWidth;
    return Math.max(0, trackW - handleW - 4);
  };

  const onPointerDown = (e) => {
    if (disabled || confirmed) return;
    e.preventDefault();
    e.stopPropagation();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    stateRef.current.max = computeMax();
    stateRef.current.startX = clientX - stateRef.current.offset;
    setDragging(true);

    const onMove = (ev) => {
      const cx = ev.touches ? ev.touches[0].clientX : ev.clientX;
      const delta = cx - stateRef.current.startX;
      const clamped = Math.max(0, Math.min(stateRef.current.max, delta));
      setOffsetSafe(clamped);
    };

    const onUp = () => {
      const max = stateRef.current.max;
      const reached = max > 0 && stateRef.current.offset >= max * threshold;
      if (reached) {
        setOffsetSafe(max);
        setConfirmed(true);
        onConfirm && onConfirm();
      } else {
        setOffsetSafe(0);
      }
      setDragging(false);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onUp);
  };

  const max = stateRef.current.max || 1;
  const progress = Math.min(1, offset / max);

  return (
    <div
      ref={trackRef}
      role="slider"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress * 100)}
      aria-label={text}
      aria-disabled={disabled || confirmed}
      className={cn(
        "relative w-full sm:w-72 h-11 rounded-md border border-input bg-secondary/40 overflow-hidden select-none",
        (disabled || confirmed) && "opacity-90",
        className
      )}
    >
      <div
        className={cn(
          "absolute inset-y-0 left-0 bg-primary",
          !dragging && "transition-[width] duration-200 ease-out"
        )}
        style={{ width: `${(progress * 100).toFixed(2)}%` }}
      />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span
          className={cn(
            "text-sm font-medium tracking-wide transition-colors",
            progress > 0.55 ? "text-primary-foreground" : "text-foreground/80"
          )}
        >
          {confirmed ? confirmedText : text}
        </span>
      </div>
      <div
        ref={handleRef}
        onMouseDown={onPointerDown}
        onTouchStart={onPointerDown}
        className={cn(
          "absolute top-0.5 left-0.5 h-10 w-10 rounded-md flex items-center justify-center shadow",
          "bg-primary text-primary-foreground",
          dragging ? "cursor-grabbing" : "cursor-grab",
          !dragging && "transition-transform duration-200 ease-out",
          (disabled || confirmed) && "cursor-default"
        )}
        style={{ transform: `translateX(${offset}px)` }}
      >
        {confirmed ? <Check size={20} /> : <ChevronRight size={20} />}
      </div>
    </div>
  );
};

export default function MetaButton(props){
  const data = props.data || {};
  const {docRef} = useDocument();

  const performAction = () => {
    if (data.action && docRef) {
      if(!docRef[data.action]) loopar.throw("Action not Defined", `Action ${data.action} not found in model`);
      docRef[data.action]();
    }
  };

  const handleClick = (e) => {
    e.preventDefault();
    performAction();
  };

  const getVariant = () => {
    return buttons[data.variant] || buttons.default;
  }

  if (data.slide) {
    return (
      <SlideButton
        text={data.slide_text || data.label || "Slide to confirm"}
        confirmedText={data.slide_confirmed_text || "Confirmed"}
        threshold={typeof data.slide_threshold === "number" ? data.slide_threshold : 0.95}
        onConfirm={performAction}
        className={props.className}
      />
    );
  }

  return (
    <Button
      {...loopar.utils.renderizableProps(props)}
      variant={getVariant()}
      onClick={handleClick}
      className={props.className}
    >
      {data.label || "Button"}
    </Button>
  );
}

MetaButton.metaFields =()=>{
  return [{
    group: "form",
    elements: {
      action: {
        element: INPUT,
        data: {
          description:
            "You can define action like save, print..., button will be call action function in your model",
        },
      },
      variant: {
        element: SELECT,
        data: {
          options: Object.keys(VARIANTS).map(k => ({ value: VARIANTS[k], label: k })),
        },
      },
      slide: {
        element: SWITCH,
        data: {
          description:
            "Render this button as a slide-to-confirm control. Useful for destructive or otherwise sensitive actions.",
        },
      },
      slide_text: {
        element: INPUT,
        data: {
          description:
            "Label shown on the slide track while idle. Falls back to the button label or 'Slide to confirm'.",
        },
      },
      slide_confirmed_text: {
        element: INPUT,
        data: {
          description:
            "Label shown once the user has completed the slide. Defaults to 'Confirmed'.",
        },
      },
    },
  }];
}
