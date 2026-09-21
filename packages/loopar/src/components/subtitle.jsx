import BaseText from "@base-text";
import { ComponentDefaults } from "./base/ComponentDefaults";
import { useDesigner } from "@context/designer-context";
import { cn } from "@cn/lib/utils";

export default function SubTitle(props) {
  const {designing} = useDesigner();
  const {getText} = BaseText({...props, defaultText: "SubTitle"});
  const {getTextSize, getTextAlign} = ComponentDefaults(props);

  return (
    <div {...props}>
      <h3
        className={cn(
          'font-bold leading-tight tracking-tighter md:text-xl lg:leading-[1.1] text-center',
          getTextAlign(), getTextSize(),
          props.className
        )}
        {...(designing
          ? {
            style: {
                maxHeight: "3em",
                overflow: "auto",
                display: "-webkit-box",
                WebkitLineClamp: 5,
                WebkitBoxOrient: "vertical",
              },
            }
          : {
            style: props.style || {}
          })}
      >
        {getText()}
      </h3>
    </div>
  );
}

