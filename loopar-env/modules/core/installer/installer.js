import {loopar} from "../../../core/loopar.js";
import {file_manage} from "../../../core/file-manage.js";
import sha1 from "sha1";
import path from "path";

export default class Installer {
   app_name = "loopar";
   constructor(data) {
      Object.assign(this, data)
   }

   async __data_install__() {
      return {
         __DOCTYPE__: {
            doc_structure: "",
            name: "Installer",
            STRUCTURE: [
               {
                  element: "card",
                  data: {
                     label: "Your Company Data",
                     icon: "fa fa-building",
                     color: "primary"
                  },
                  elements: [
                     {
                        element: "input",
                        data: {
                           label: "Company",
                           name: "company",
                           required: 1
                        }
                     },
                     {
                        element: "input",
                        data: {
                           name: "email",
                           label: "Email",
                           required: 1
                        }
                     },
                     {
                        element: "password",
                        data: {
                           name: "admin_password",
                           label: "Administrator Password",
                           required: 1
                        }
                     },
                     {
                        element: "password",
                        data: {
                           name: "confirm_password",
                           label: "Confirm Password",
                           required: 1
                        }
                     },
                     {
                        element: "select",
                        data: {
                           name: "time_zone",
                           type: "text",
                           label: "Time Zone",
                           options: this.time_zone_list,
                        }
                     },
                  ]
               },
               {
                  element: "button",
                  data: {
                     name: "button_install",
                     type: "primary",
                     label: "Install",
                     action: "install",
                     size: "lg",
                     class: "btn-block"
                  }
               }
            ]
         },
         __DOCUMENT_NAME__: "Installer"
      }
   }

   get time_zone_list(){
      return [
         {option: "Africa/Abidjan", value: "Africa/Abidjan"},
         {option: "Africa/Accra", value: "Africa/Accra"},
         {option: "Africa/Addis_Ababa", value: "Africa/Addis_Ababa"},
         {option: "Africa/Algiers", value: "Africa/Algiers"},
         {option: "Africa/Asmara", value: "Africa/Asmara"},
         {option: "Africa/Asmera", value: "Africa/Asmera"},
         {option: "Africa/Bamako", value: "Africa/Bamako"},
         {option: "Africa/Bangui", value: "Africa/Bangui"},
         {option: "Africa/Banjul", value: "Africa/Banjul"},
         {option: "Africa/Bissau", value: "Africa/Bissau"},
         {option: "Africa/Blantyre", value: "Africa/Blantyre"},
         {option: "Africa/Brazzaville", value: "Africa/Brazzaville"},
         {option: "Africa/Bujumbura", value: "Africa/Bujumbura"},
         {option: "Africa/Cairo", value: "Africa/Cairo"},
         {option: "Africa/Casablanca", value: "Africa/Casablanca"},
         {option: "Africa/Ceuta", value: "Africa/Ceuta"},
         {option: "Africa/Conakry", value: "Africa/Conakry"},
         {option: "Africa/Dakar", value: "Africa/Dakar"},
         {option: "Africa/Dar_es_Salaam", value: "Africa/Dar_es_Salaam"},
         {option: "Africa/Djibouti", value: "Africa/Djibouti"},
         {option: "Africa/Douala", value: "Africa/Douala"},
         {option: "Africa/El_Aaiun", value: "Africa/El_Aaiun"},
         {option: "Africa/Freetown", value: "Africa/Freetown"},
         {option: "Africa/Gaborone", value: "Africa/Gaborone"},
         {option: "Africa/Harare", value: "Africa/Harare"},
         {option: "Africa/Johannesburg", value: "Africa/Johannesburg"},
         {option: "Africa/Juba", value: "Africa/Juba"},
         {option: "Africa/Kampala", value: "Africa/Kampala"},
         {option: "Africa/Khartoum", value: "Africa/Khartoum"},
         {option: "Africa/Kigali", value: "Africa/Kigali"},
         {option: "Africa/Kinshasa", value: "Africa/Kinshasa"},
         {option: "Africa/Lagos", value: "Africa/Lagos"},
         {option: "Africa/Libreville", value: "Africa/Libreville"},
         {option: "Africa/Lome", value: "Africa/Lome"},
         {option: "Africa/Luanda", value: "Africa/Luanda"}
      ]
   }

   get form_connect_structure(){
      return [
         {
            identifier: "form_connect",
            element: "card",
            data: {
               label: "Your Server Database Data",
            },
            elements: [
               {
                  element: "input",
                  data: {
                     name: "host",
                     label: "Host (ej: localhost)",
                     required: 1
                  }
               },
               {
                  element: "input",
                  data: {
                     name: "user",
                     label: "User (ej: root)",
                     required: 1
                  }
               },
               {
                  element: "input",
                  data: {
                     name: "port",
                     label: "Port (ej: 3306)",
                     required: 1
                  }
               },
               {
                  element: "password",
                  data: {
                     name: "password",
                     label: "Password (ej: root)",
                     required: 1
                  }
               },
               {
                  element: "select",
                  data: {
                     name: "time_zone",
                     type: "text",
                     label: "Time Zone",
                     options: this.time_zone_list,
                  }
               },
            ]
         },
         {
            element: "button",
            data: {
               name: "button_connect",
               type: "primary",
               label: "Connect",
               action: "connect",
               size: "lg",
               class: "btn-block"
            }
         }
      ]
   }

