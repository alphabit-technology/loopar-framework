import BaseText from "@base-text";
import { ComponentDefaults } from "./base/ComponentDefaults";
import { useDesigner } from "@context/@/designer-context";
import { cn } from "@cn/lib/utils";
import {useCallback} from "react"

export default function Title(props) {
  const {designing} = useDesigner();
  const {getText} = BaseText(props);
  const {getTextSize, getTextAlign} = ComponentDefaults(props);

  const textClass = useCallback(() => {
    if (!props.className) return "";
    return props.className
      .split(" ")
      .filter(cls => cls.includes("text-") || cls.includes("font-"))
      .join(" ");
  }, [props.className])

  return (
    <div {...props}>
      <h1 
        className={cn(
          getTextAlign(), getTextSize(),
          "font-bold leading-tight tracking-tighter md:text-6xl text-4xl lg:leading-[1.1]",
          textClass(),
          props.className
        )}
        {...(
          designing ? {
            style: {
                maxHeight: "3em",
                overflow: "auto",
                display: "-webkit-box",
                "-webkit-line-clamp": 5,
                "-webkit-box-orient": "vertical",
              },
            }
          : {
            style: props.style || {}
          })}
      >
        {getText()}
      </h1>
    </div>
  )
}

Title.droppable = false;