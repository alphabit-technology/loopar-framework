import { useEffect, useState, useMemo } from "react";
import { Droppable } from "@droppable";
import { useDroppable } from "./droppable/DroppableContext";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { useCookies } from "@services/cookie";
import { useDesigner } from "@context/@/designer-context";
import { useDocument } from "@context/@/document-context";
import { cn } from "@cn/lib/utils";

const DEFAULTS = {
  spacing: 4,
  padding_y: "md",
  max_width: "1280px",
  full_width: false,
};

export default function Section(props) {
  const { droppableEvents } = useDroppable();
  const { designing } = useDesigner();
  const [collapsible, setCollapsible] = useState(false);
  const data = props.data || {};
  const [collapsed, setCollapsed] = useCookies(data.key, false);
  const { spacing: docSpacing = {} } = useDocument();

  // Merge con defaults
  const config = useMemo(() => ({
    ...DEFAULTS,
    ...data,
    spacing: data.spacing ?? docSpacing.spacing ?? DEFAULTS.spacing,
  }), [data, docSpacing]);

  useEffect(() => {
    if (designing || data.collapsible) {
      setCollapsible(true);
    }
  }, [designing, data.collapsible]);

  const gap = useMemo(() => {
    const sp = parseInt(config.spacing);
    return Number.isNaN(sp) ? DEFAULTS.spacing : sp;
  }, [config.spacing]);

  const paddingY = useMemo(() => {
    return {
      none: "py-0",
      sm: "py-4 md:py-6 lg:py-8",
      md: "py-8 md:py-12 lg:py-24",
      lg: "py-12 md:py-16 lg:py-32",
      xl: "py-16 md:py-24 lg:py-40",
    }[config.padding_y] || "py-8 md:py-12 lg:py-24";
  }, [config.padding_y]);

  return (
    <div>
      <div className="absolute z-10 flex h-8 w-8">
        {collapsible && collapsed && (
          <ChevronDownIcon 
            className="h-4 w-4 cursor-pointer text-white" 
            onClick={() => setCollapsed(false)} 
          />
        )}
        {collapsible && !collapsed && (
          <ChevronUpIcon 
            className="h-4 w-4 cursor-pointer text-white" 
            onClick={() => setCollapsed(true)} 
          />
        )}
      </div>
      <div
        className={cn(
          "container mx-auto",
          collapsible && collapsed && "h-10 overflow-hidden"
        )}
      >
        {!collapsed && (
          <section
            className={cn(
              "mx-auto flex max-w-[1280px]",
              "flex-col",
              paddingY,
              data.class
            )}
            style={{
              gap: `${gap}rem`,
              ...props.style,
            }}
          >
            <Droppable
              {...props}
              className="flex flex-col w-full p-4 lg:p-0"
              style={{ gap: `${gap}rem` }}
            />
          </section>
        )}
      </div>
    </div>
  );
}

Section.droppable = true;

Section.metaFields = () => {
  return [
    {
      group: "layout",
      elements: {
        spacing: {
          element: SELECT,
          data: {
            label: "Gap",
            options: [0, 1, 2, 3, 4, 5, 6],
            selected: DEFAULTS.spacing,
            description: "Spacing between rows in rem.",
          },
        },
        padding_y: {
          element: SELECT,
          data: {
            label: "Vertical Padding",
            options: [
              { option: "none", value: "None" },
              { option: "sm", value: "Small" },
              { option: "md", value: "Medium" },
              { option: "lg", value: "Large" },
              { option: "xl", value: "Extra Large" },
            ],
            selected: DEFAULTS.padding_y,
          },
        },
        full_width: {
          element: SWITCH,
          data: {
            label: "Full Width",
            description: "Remove max-width constraint",
          },
        },
        collapsible: {
          element: SWITCH,
          data: {
            label: "Collapsible",
            description: "Allow section to collapse",
          },
        },
      },
    },
  ];
};