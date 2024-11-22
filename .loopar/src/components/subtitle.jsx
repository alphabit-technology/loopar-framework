import BaseText from "@base-text";
import ComponentDefaults from "@component-defaults";
import {useDesigner} from "@context/@/designer-context";

export default function SubTitle(props) {
  const {designing} = useDesigner();
  const {getText} = BaseText(props);
  const {getTextSize, getTextAlign} = ComponentDefaults(props);

  return (
    <h3
      className={`font-bold leading-tight tracking-tighter md:text-xl lg:leading-[1.1] ${getTextAlign()} ${getTextSize()}`}
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
        : {})}
    >
      {getText()}
    </h3>
  );
}
