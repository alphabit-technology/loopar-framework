import * as LucideIcons from "lucide-react";
import ComponentDefaults from "@component-defaults";
import {loopar} from "loopar";
import {cn} from "@cn/lib/utils";

export default function MetaIcon(props) {
  const newProps = loopar.utils.renderizableProps(props);
  const {getSize} = ComponentDefaults(props);
  const data = props.data || {};
  const Icon = LucideIcons[data?.icon] || LucideIcons.HelpCircle;
  const rounded = data?.rounded ? "rounded-full" : "rounded-md";
  const size = getSize();
  
  const className = cn(" p-2", size, newProps.className, rounded);

  return (
    <div {...newProps} className={className} >
      <Icon className="w-full h-full"/>
    </div>
  )
}

MetaIcon.metaFields =()=>{
  return {
    group: "form",
    elements: {
      icon: {
        element: ICON_INPUT,
      },
      rounded: {
        element: SWITCH,
      },
    }
  };
}