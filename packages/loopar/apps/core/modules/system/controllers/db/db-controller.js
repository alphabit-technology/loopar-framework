import { loopar, BaseController, PermissionManager } from "loopar";

export default class DbController extends BaseController {
  static inheritedActions = ['view'];
  static freeActions = ["getList", "getAll"]

  async actionView() {
  }

  async privateActionSidebar() {
    return { sidebarData: await DeskController.sidebarData() };
  }

  static async sidebarData() {
    return loopar.modulesGroup;
  }

  async actionGetList(){
    const {document, options} = this.query;

    if(!PermissionManager.can(document, "list")){
      loopar.throw(`You do not have acces to ${document}.${action}`)
    }

   return await loopar.db.getList(document, options)
  }

  async actionGetAll(){
    const {document, options} = this.query;

    if(!PermissionManager.can(document, "list")){
      loopar.throw(`You do not have acces to ${document}.${action}`)
    }

   return await loopar.db.getAll(document, options)
  }
}