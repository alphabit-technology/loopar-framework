import BaseText from "@base-text";
import ComponentDefaults from "@component-defaults";
import { useDesigner } from "@context/@/designer-context";
import { cn } from "@cn/lib/utils";

export default function Title(props) {
  const {designing} = useDesigner();
  const {getText} = BaseText(props);
  const {getTextSize, getTextAlign} = ComponentDefaults(props);

  return (
    <div className="">
      <h1 
        className={cn(
          getTextAlign(), getTextSize(),
          "font-bold leading-tight tracking-tighter md:text-6xl text-4xl lg:leading-[1.1]",
          props.className
        )}
        {...(designing
          ? {
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
