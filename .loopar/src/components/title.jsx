import BaseText from "$base-text";
import ComponentDefaults from "$component-defaults";
import {useDesigner} from "@custom-hooks";

export default function Title(props) {
  const {designing} = useDesigner();
  const {getText} = BaseText(props);
  const {getTextSize, getTextAlign} = ComponentDefaults(props);

  return (
    <div className="flex">
      <h1 
        className={`${getTextAlign()} ${getTextSize()} w-full font-bold leading-tight tracking-tighter md:text-6xl lg:leading-[1.1]`}
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
      </h1>
    </div>
  )
}
