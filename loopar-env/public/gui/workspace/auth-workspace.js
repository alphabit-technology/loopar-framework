import BaseWorkspace from "./base/base-workspace.js";
import {div, h1, image, a, h2, canvas, script, i} from "/components/elements.js";

export default class AuthWorkspace extends BaseWorkspace {
   constructor(props){
      super(props);
   }

   render(){
      return super.render([
         div({className: "auth-form"}, [
            div({className: "mb-4"},
               div({className: "mb-3"},
                  image({src: "/assets/images/logo.svg", alt: "My Happy SVG", style: {height: 28, width:140}})
               ),
               h1({className: "h3"}, "Sing In")
            ),
            ...super.documents,
            div({className: "mb-0 px-3 text-muted text-center"},
               "© 2022 All Rights Reserved. Loopar is dynamic and extensible JS Framework.",
               a({href: "#"}, "Privacy"),
               " and ",
               a({href: "#"}, "Terms")
            ),
         ]),
         div({ id: "announcement", className: "auth-announcement", style: { "background-image": "url(/assets/images/illustration/builder.svg)", position: "sticky"}}, [
            div({ className: "announcement-body"}, [
               h2({ className: "announcement-title"}, "Building the Automated Future"),
               a({ className: "btn btn-warning", href: "#"}, [
                  i({ className: "fa fa-fw fa-angle-right"}),
                  "Visit the Documentation"
               ]),
            ]),
            canvas({ className: "particles-js-canvas-el", width: "0", height: "0", style: { width: "100%", height: "100%"}}),
            script({ src: "/assets/particles/particles.js", sync: "true", defer: "true"})
         ])
      ]);
   }

   componentDidMount(){
      super.componentDidMount();
      AOS.init();
      particlesJS.load('announcement', '/assets/particles/particles.json')
   }
}