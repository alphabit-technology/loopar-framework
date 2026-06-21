import { memo, useCallback } from "react";
import { PencilIcon, Trash2Icon } from "lucide-react";
import { cn } from "@cn/lib/utils";
import { useDesigner } from "@context/@/designer-context";
import { getNodeKey } from "@global/prune-doc-structure";
import {elementsDict} from "@global/element-definition"
import Icon from "@icon";

export const ElementTitle = memo(function ElementTitle({ 
  element, 
  active, 
  isDroppable,
  ...props 
}) {
  const designer = useDesigner();
  const title = element.elementTitle || element.element || "";

  const elKey = getNodeKey(element);
  const handleEditElement = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    designer.handleEditElement(elKey);
  }, [designer, elKey]);

  const handleDeleteElement = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    designer.handleDeleteElement(elKey);
  }, [designer, elKey]);

  if (!title) return null;

  const icon = elementsDict[element.element]?.def?.icon || "code"

  return (
    <span
      className={cn(
        "absolute z-11 flex items-center gap-0.5 rounded px-1.5 py-0.5 top-0 right-0",
        "bg-zinc-800/95 border border-zinc-600/60 shadow-md backdrop-blur-sm",
        "transition-opacity duration-150",
        active ? "opacity-100" : "opacity-0 pointer-events-none",
        props.className
      )}
      {...props}
    >
      <div
        className={cn(
          "flex items-center transition-opacity duration-150 no-drag pr-1",
          active ? "opacity-100" : "opacity-0 hidden"
        )}
      >
        <div
          className="px-2 py-0.5 hover:bg-destructive/70 cursor-pointer"
          onClick={handleDeleteElement}
        >
          <Trash2Icon className="h-4 w-4 text-gray-400" strokeWidth={2} />
        </div>
      </div>

      <span
        className="text-primary font-semibold cursor-pointer leading-none"
        onClick={handleEditElement}
      >
        <Icon data={{icon}} className="w-5 h-5"/>
      </span>
    </span>
  );
});