import React, { useState } from "react";
import { useDesigner, useDocument, useHidden } from "@custom-hooks";
import { cn } from "@/lib/utils"
import loopar from "$loopar";


export function Droppable(props) {
  const [dropping, setDropping] = useState(false);
  const { children, receiver, className, Component = "div" } = props;
  const document = useDocument();
  const mode = document.mode;
  const hidden = useHidden();

  const isDesigner = useDesigner().designerMode || props.isDesigner;
  const isDroppable = receiver.droppable || receiver.props.droppable || props.isDroppable;
  const droppableEvents = {};

  if (isDesigner && isDroppable && mode !== "preview" && receiver.drop) {
    droppableEvents.onDragOver = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setDropping(true);
    };
    droppableEvents.onDragLeave = (e) => {
      e.preventDefault();
      setDropping(false);
    };
    droppableEvents.onDrop = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setDropping(false);

      receiver.drop(e);
    };
  }

  const ClassNames = cn(
    mode !== "preview" && "h-full w-full p-3",
    mode !== "preview" && isDroppable && "min-h-20",
    dropping ? 'bg-gradient-to-r from-slate-500/50 to-slate-600/50 shadow' : 
      mode !== "preview" && 'bg-slate-200/50 dark:bg-slate-900/50',
    className, mode !== "preview" ? "pt-4" : ""
  );

  const renderizableProps = loopar.utils.renderizableProps(props);

  return (
    (isDesigner && isDroppable && !hidden) ?
      <Component
        {...renderizableProps}
        className={ClassNames}
        {...droppableEvents}
      >
        {children}
      </Component> :
      <Component {...renderizableProps} className={className} >
        {children}
      </Component>
  );
}