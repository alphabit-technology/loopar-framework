import BaseText from "$base-text";
import { useDesigner} from "@context/@/designer-context";


export function Paragraph(props) {
  const {designerMode, designing} = useDesigner();
  const style = {
    ...props.style,
    ...(designerMode && designing ? {maxHeight: "6em", overflow: "auto", display: "-webkit-box", "-webkit-box-orient": "vertical"} : {})
  }

  return (
    <div className="text-pretty mt-6 text-slate-700 dark:text-slate-300">
      <p className="mb-4 text-lg" style={style}>{props.text}</p>
    </div>
  )
}

export default function MetaParagraph(props) {
  const {getText} = BaseText(props);

  return (
    <Paragraph text={getText()}/>
  )
}
