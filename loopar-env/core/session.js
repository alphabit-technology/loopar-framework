import {loopar} from "./loopar.js";

export class Session {
   req = null;
   constructor(){}

   async set(key, value){
      this.req.session[key] = value;

      return new Promise(resolve => {
         this.req.session.save(err =>{
            err && loopar.throw(err);
            resolve();
         });
      });
   }

   get(key, or=null){
      return this.req.session[key] || or;
   }

   async delete(key){
      delete this.req.session[key];
      return new Promise(resolve => {
         this.req.session.save(err =>{
            err && loopar.throw(err);
            resolve();
         });
      });
   }

   destroy(resolve){
      this.req.session.destroy(err =>{
         err && loopar.throw(err);
         resolve();
      });
   }

   getID(resolve){
      resolve(this.req.sessionID);
   }

   getCookie(resolve){
      resolve(this.req.session.cookie);
   }

   setCookie(cookie, resolve){
      this.req.session.cookie = cookie;
      this.req.session.save(err =>{
         err && loopar.throw(err);
         resolve();
      });
   }

   regenerate(resolve){
      this.req.session.regenerate(err =>{
         err && loopar.throw(err);
         resolve();
      });
   }
}