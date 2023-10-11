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

         if (closest) {
            const target = document.querySelector(closest.dataset.target);
            const closests = document.querySelectorAll("[data-target='" + closest.dataset.target + "']");

            target.classList.toggle("show");

            //console.log(closests, target.classList.contains("show"))

            closests.forEach((closest) => {
               if (closest.hasAttribute('aria-expanded')) {
                  closest.setAttribute('aria-expanded', target.classList.contains("show") ? 'true' : 'false');
               }
            });

            /*if (closest.hasAttribute('aria-expanded')) {
               closest.setAttribute('aria-expanded', closest.getAttribute('aria-expanded') === 'true' ? 'false' : 'true');
            }*/
         }
      });
   }
}