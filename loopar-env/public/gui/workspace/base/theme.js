import {HTML} from "/components/base/html.js";

export default class Theme extends HTML {
   constructor(props) {
      super(props);
   }

   componentDidMount() {
      super.componentDidMount();
      this.toggleDropdown();
      this.binDataTarget();
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

   binDataTarget() {
      document.addEventListener("click", (e) => {
         const closest = e.target.closest("[data-target]");
         const dataset = closest?.dataset || {};

         if (closest) {
            const target = document.querySelector(`[${dataset.attr}="${dataset.target}"]`);//closest.dataset.target);
            
            const dispatchers = document.querySelectorAll("[data-target='" + dataset.target + "']");

            target.classList.toggle("show");

            dispatchers.forEach((closest) => {
               if (closest.hasAttribute('aria-expanded')) {
                  closest.setAttribute('aria-expanded', target.classList.contains("show") ? 'true' : 'false');
               }
            });
         }
      });
   }

   toggleMenu() {
      const menu = this.state.menu;
      this.setState({ menu: !menu, showBackdrop: !menu, collapseMenu: false });
   }

   toggleSidebar(e){
      const sidebar = e.target.closest("[data-sidebar]");
      const dispatchers = document.querySelectorAll(`[data-target="${sidebar.dataset.sidebar}"]`);
      sidebar.classList.toggle("show");

      dispatchers.forEach((closest) => {
         if (closest.hasAttribute('aria-expanded')) {
            closest.setAttribute('aria-expanded', sidebar.classList.contains("show") ? 'true' : 'false');
         }
      });
   }
}