import Icon from "@icon";
import {Paragraph} from "@paragraph";
import ComponentDefaults from "@component-defaults";
import { useEffect } from "react";
import {cn} from "@/lib/utils";

export default function TextBlockIcon(props) {
  const {data, set} = ComponentDefaults(props);

  const orientation = data.orientation || "Horizontal";

  useEffect(() => {
    !data.title && set("title", "Text Block");
    !data.text && set("text", "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed sit amet metus nec odio lacinia tincidunt. Fusce auctor, magna eget tincidunt fermentum, nunc nisl tincidunt justo, nec tincidunt justo justo nec justo. Nullam nec justo nec justo.");
  }, [data]);


  const iconSize = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-12 h-12",
    xl: "w-18 h-18",
  }[data.icon_size || "lg"];

  const iconSizeContainer = {
    sm: "w-8",
    md: "w-12",
    lg: "w-16",
    xl: "w-24",
  }[data.icon_size || "md"];

  return (
    <div className="flex gap-2 py-3 pb-4">
      <div className={`flex ${orientation == "Horizontal" ? "flex-row justify-items-center" : "flex-col"} gap-2`}>
        <div className={`${orientation == "Horizontal" ? iconSizeContainer : "w-full"} justify-items-center items-top rounded-3`}>
          <div className="rounded-full bg-gray-100 dark:bg-gray-800 p-2">
            <Icon className={`${iconSize}`} data={{ icon: data.icon }} />
          </div>
        </div>
        <div className="items-top">
          <div className={`font-bold text-2xl mb-2 ${orientation == "Vertical" ? "text-center" : ""}`}>
            {data.title}
          </div>
          <Paragraph
            alignment={orientation == "Vertical" ? "center" : "left"}
            textSize= {data.text_size || "xl"}
          >
            {data.text}
          </Paragraph>
        </div>
      </div>
    </div>
  )
}

TextBlockIcon.metaFields = () => {
  return {
    group: "form",
    elements: {
      icon: {
        element: ICON_INPUT,
      },
      rounded: {
        element: SWITCH,
      },
      title: {
        element: INPUT,
      },
      text: {
        element: TEXTAREA,
      },
    }
  };
}

TextBlockIcon.dontHaveMetaElements = ["label"];


TextBlockIcon.metaFields = () => {
  return [{
    group: "custom",
    elements: {
      icon: {
        element: ICON_INPUT,
      },
      title: {
        element: INPUT,
      },
      text: {
        element: TEXTAREA,
      },
      orientation: {
        element: SELECT,
        data: {
          options: ["Horizontal", "Vertical"],
        },
      },
      icon_size: {
        element: SELECT,
        data: {
          options: ["sm", "md", "lg", "xl"],
        },
      },
      text_size: {
        element: SELECT,
        data: {
          options: ["sm", "md", "lg", "xl"],
        },
      }
    },
  }];
}