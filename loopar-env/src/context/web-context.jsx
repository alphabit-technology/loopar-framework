import BaseDocument from "#context/base/base-document";
import DynamicComponent from "#dynamic-component";
//import Element from "#elements";
/*import React, { lazy, Suspense } from 'react';
const Module = lazy(() => import(`#loopar-home-view`));*/

export default class WebContext extends BaseDocument {
   constructor(props) {
      super(props);

      this.state = {
         ...this.state,
         Components: {},
      }
   }

   render(content = []) {
      //return <h1>Web Context</h1>
      //console.log("Web Context", this.meta);
      return super.render([
         <DynamicComponent elements={this.meta.__DOCTYPE__.STRUCTURE} props={{}} parent={this} />,
         /*...this.meta.__DOCTYPE__.STRUCTURE.map(el => {
            if (el.data.hidden) return null;
            return Element(el.element, {
               docRef: this,
               meta: {
                  ...el,
               },
            })
         }),*/
         content
      ]);
   }

   componentDidMount() {
      super.componentDidMount();
      this.initScroll();
   }

   getPageKey() {
      return this.meta.key;
   }

   initScroll() {
      const scrollPosition = localStorage.getItem(this.getPageKey()) || 0;
      window.scrollTo(0, scrollPosition);
      window.addEventListener("beforeunload", this.handleBeforeUnload);
   }

   setScrollPosition() {
      localStorage.setItem(this.getPageKey(), window.scrollY || window.pageYOffset);
   }

   componentWillUnmount() {
      super.componentWillUnmount();
      window.removeEventListener("beforeunload", this.handleBeforeUnload);
      this.setScrollPosition();
   }

   handleBeforeUnload = () => {
      this.setScrollPosition();
   };
}