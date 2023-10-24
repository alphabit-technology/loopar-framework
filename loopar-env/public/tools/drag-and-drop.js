class DragAndDrop {
   #elementToDrag = null;
   #elementToCreate = null;

   constructor(options) {
   }

   set elementToDrag(element) {
      this.#elementToDrag = element;
   }

   get elementToDrag() {
      return this.#elementToDrag;
   }

   set elementToCreate(element) {
      this.#elementToCreate = element;
   }

   get elementToCreate() {
      return this.#elementToCreate;
   }

   dragstart(element, event) {
      //event.dataTransfer.setData('text', event.target.id);
   }

   /*drop(element, event) {
       event.preventDefault();
       element.removeClass("over-drag");

       if (this.elementToCreate) {
           this.elementToCreate.is_element = true;
           element.set_dropped_element(this.elementToCreate);
       } else {
           if (this.elementToDrag) {
               if (this.elementToDrag.parentOf(element) || element === this.elementToDrag) {

               } else {
                   element.set_dropped_element(this.elementToDrag);
               }
           }
       }
   }*/

   allowDrop(ev) {
      ev.preventDefault();
   }
}

export const DragAndDropUtils = new DragAndDrop();