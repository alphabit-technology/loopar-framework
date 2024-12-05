import Icon from "@icon";
import Paragraph from "@paragraph";
import ComponentDefaults from "@component-defaults";
import { useEffect } from "react";

export default function TextBlockIcon(props) {
  const {data, set} = ComponentDefaults(props);


  useEffect(() => {
    !data.title && set("title", "Text Block");
    !data.text && set("text", "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed sit amet metus nec odio lacinia tincidunt. Fusce auctor, magna eget tincidunt fermentum, nunc nisl tincidunt justo, nec tincidunt justo justo nec justo. Nullam nec justo nec justo.");
  }, [data]);

  return (
    <div className="flex gap-2 py-3 pb-4">
      <div className="flex gap-2">
        <div className="w-[100px] justify-center items-top rounded-3">
          <Icon className="w-full" data={{icon: data.icon}}/>
        </div>
        <div className="w-full items-top">
          <div className="font-bold text-2xl mb-2">
            {data.title}
          </div>
          <Paragraph data={{text: data.text}}/>
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