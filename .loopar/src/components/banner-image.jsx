import Preassembled from "$preassembled";
import Row from "$row";

export default class BannerImage extends Preassembled {
  blockComponent = true;
  //className = "py-5 h-100";
  defaultDescription =
    "This is a simple hero unit, a simple jumbotron-style component for calling extra attention to featured content or information.";
  /*style = {
      height: "80vh"
   };*/


  defaultElements = [
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
                    class: "lead text-muted mb-5",
                    text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer posuere erat a ante.",
                  },
                },
                {
                  element: "button",
                  data: {
                    class:
                      "btn btn-lg btn-primary d-block d-sm-inline-block mr-sm-2 my-3",
                    label: "Let's Try ",
                    elements: [
                      {
                        element: "i",
                        data: {
                          class: "fa fa-angle-right ml-2",
                        },
                      },
                    ],
                  },
                },
                {
                  element: "button",
                  data: {
                    class:
                      "btn btn-lg btn-subtle-primary d-block d-sm-inline-block my-3",
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

  render() {
    return (
      <>
        {this.props.children}
        {this.elements}
      </>
    );
  }

  get metaFields() {
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
  }
}
