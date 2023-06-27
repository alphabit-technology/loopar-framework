import {HTML} from "/components/base/html.js";

export default class Theme extends HTML {
   constructor(props) {
      super(props);
   }

   componentDidMount() {
      super.componentDidMount();
      this.toggleDropdown();
   }

   toggleDropdown() {
      document.addEventListener("click", (e) => {
         const closest = e.target.closest(".dropdown");

         closest?.querySelector('.dropdown-menu').classList.toggle("show");

         document.querySelectorAll(".dropdown-menu").forEach((dropdown) => {
            if (!closest || dropdown !== closest.querySelector('.dropdown-menu')) {
               dropdown.classList.remove("show");
            }
         });
      });
   }
}