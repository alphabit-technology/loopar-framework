import { fileManage, loopar } from 'loopar';

const BuildList = async (appData, refs) => {
  const ListInstaller = {};
  const evaluated = {}

  const build = async (appData, refs) => {
    refs = refs || Object.keys(appData);

    for (const e of refs) {
      if(evaluated[e]) continue;
      evaluated[e] = true;

      const ent = appData[e];
      const {requires} = ent;

      if(requires && Array.isArray(requires) && requires.length > 0){
        await build(appData, requires);
      }

      if(ListInstaller[e]) continue;
      delete ent.requires
      ListInstaller[e] = ent.doc || ent
    }
  }

  await build(appData, refs);

  return ListInstaller;
}

class InstallerBuilder {
  constructor(app, version) {
    this.app = app;
    this.version = version;
    this.modules = [];
    this.entities = [];
    this.entitiesName = [];
    this.Queues = {};
    this.PostInstallerQueue = {}
  }

  async initialize() {
    await this.loadModules();
    await this.loadEntities();
  }

  async loadModules() {
    this.modules = await loopar.db.getAll(
      "Module", 
      ["name"], 
      { app_name: this.app }
    ).then(modules => modules.map(m => m.name));
  }

  loadEntities() {
    this.entities = loopar.getEntities(this.app).map(entity => {
      const parent = loopar.getRef(entity.__ENTITY__);
      return {
        sortedId: parseInt(`${parent?.id || ''}${entity.id}`),
        id: parseInt(entity.id),
        __ENTITY__: entity.__ENTITY__ || "Entity",
        __NAME__: entity.name,
        __APP__: entity.__APP__,
        __ROOT__: entity.entityRoot,
      };
    }).sort((a, b) => a.sortedId - b.sortedId);

    this.entitiesName = this.entities.map(e => e.__NAME__);
  }

  fieldIsModel(field) {
    if ([SELECT, FORM_TABLE].includes(field.element) && field.data.options && typeof field.data.options === 'string') {
      const options = (field.data.options || "").split("\n");
      return !(options.length > 1 || options[0] === "");
    }
    return false;
  }

  findFieldInStructure(elements, criteria) {
    for (const el of elements) {
      if (criteria(el)) {
        return el.data?.name || true;
      }
      
      if (Array.isArray(el?.elements)) {
        const found = this.findFieldInStructure(el.elements, criteria);
        if (found) return found;
      }
    }
    return false;
  }

  checkIfHaveAnEntity(els, entityName) {
    return this.findFieldInStructure(els, el => 
      el.element === SELECT && el?.data?.options === entityName
    );
  }

  async buildDocuments(entity) {
    const ref = loopar.getRef(entity.__NAME__);
    
    if (!ref || ref.is_child || ref.is_single) return;
    
    const include_in_installer = await loopar.db.getValue(
      entity.__ENTITY__ || "Entity", 
      "include_in_installer", 
      entity.__NAME__
    );

    if (include_in_installer !== 1) return;
    
    const data = fileManage.getConfigFile(ref.__NAME__, ref.__ROOT__);
    
    const filters = {};
    const haveAnModule = this.checkIfHaveAnEntity(
      loopar.utils.JSONparse(data.doc_structure, []),
      "Module"
    );
    const haveAnApp = this.checkIfHaveAnEntity(
      loopar.utils.JSONparse(data.doc_structure, []),
      "App"
    );

    if (haveAnModule || haveAnApp) {
      if (haveAnModule) {
        filters[loopar.db.Op.or] = [
          {
            name: { [loopar.db.Op.notIn]: [...this.entitiesName] },
            [haveAnModule]: { [loopar.db.Op.in]: this.modules }
          },
          {
            name: { [loopar.db.Op.in]: [...this.entitiesName] }
          }
        ];
      }

      if (haveAnApp) {
        filters[haveAnApp] = this.app;
      }
    } else {
      if (!this.entitiesName.includes(entity.__NAME__)) return;
    }

    data.name === "Module" && (filters.app_name = this.app);
    data.name === "App" && (filters.name = this.app);

    const docs = await loopar.db.getAll(ref.__NAME__, ["*"], filters);

    for (const doc of docs.sort((a, b) => a.id - b.id).filter(d => d.name !== "Entity")) {
      await this.queue(ref, doc);
    }
  }

