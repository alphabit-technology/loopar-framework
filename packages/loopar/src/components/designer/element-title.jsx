import {Button} from "@cn/components/ui/button";
import { PencilIcon, Trash2Icon } from "lucide-react";
import { cn } from "@cn/lib/utils";

import { useDesigner } from "@context/@/designer-context";

export function ElementTitle({element, active, ...props}) {
  const designer = useDesigner();
  const title = element.elementTitle || element.element || "";

  if(!title) return null;

  const handleEditElement = (e) => {
    e.preventDefault();
    e.stopPropagation();
    designer.handleEditElement(element.data.key);
  }

  const handleDeleteElement = (e) => {
    e.preventDefault();
    //e.stopPropagation();
    designer.handleDeleteElement(element.data.key);
  }

  return (
    <div 
      className={cn("absolute right-0 z-10 flex flex-row justify-end", props.className || "")}
      {...props}
    >
      {active && (
        <>
          <Button
            variant="destructive"
            size="xs"
            onClick={handleEditElement}
            className="h-5 w-10 rounded-none rounded-bl"
          >
            <PencilIcon className="h-4 w-4"/>
          </Button>
          <Button
            variant="destructive"
            size="xs"
            onClick={handleDeleteElement}
            className="h-5 w-10 rounded-none"
          >
            <Trash2Icon className="h-4 w-4"/>
          </Button>
        </> 
      )}
      <Button
        variant="primary"
        size="xs"
        className="h-5 rounded-none pointer-events-none rounded-tr px-1 text-secondary"
      >
        {(element.data.key/*element.elementTitle || element.element*/).toString().split(".")[0].toUpperCase()}
      </Button>
    </div>
  )
}