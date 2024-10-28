import path from "path";
import { loopar, fileManage } from "loopar";

export default class CoreInstaller {
  /**
   * snakeCase because is the same property name in the database
   */
  app_name = "loopar";

  constructor(props) {
    Object.assign(this, props);
  }

  async __dataInstall__() {
    const STRUCTURE = [
      {
        element: "card",
        data: {
          name: "form_install",
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
        element: "panel",
        className: "pt-5",
        elements: [
          {
            element: "button",
            variant: "destructive",
            data: {
              name: "button_install",
              type: "primary",
              label: "Install",
              action: "install",
              variant: "destructive",
            }
          }
        ]
      }
    ]

    return {
      __ENTITY__: {
        doc_structure: JSON.stringify(STRUCTURE),
        STRUCTURE,
        name: "Installer",
      },
      __DOCUMENT_NAME__: "Installer",
      __DOCUMENT__: {}
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
            element: "select",
            data: {
              name: "dialect",
              label: "Database Type",
              required: 1,
              options: [
                { option: "mysql", value: "mysql" },
                { option: "mariadb", value: "mariadb" },
                { option: "postgres", value: "postgres" },
                { option: "sqlite", value: "sqlite" },
                { option: "mssql", value: "mssql" },
              ],
            }
          },
          /*{
            element: "input",
            data: {
              name: "client",
              label: "Client (ej: mysql)",
              required: 1
            }
          },*/
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
        element: "panel",
        className: "pt-5",
        elements: [
          {
            element: "button",
            variant: "destructive",
            data: {
              name: "button_connect",
              type: "primary",
              label: "Connect",
              action: "connect",
              size: "lg",
              variant: "destructive"
            }
          }
        ]
      }
    ]
  }

  async __dataConnect__() {
    const dbConfig = await fileManage.getConfigFile('db.config');
    dbConfig.doc_structure = JSON.stringify(this.formConnectStructure)
    return {
      __ENTITY__: {
        doc_structure: JSON.stringify(this.formConnectStructure),
        STRUCTURE: this.formConnectStructure,
        name: "Installer"
      },
      __DOCUMENT_NAME__: "Installer",
      __DOCUMENT__: dbConfig
    }
  }

  get formConnectFields() {
    return this.formConnectStructure.find(e => e.identifier === "form_connect").elements.map(e => e.data.name);
  }

  async getDocumentData(document) {
    const ref = loopar.getRef(document);

    return await fileManage.getConfigFile(document, ref.entityRoot);
  }

  getNameToFileName(name) {
    return loopar.utils.decamelize(name.replaceAll(/\s/g, ''), { separator: '-' });
  }

  checkIfAppExists() {
    return fileManage.existFileSync(loopar.makePath('apps', this.app_name, 'installer.js'));
  }

  async restartInstaller() {
    const installerRoute = loopar.makePath('apps', this.app_name, 'installer.js');

    if (fileManage.existFileSync(installerRoute)) {
      const InstallerModel = await fileManage.importClass(installerRoute);
      new InstallerModel.default(this).install();
    } else {
      loopar.throw(`App ${this.app_name} not provide a installer model`);
    }
  }

  async unInstall() {
    loopar.installingApp = this.app_name;
    if (this.app_name === 'loopar') {
      loopar.throw("You can't uninstall app Loopar");
    }

    const moduleRoute = loopar.makePath('apps', this.app_name);
    const appData = await fileManage.getConfigFile('installer', moduleRoute);
    const ownEntities = loopar.getEntities(this.app_name);
    const ownEntitiesNames = ownEntities.map(e => e.name);

    const deleteDocuments = async (entity) => {
      const deleteDocument = async (ent, document) => {
        if (document.__document_status__ === "Deleted") return;
        if (!await loopar.db.count(ent.name, document.name)) return;

        await deleteDocuments(document);

        if (document.path && !ownEntitiesNames.includes(document.name)) return;

        console.warn("Uninstalling:", ent.name, document.name);
        await loopar.deleteDocument(ent.name, document.name, { updateInstaller: true, sofDelete: false, force: true, updateHistory: false });
      }

      for (const document of (entity.documents || []).sort((a, b) => b.id - a.id)) {
        await deleteDocument(entity, document);
      }
    }

    for(const entity of appData.documents){
      await deleteDocuments(entity);
    }

    loopar.installingApp = null;
    console.log(`App ${this.app_name} uninstalled successfully!`);
    return `App ${this.app_name} uninstalled successfully!`;
  }

  async install() {
    loopar.installingApp = this.app_name;

    if (this.app_name === 'loopar') {
      if (!this.checkIfAppExists()) {
        await loopar.git().clone("https://github.com/alphabit-technology/loopar.git");

        this.restartInstaller();
        return;
      }
    }

    await this.installData();

    loopar.installingApp = null;

    await loopar.initialize();
    await loopar.server.exposeClientAppFiles(this.app_name);
    return "App installed successfully!";
  }

  getAppFromData(data, modu) {
    const modules = data.Module.documents;
    return Object.values(modules).find(e => e.name === modu).app_name;
  }

  async installData() {
    console.log("Installing App DATA", this.app_name);
    const moduleRoute = loopar.makePath('apps', this.app_name);
    const appData = (await fileManage.getConfigFile('installer', moduleRoute)).documents;
    const ownEntities = loopar.getEntities(this.app_name);

    const buildEntity = async (entity, data) => {
      if(!ownEntities.find(e => e.name === data.name)) return;
      
      const E = await loopar.newDocument(entity, data);
      await E.save({save:false, validate:false});
    }

    const insertDocuments = async (entity) => {
      const insertDocument = async (ent, document) => {
        for (const req of (document.requires || [])) {
          const ref = loopar.getRef(document.name);

          if (ref) {
            for (const doc of (req.documents || [])) {
              await buildEntity(ref.__ENTITY__, doc);
            }
          } else {
            await insertDocuments(req);
          }
        }

        const data = document.path ? await fileManage.getConfigFile(document.name, document.path) : document.data;
        if(!data) return;
        if (data.__document_status__ && data.__document_status__ === "Deleted") return;
        
        if (!await loopar.db.count(ent.name, document.name)){
          const doc = await loopar.newDocument(ent.name, { ...data, __document_status__: "Active" });
          await doc.save({ validate: false });
        }

        for (const child of (document.documents || [])) {
          await insertDocument(document, child);
        }
      }

      const ref = loopar.getRef(entity.name);
      if (ref) {
        const data = await fileManage.getConfigFile(ref.__NAME__, ref.entityRoot);
        await buildEntity(ref.__ENTITY__, data);
      }

      for (const document of (entity.documents || []).sort((a, b) => a.id - b.id)) {
        console.log(["Inserting Document", entity.name, document.name])
        await insertDocument(entity, document);
      }
    }

    for (const entity of appData) {
      await insertDocuments(entity);
    }

    return `App ${this.app_name} installed successfully!`;
  }

  async pull(repo) {
    const exist = await loopar.db.getValue('App', "name", this.app_name, null, null);
    const app_file = fileManage.getConfigFile("installer", path.join("apps", this.app_name));

    loopar.validateGitRepository(this.app_name, repo || app_file.App[this.app_name].git_repo);

    if (!exist) {
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
    loopar.installingApp = this.app_name;

    await this.installData();

    loopar.installingApp = null;
    return true;
  }

  async connect() {
    const dbConfig = await fileManage.getConfigFile('db.config');
    const originalConfig = dbConfig.connection || {};
    const connection = Object.fromEntries(Object.entries(this).filter(([key]) => this.formConnectFields.includes(key) && this[key]));

    console.log("Connecting to the database server", originalConfig, connection);
    Object.assign(dbConfig, {
      dialect: connection.dialect,
      client: connection.client,
      connection: Object.assign(originalConfig, connection)
    });

    await fileManage.setConfigFile('db.config', dbConfig);

    env.dbConfig = dbConfig;
    await loopar.db.initialize();

    if (await loopar.db.testServer()) {
      await loopar.initialize();
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