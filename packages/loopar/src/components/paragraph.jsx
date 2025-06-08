import BaseText from "@base-text";
import { useDesigner} from "@context/@/designer-context";
import { ComponentDefaults } from "./base/ComponentDefaults.jsx";

export function Paragraph(props) {
  const {designerMode, designing} = useDesigner();
  const {set} = ComponentDefaults(props);

  const style = {
    ...props.style,
    ...(designerMode && designing ? {maxHeight: "6em", overflow: "auto", display: "-webkit-box", "-webkit-box-orient": "vertical"} : {})
  }

  const textAlignment = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
    justify: "text-justify",
  }[props.alignment || "left"];

  const textSize = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
    xl: "text-xl",
  }[props.textSize || "md"];

  const updateFromContentEditable = (e) => {
    if (designerMode && designing) {
      set("text", e.target.innerText);
    }
  }

  const contentEditable = designerMode ? {
    contentEditable: true,
    suppressContentEditableWarning: true,
    //onInput: updateFromContentEditable,
    onBlur: updateFromContentEditable,
    className: "cursor-text",
    "data-placeholder": props.placeholder || "Type here...",
    "data-text": props.text || "",
  } : {};

  return (
    <div className="text-pretty text-slate-700 dark:text-slate-300">
      <p className={`mb-4 ${textSize} ${textAlignment}`} {...contentEditable} style={style}>{props.children}</p>
    </div>
  )
}

export default function MetaParagraph(props) {
  const {getText} = BaseText(props);

  return (
    <Paragraph {...props}>{getText()}</Paragraph>
  )
}
