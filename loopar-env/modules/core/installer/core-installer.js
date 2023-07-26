import path from "path";
import { Helpers, loopar, fileManage } from "loopar-env";

export default class CoreInstaller {
   /**
    * snakeCase because is the same property name in the database
    */
   app_name = "loopar";

   constructor(props) {
      Object.assign(this, props);
   }

   async __dataInstall__() {
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
                           options: this.timeZoneList,
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
         __documentName__: "Installer"
      }
   }

   get timeZoneList() {
      return [
         { option: "Africa/Abidjan", value: "Africa/Abidjan" },
         { option: "Africa/Accra", value: "Africa/Accra" },
         { option: "Africa/Addis_Ababa", value: "Africa/Addis_Ababa" },
         { option: "Africa/Algiers", value: "Africa/Algiers" },
         { option: "Africa/Asmara", value: "Africa/Asmara" },
         { option: "Africa/Asmera", value: "Africa/Asmera" },
         { option: "Africa/Bamako", value: "Africa/Bamako" },
         { option: "Africa/Bangui", value: "Africa/Bangui" },
         { option: "Africa/Banjul", value: "Africa/Banjul" },
         { option: "Africa/Bissau", value: "Africa/Bissau" },
         { option: "Africa/Blantyre", value: "Africa/Blantyre" },
         { option: "Africa/Brazzaville", value: "Africa/Brazzaville" },
         { option: "Africa/Bujumbura", value: "Africa/Bujumbura" },
         { option: "Africa/Cairo", value: "Africa/Cairo" },
         { option: "Africa/Casablanca", value: "Africa/Casablanca" },
         { option: "Africa/Ceuta", value: "Africa/Ceuta" },
         { option: "Africa/Conakry", value: "Africa/Conakry" },
         { option: "Africa/Dakar", value: "Africa/Dakar" },
         { option: "Africa/Dar_es_Salaam", value: "Africa/Dar_es_Salaam" },
         { option: "Africa/Djibouti", value: "Africa/Djibouti" },
         { option: "Africa/Douala", value: "Africa/Douala" },
         { option: "Africa/El_Aaiun", value: "Africa/El_Aaiun" },
         { option: "Africa/Freetown", value: "Africa/Freetown" },
         { option: "Africa/Gaborone", value: "Africa/Gaborone" },
         { option: "Africa/Harare", value: "Africa/Harare" },
         { option: "Africa/Johannesburg", value: "Africa/Johannesburg" },
         { option: "Africa/Juba", value: "Africa/Juba" },
         { option: "Africa/Kampala", value: "Africa/Kampala" },
         { option: "Africa/Khartoum", value: "Africa/Khartoum" },
         { option: "Africa/Kigali", value: "Africa/Kigali" },
         { option: "Africa/Kinshasa", value: "Africa/Kinshasa" },
         { option: "Africa/Lagos", value: "Africa/Lagos" },
         { option: "Africa/Libreville", value: "Africa/Libreville" },
         { option: "Africa/Lome", value: "Africa/Lome" },
         { option: "Africa/Luanda", value: "Africa/Luanda" }
      ]
   }

   get formConnectStructure() {
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
                     options: this.timeZoneList,
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

   async __dataConnect__() {
      const dbConfig = await fileManage.getConfigFile('db.config');
      dbConfig.doc_structure = JSON.stringify(this.formConnectStructure)
      return {
         __DOCTYPE__: {
            doc_structure: "",
            name: "Installer",
            STRUCTURE: this.formConnectStructure
         },
         __documentName__: "Installer",
         __DOCUMENT__: dbConfig
      }
   }

   get formConnectFields() {
      return this.formConnectStructure.find(e => e.identifier === "form_connect").elements.map(e => e.data.name);
   }

   async getDoctypeData(app, module, document) {
      const appRoot = loopar.makePath('apps', app);
      const documentRoot = loopar.makePath(appRoot, "modules", module, document);

      return await fileManage.getConfigFile(document, documentRoot);
   }

   getNameToFileName(name) {
      return Helpers.decamelize(name.replaceAll(/\s/g, ''), { separator: '-' });
   }

   async insertRecord(table, data, by_file = null) {
      if (await loopar.db.getValue(table, 'name', data.name, null, null)) {
         const to_update_doc = await loopar.getDocument(table, data.name, data, by_file);
         to_update_doc.save({ validate: false });
      } else {
         const document = await loopar.newDocument(table, data, null, by_file);
         await document.save({ validate: false });
      }
   }

   checkIfAppExists() {
      return fileManage.getConfigFile("installer", path.join("apps", this.app_name), false);
   }

   async restartInstaller() {
      const installerRoute = loopar.makePath('apps', this.app_name, 'installer.js');

      if (fileManage.existFileSync(installerRoute)) {
         const InstallerModel = await fileManage.import_file(installerRoute);
         new InstallerModel.default(this).install();
      } else {
         loopar.throw(`App ${this.app_name} not provide a installer model`);
      }
   }

   async install() {
      console.warn("Installing " + this.app_name);
      loopar.installing = true;

      if (this.app_name === 'loopar') {
         if (!this.checkIfAppExists()) {
            await loopar.git().clone("https://github.com/alphabit-technology/loopar.git");

            this.restartInstaller();
            return;
         }
      }
      await this.installData();

      loopar.installing = false;
      return true;
   }

   async installData() {
      const appRoot = loopar.makePath('apps', this.app_name);
      const appData = await fileManage.getConfigFile('installer', appRoot);

      for (const [doc_name, records] of Object.entries(appData).sort((a, b) => a[1].doctypeId - b[1].doctypeId)) {
         for (const document of Object.values(records.documents).sort(item => item.id - item.id)) {
            if (document.is_deleted === 1) continue;

            if (doc_name === "Document") {
               console.log("Installing Document")
               const doctype = await this.getDoctypeData(this.app_name, document.module, document.name);
               await this.insertRecord(doc_name, doctype, "loopar/modules/core");
            } else {
               await this.insertRecord(doc_name, document, "loopar/modules/core");
            }
         }
      }

      if (this.app_name === "loopar" && installing) {
         const userData = { name: "Administrator", email: this.email, password: this.admin_password, confirm_password: this.confirm_password }

         await this.insertRecord('User', userData);
      }
   }

   async pull(repo) {
      const exist = await loopar.db.getValue('App', "name", this.app_name, null, null);
      const app_file = fileManage.getConfigFile("installer", path.join("apps", this.app_name));

      //console.log("Pulling " + this.app_name)
      loopar.validateGitRepository(repo || app_file.App[this.app_name].git_repo);

      if (!exist && this.app_name !== "loopar") {
         loopar.throw(`App ${this.app_name} is not installed, please install it first`);
         return;
      }

      return new Promise((resolve, reject) => {
         loopar.git(this.app_name).pull(async (err, update) => {
            err && loopar.throw(err);

            if (update && update.summary.changes) {
               await this.update();
               resolve(true);
            } else {
               loopar.throw(`App ${this.app_name} is already updated`);
            }
         });
      });
   }

   async update() {
      loopar.installing = true;

      await this.installData();

      loopar.installing = false;
      return true;
   }

   async connect() {
      const dbConfig = await fileManage.getConfigFile('db.config');

      Object.assign(dbConfig, Object.fromEntries(Object.entries(this).filter(([key]) => this.formConnectFields.includes(key) && this[key])));

      await fileManage.setConfigFile('db.config', dbConfig);

      env.dbConfig = dbConfig;

      await loopar.db.initialize();
      await loopar.makeConfig();

      if (await loopar.db.testServer()) {
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