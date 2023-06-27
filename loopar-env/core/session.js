import {loopar} from "./loopar.js";
export class Session {
   constructor(){}

   async set(key, value){
      loopar.server.req.session[key] = value;

      return new Promise(resolve => {
         loopar.server.req.session.save(err =>{
            err && loopar.throw(err);
            resolve();
         });
      });
   }

   get(key){
      return loopar.server.req.session[key];
   }

   async delete(key){
      delete loopar.server.req.session[key];
      return new Promise(resolve => {
         loopar.server.req.session.save(err =>{
            err && loopar.throw(err);
            resolve();
         });
      });
   }

   destroy(resolve){
      loopar.server.req.session.destroy(err =>{
         err && loopar.throw(err);
         resolve();
      });
   }

   getID(resolve){
      resolve(loopar.server.req.sessionID);
   }

   getCookie(resolve){
      resolve(loopar.server.req.session.cookie);
   }

   setCookie(cookie, resolve){
      loopar.server.req.session.cookie = cookie;
      loopar.server.req.session.save(err =>{
         err && loopar.throw(err);
         resolve();
      });
   }

   regenerate(resolve){
      loopar.server.req.session.regenerate(err =>{
         err && loopar.throw(err);
         resolve();
      });
   }
}