import {image, div, h2, p, a, i} from "../elements.js";
import Preassembled from "../base/preassembled.js";

export default class BannerImage extends Preassembled {
   blockComponent = true;
   className = "py-5";
   defaultDescription = "This is a simple hero unit, a simple jumbotron-style component for calling extra attention to featured content or information.";
   /*style = {
      height: "80vh"
   };*/

   defaultElements = [
      {
         element: "div",
         data: {
            class: "col-12 col-md-6 order-md-2"
         },
         elements: [
            {
               element: "image",
               data: {
                  class: "img-fluid img-float-md-6 mb-5 mb-md-0",
                  src: "https://picsum.photos/800/600",
                  alt: ""
               }
            }
         ]
      },
      {
         element: "div",
         data: {
            class: "col-12 col-md-6 order-md-1"
         },
         elements: [
            {
               element: "div",
               data: {
                  class: "col-fix pl-xl-3 ml-auto text-center text-sm-left"
               },
               elements: [
                  {
                     element: "generic",
                     data: {
                        tag: "h2",
                        class: "display-4 enable-responsive-font-size mb-4",
                        text: "Jumbo heading"
                     }
                  },
                  {
                     element: "generic",
                     data: {
                        tag: "p",
                        class: "lead text-muted mb-5",
                        text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer posuere erat a ante."
                     }
                  },
                  {
                     element: "button",
                     data: {
                        class: "btn btn-lg btn-primary d-block d-sm-inline-block mr-sm-2 my-3",
                        label: "Let's Try ",
                        elements: [
                           {
                              element: "i",
                              data: {
                                 class: "fa fa-angle-right ml-2"
                              }
                           }
                        ]
                     }
                  },
                  {
                     element: "button",
                     data: {
                        class: "btn btn-lg btn-subtle-primary d-block d-sm-inline-block my-3",
                        target: "_blank",
                        label: "Documentation"
                     }
                  }
               ]
            }
         ]
      }
   ];

   constructor(props){
      super(props);
   }

   render(){
      const {label, description, action} = this.data;

      return super.render([
         div({className: "container container-fluid-xl"}, [
            div({
               Component: this,
               ref: el => this.container = el,
               className: "row align-items-center"
            }, [
               this.props.children,
               this.elements
               /*div({className: "col-12 col-md-6 order-md-2 aos-init aos-animate", "data-aos": "fade-left"}, [
                  image({
                     className: "img-fluid img-float-md-6 mb-5 mb-md-0", src: action, alt: ""
                  })
               ]),
               div({className: "col-12 col-md-6 order-md-1 aos-init aos-animate", "data-aos": "fade-in"}, [
                  div({className: "col-fix pl-xl-3 ml-auto text-center text-sm-left"}, [
                     h2({className: "display-4 enable-responsive-font-size mb-4"}, [
                        label || "Jumbo heading"
                     ]),
                     p({className: "lead text-muted mb-5"}, [
                        description
                     ]),
                     a({href: "index.html", className: "btn btn-lg btn-primary d-block d-sm-inline-block mr-sm-2 my-3 aos-init aos-animate", "data-aos": "zoom-in", "data-aos-delay": "200"}, [
                        "Let's Try ",
                        i({className: "fa fa-angle-right ml-2"})
                     ]),
                     a({
                        href: "/docs",
                        className: "btn btn-lg btn-subtle-primary d-block d-sm-inline-block my-3 aos-init aos-animate", target: "_blank", "data-aos": "zoom-in", "data-aos-delay": "300"}, [
                        "Documentation"
                     ])
                  ])
               ])*/
            ])
         ])
      ]);
   }
}