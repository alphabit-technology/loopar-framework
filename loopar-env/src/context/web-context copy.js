/*import BaseDocument from "./base/base-document.js";*/

/*export default class View extends BaseDocument {
   constructor(props) {
      super(props);
   }

   render(content=[]) {
      return super.render([
         ...this.meta.__DOCTYPE__.STRUCTURE.map(el => {
            if (el.data.hidden) return null;
            return Element(el.element, {
               docRef: this,
               meta: {
                  ...el,
               },
            })
         }),
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
}*/