   async __data_connect__() {
      const db_config = await file_manage.get_config_file('db.config');
      db_config.doc_structure = JSON.stringify(this.form_connect_structure)
      return {
         __DOCTYPE__: {
            doc_structure: "",
            name: "Installer",
            STRUCTURE: this.form_connect_structure
         },
         __DOCUMENT_NAME__: "Installer",
         __DOCUMENT__: db_config
      }
   }

   get form_connect_fields(){
      return this.form_connect_structure.find(e => e.identifier === "form_connect").elements.map(e => e.data.name);
   }

   async set_db_config() {
      const db_config = file_manage.get_config_file('db.config');

      db_config.database = 'db_' + sha1(this.company);

      env.db_config = db_config;
      return await file_manage.set_config_file('db.config', db_config);
   }

   async #make_core_table() {
      const data = await file_manage.get_config_file('installer','apps/' + this.app_name);
      const core_table = data.Document.Document;

      await this.#insert_record("Document", core_table, "loopar/modules/core")
   }

   async #make_doctypes() {
      const data = await file_manage.get_config_file('installer','apps/' + this.app_name);
      const doc_types = Object.values(data.Document || {}).sort((a, b) => a.id - b.id);

      for (const doctype of doc_types) {
         if(doctype.is_deleted === 1) continue;
         await this.#insert_record('Document', doctype, "loopar/modules/core");
      }
   }

   async #insert_record(table, data, by_file = null) {
      if(await loopar.db.get_value(table, 'name', data.name, null, null)){
         const to_update_doc = await loopar.get_document(table, data.name, data, by_file);
         to_update_doc.save({validate: false});
      }else{
         const document = await loopar.new_document(table, data, null, by_file);
         await document.save({validate: false});
      }
   }

   async #insert_app_data(installing = true) {
      if(this.app_name === "loopar" && installing){
         const user_data = {name: "Administrator", email: this.email, password: this.admin_password, confirm_password: this.confirm_password}

         await this.#insert_record('User', user_data);
      }

      const data = file_manage.get_config_file('installer', 'apps/' + this.app_name);

      for (const [doc_name, records] of Object.entries(data)) {
         if(doc_name !== 'Document') {
            for (const record of Object.values(records).sort((a, b) => a.id - b.id)) {
               await this.#insert_record(doc_name, record);
            }
         }
      }
   }

   check_if_app_exists() {
      return file_manage.get_config_file("installer", path.join("apps", this.app_name), false);
   }

   async install() {
      console.warn("Installing " + this.app_name);
      loopar.installing = true;
      
      if(this.app_name === 'loopar') {
         if(!this.check_if_app_exists()){
            await loopar.git().clone("https://github.com/alphabit-technology/loopar.git");
         }

         await this.set_db_config();
         await loopar.db.initialize();
         await loopar.db.alter_schema();

         await this.#make_core_table();
         console.log("make_core_table")
      }

      await this.#make_doctypes();
      await this.#insert_app_data();

      loopar.installing = false;
      return true;
   }

   async pull(repo) {
      const exist = await loopar.db.get_value('App', "name", this.app_name, null, null);
      const app_file = file_manage.get_config_file("installer", path.join("apps", this.app_name));

      //console.log("Pulling " + this.app_name)
      loopar.validateGitRepository(repo || app_file.App[this.app_name].git_repo);

      if(!exist && this.app_name !== "loopar"){
         loopar.throw(`App ${this.app_name} is not installed, please install it first`);
         return;
      }

      return new Promise((resolve, reject) => {
         loopar.git(this.app_name).pull(async (err, update) => {
            err && loopar.throw(err);

            if (update && update.summary.changes) {
               await this.update();
               resolve(true);
            }else{
               loopar.throw(`App ${this.app_name} is already updated`);
            }
         });
      });
   }

   async update() {
      loopar.installing = true;

      await this.#make_doctypes();
      await this.#insert_app_data(false);

      loopar.installing = false;
      return true;
   }

   async connect() {
      const db_config = await file_manage.get_config_file('db.config');

      Object.assign(db_config, Object.fromEntries(Object.entries(this).filter(([key]) => this.form_connect_fields.includes(key) && this[key])));

      await file_manage.set_config_file('db.config', db_config);

      env.db_config = db_config;

      await loopar.db.initialize();
      await loopar.make_config();

      if (await loopar.db.test_server()) {
         return true;
      } else {
         loopar.throw({
            message: `Could not connect to the database server<br><br>
If you are using a remote server, check that your firewall is configured properly.<br><br>
If you are using a local server, check that your server is running and that your credentials are correct.`
         });
      }
   }
}