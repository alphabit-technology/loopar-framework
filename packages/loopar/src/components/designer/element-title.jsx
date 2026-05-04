import { memo, useCallback } from "react";
import { PencilIcon, Trash2Icon } from "lucide-react";
import { cn } from "@cn/lib/utils";
import { useDesigner } from "@context/@/designer-context";
import { getNodeKey } from "@global/prune-doc-structure";

const ComponentTag = memo(({ name }) => {
  const displayName = (name || "")
    .split(/[_\-\s]+/)
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');

  return (
    <span className="text-blue-400 font-bold text-sm italic">
      {displayName}
    </span>
  );
});

ComponentTag.displayName = "ComponentTag";

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

  return (
    <span
      className={cn(
        "absolute z-10 flex items-center rounded-bl px-1",
        isDroppable ? "top-0 right-0" : "top-0 right-0 opacity-90",
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
          className="px-2 py-0.5 hover:bg-primary/70 cursor-pointer"
          onClick={handleEditElement}
        >
          <PencilIcon className="h-4 w-4 text-gray-400" strokeWidth={2} />
        </div>
        <div
          className="px-2 py-0.5 hover:bg-destructive/70 cursor-pointer"
          onClick={handleDeleteElement}
        >
          <Trash2Icon className="h-4 w-4 text-gray-400" strokeWidth={2} />
        </div>
      </div>

      <span
        className="text-primary font-semibold italic cursor-pointer leading-none"
        onClick={handleEditElement}
      >
        <ComponentTag name={title} />
      </span>
    </span>
  );
});