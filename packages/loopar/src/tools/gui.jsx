class GuiManage{
   dropdownActions = {};
   constructor(options) {
      Object.assign(this, options);
   }

   dropdownAction(name, dropdown) {
      this.dropdownActions[name] = dropdown;
   }

   closeAllDropdowns(except = null) {
     Object.entries(this.dropdownActions).forEach(([name, dropdownAction]) => {
        //if (except && except === name) return;
        //dropdownAction();
     });
   }

   uuid() {
      return "el" + Math.floor(Math.random() * Math.floor(Math.random() * Date.now()));
   }
}

export default new GuiManage();