import Preassembled from "@preassembled";
import { cn } from "@cn/lib/utils";
import {useDesigner} from "@context/@/designer-context";

const defaultElements = [
  {
    element: "row",
    elements: [
      {
        element: "col",
        elements: [
          {
            element: "image",
            data: {
              class: "img-fluid mb-5 mb-md-0",
              src: "https://picsum.photos/800/600",
              alt: "",
            },
          },
        ],
      },
      {
        element: "col",
        elements: [
          {
            element: "div",
            data: {
              class: "ml-auto text-center text-sm-left",
            },
            elements: [
              {
                element: "title",
                data: {
                  class: "display-4 mb-4",
                  text: "Jumbo heading",
                },
              },
              {
                element: "subtitle",
                data: {
                  class: "lead mb-5",
                  text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer posuere erat a ante.",
                },
              },
              {
                element: "button",
                data: {
                  class: "d-block sm:inline-block sm:mr-2 my-3",
                  label: "Let's Try ",
                },
              },
              {
                element: "button",
                data: {
                  class: "d-block sm:inline-block my-3",
                  target: "_blank",
                  label: "Documentation",
                },
              },
            ],
          },
        ],
      },
    ],
  }
];

export default function BannerImage(props){
  const defaultDescription =
    "This is a simple hero unit, a simple jumbotron-style component for calling extra attention to featured content or information.";

  const data = props.data || {};
  const {designerMode} = useDesigner();

  return (
    <div className={
      cn(
        "p-0 lg:p-4",
        data.full_height && !designerMode && "h-[calc(100vh-var(--spacing-web-header-height))] max-h-[calc(100vh-var(--spacing-web-header-height))]",
    )}>
      <Preassembled
        {...props}
        className={cn(props.className, "h-full w-full")}
        defaultDescription={defaultDescription}
        defaultElements={defaultElements}
      />
    </div>
  );
}

BannerImage.droppable = true;
BannerImage.metaFields = () => {
  return [
    {
      group: "general",
      elements: {
        full_height: {
          element: SWITCH,
          data: {
            description:
              "If enabled the slider will have the height of the screen.",
          },
        },
      },
    },
  ];
};