import {div, a, p, h3, image} from "/components/elements.js";
export default function noData (props) {
   return div({className: 'empty-state'}, [
      div({className: 'empty-state-container'}, [
         div({className: 'state-figure'}, [
            image({className: 'img-fluid', src: "/assets/images/illustration/img_nodatafound.svg"})
         ]),
         h3({className: 'state-header'}, "No Content, Yet."),
         p({className: 'state-description lead text-muted'}, "Use the button below to add content."),
         div({className: 'state-action'}, [
            a({className: 'btn btn-primary btn-lg', href: ""}, "Add Content")
         ])
      ])
   ]);
}