import {Button} from "@/components/ui/button";
import { PencilIcon, Trash2Icon } from "lucide-react";
import { cn } from "@/lib/utils";

export function ElementTitle({element, active, handleEditElement, handleDeleteElement, ...props}) {

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
            className="h-5 w-8 rounded-none"
          >
            <PencilIcon className="h-4 w-4"/>
          </Button>
          <Button
            variant="destructive"
            size="xs"
            onClick={handleDeleteElement}
            className="h-5 w-8 rounded-none"
          >
            <Trash2Icon className="h-4 w-4"/>
          </Button>
        </> 
      )}
      <Button
        variant="secondary"
        size="xs"
        className="h-5 rounded-none px-2"
        onClick={(e) => {e.stopPropagation(); e.preventDefault();}}
      >
        {(element.elementTitle || element.element).toString().split(".")[0].toUpperCase()}
      </Button>
    </div>
  )
}