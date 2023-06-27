import {loopar} from "../loopar.js";

export default class AuthController {
   login_actions = ['login', 'register', 'recovery_user', 'recovery_password'];

   constructor(options) {
      Object.assign(this, options);
   }

   __execute() {
      const [req, res] = [this.req, this.res];
      const action = this.action;
      const data = this.data;

      if (this.login_actions.includes(action)) {
         this.__login(action, data);
      } else {
         this.__logout();
      }
   }

   isAuthenticated() {
      return new Promise(async resolve => {
         const execute_action = (method, message, url) => {
            if (method === AJAX) {
               loopar.throw(message);
            } else {
               return this.res.redirect(url);
            }
         }

         if (this.req.session.user) { /** User is logged */
            //const user = {name: "Administrator", "email": "test"}//loopar.get_user(this.req.session.user.name);
            const user = loopar.get_user(this.req.session.user.name);

            if (user && user.name !== 'Administrator' && user.disabled) {
               execute_action(this.req.method, 'Not permitted', '/auth/login/login');
               resolve(false);
               return;
            }

            if (this.is_login_action) {
               execute_action(this.method, 'You are already logged in, refresh this page', '/core/desk/view');
               resolve(false);
            }else if(this.is_enable_action) {
               resolve(true);
            } else {
               execute_action(this.method, 'Action not valid in Desk App', '/core/desk/view');
               resolve(false);
            }
         } else if (this.is_login_action && (this.is_free_action || this.is_enable_action)) {
            resolve(true);
         } else if(this.free_access && this.workspace !== 'desk') {
            resolve(true);
         } else {
            execute_action(this.method, 'Your session has ended, please log in again.', '/auth/login/login');
            resolve(false);
         }

      });
   }

   get is_free_action() {
      return !this.free_actions || this.free_actions.includes(this.action);
   }

   get is_login_action() {
      return (this.login_actions || []).includes(this.action);
   }

   get is_enable_action() {
      return !this.actions_enabled || this.actions_enabled.includes(this.action);
   }

   isAuthorized() {
      return new Promise(resolve => {
         resolve(true);
      });
   }

   before_action() {
      return Promise.all([this.isAuthenticated(), this.isAuthorized()]);
   }
}