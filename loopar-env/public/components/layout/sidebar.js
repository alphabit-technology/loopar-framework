import Div from "/components/elements/div.js";
export class Sidebar extends Div{
   collapsed = localStorage.getItem('sidebar-collapsed') === 'true';

   constructor(props) {
      super(props);
   }

   hide() {
      this.sidebar.hide()
   }

   show() {
      this.sidebar.show();
   }

   toggle(collapsed = null) {
      this.collapsed = collapsed !== null ? collapsed : !this.collapsed;

      localStorage.setItem('sidebar-collapsed', this.collapsed);

      if (this.collapsed) {
         //this.parent.wrapper.removeClass('has-sidebar-expand-xl has-sidebar-open');
      } else {
         //this.parent.wrapper.addClass('has-sidebar-expand-xl has-sidebar-open');
         //this.show();
      }
   }
}