  async getRequires(entity, doc) {
    const reqs = [];
    
    const checkRequires = async (els, d) => {
      for (const el of els) {
        if (el.data && this.fieldIsModel(el)) {
          const relatedEntity = loopar.getRef(el.data.options);
          
          if (!relatedEntity) continue;

          await this.queueEntity(relatedEntity);

          if (relatedEntity.__NAME__ != doc.name && doc && doc.name == "Entity") {
            reqs.push(`${relatedEntity.__ENTITY__}:${relatedEntity.__NAME__}`);
          }

          if (el.element == SELECT && d && el.data.options != doc.name) {
            const relatedDoc = await loopar.getDocument(
              el.data.options, 
              d[el.data.name], 
              null, 
              { ifNotFound: false }
            );
            
            if (relatedDoc) {
              const rawValues = await relatedDoc.rawValues();
              reqs.push(`${relatedEntity.__NAME__}:${rawValues.name}`);
              await this.queue(relatedEntity, rawValues);
            } else {
              console.log(['relatedDoc not found', entity.__NAME__, el.data.options, d[el.data.name]]);
            }
          }

          if (el.element == FORM_TABLE && d) {
            const childs = d[el.data.name] || [];

            for(const item of childs){
              await postInstaller.getRequires(relatedEntity, item);
            }

            postInstaller.PostInstallerQueue[`${entity.__NAME__}:${d.name}`] = this.Queues[`${entity.__NAME__}:${d.name}`] ? 'link' : d
          }
        }

        if (Array.isArray(el?.elements)) {
          await checkRequires(el.elements, d);
        }
      }
    };

    if (this.Queues[`${entity.__NAME__}:${doc?.__name}`]) return;

    const entityData = await fileManage.getConfigFile(entity.__NAME__, entity.__ROOT__);

    await checkRequires(loopar.utils.JSONparse(entityData.doc_structure, []), doc);

    if (entity.__NAME__ != entity.__ENTITY__) {
      reqs.unshift(`${entity.__ENTITY__}:${entity.__NAME__}`);
    }

    await this.queueEntity(entity);
    return reqs;
  }

  async queueEntity(entity) {
    const constructor = loopar.getRef(entity.__ENTITY__ || "Entity");
    if (this.Queues[`${constructor.__NAME__}:${entity.__NAME__}`]) return;
    
    this.Queues[`${constructor.__NAME__}:${entity.__NAME__}`] = {};

    if (loopar.utils.compare(entity.__APP__, this.app)) {
      const ent = await loopar.getDocument(
        constructor.__NAME__ || "Entity", 
        entity.__NAME__, 
        {}, 
        { ifNotFound: false, parse: true }
      );

      if(ent) {
        const Doc = await ent.rawValues();
        const requires = await this.getRequires(constructor, Doc);
        
        if (constructor.__NAME__ !== entity.__NAME__ && constructor.__NAME__ !== "Entity") {
          requires.unshift(`${constructor.__ENTITY__}:${constructor.__NAME__}`);
        }

        this.Queues[`${constructor.__NAME__}:${entity.__NAME__}`] = {
          requires: Array.from(new Set(requires)),
          root: entity.__ROOT__
        };
      }else{
        console.log(["ENt", ent])
      }
    } else {
      this.Queues[`${constructor.__NAME__}:${entity.__NAME__}`] = {
        requires: [],
        app: entity.__APP__
      };
    }

    await this.buildDocuments(entity);
  }
  
  async queue(Entity, Doc) {
    const isEntity = loopar.getRef(Doc?.name);

    if (isEntity && isEntity.__ENTITY__ == Entity.__NAME__) {
      return this.queueEntity(isEntity);
    }

    if (this.Queues[`${Entity.__NAME__}:${Doc?.name}`]) return;

    this.Queues[`${Entity.__NAME__}:${Doc?.name}`] = {};
    const requires = await this.getRequires(Entity, Doc);
    this.Queues[`${Entity.__NAME__}:${Doc?.name}`] = {
      requires: Array.from(new Set(requires)),
      doc: Doc
    };
  }

  async build() {
    await this.initialize();

    for (const entity of this.entities) {
      await this.queueEntity(entity, null);
    }

    const app = await loopar.getDocument("App", this.app);
    
    await this.queue(loopar.getRef("App"), await app.rawValues());

    this.Queues = { ...this.Queues, ...Object.entries(postInstaller.Queues).reduce((acc, [key, value]) => {
      if(this.Queues[key]) return acc;
      acc[key] = value;
      return acc;
    }, {})};

    await this.buildFile();
  }

  async buildFile(){
    const entitiesStructure = {
      App: {
        name: this.app,
        version: this.version,
      },
      documents: await BuildList(this.Queues),
      postInstaller: postInstaller.PostInstallerQueue
    };

    await fileManage.setConfigFile(
      'installer', 
      entitiesStructure,
      loopar.makePath('apps', this.app)
    );
  }
}

const postInstaller = new InstallerBuilder();;

export async function buildInstaller({app, version}) {
  const installer = new InstallerBuilder(app, version);
  postInstaller.app = app;
  postInstaller.version = version;
  return await installer.build();
}