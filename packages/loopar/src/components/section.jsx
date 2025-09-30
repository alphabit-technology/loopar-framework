import {useEffect, useState} from "react";
import {Droppable} from "@droppable";
import {useDroppable} from "./droppable/DroppableContext";
import {ChevronDownIcon, ChevronUpIcon} from "lucide-react";
import {useCookies} from "@services/cookie";
import { useDesigner } from "@context/@/designer-context";

export default function Section(props){
  const {droppableEvents} = useDroppable();
  const {designing} = useDesigner();
  const [collapsible, setCollapsible] = useState(false);
  const data = props.data || {};
  const [collapsed, setCollapsed] = useCookies(data.key, false);

  useEffect(() => {
    if(designing || data.collapsible) {
      setCollapsible(true);
    }
  }, [designing, data.collapsible]);
  
  return (
    <div>
      <div className="absolute z-10 flex h-8 w-8 ">
        {collapsible && collapsed && <ChevronDownIcon className="h-4 w-4 cursor-pointer text-white" onClick={() => setCollapsed(false)}/>}
        {collapsible && !collapsed && <ChevronUpIcon className="h-4 w-4 cursor-pointer text-white" onClick={() => setCollapsed(true)}/>}
      </div>
      <div 
        className={`container ${ collapsible && collapsed ? "h-10 overflow-hidden" : ""}`}
        {...(designing ? droppableEvents : {})}
      >
        {!collapsed &&
        <section
          className="mx-auto flex max-w-[1280px] flex-row gap-2 py-8 md:py-12 md:pb-8 lg:py-24 lg:pb-20"
        >
          <Droppable
            {...props}
            className="flex-1"
          />
        </section>
        }
      </div>
    </div>
  );
}
