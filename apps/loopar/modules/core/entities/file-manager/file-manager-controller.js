
'use strict';

import { BaseController, loopar } from 'loopar';

export default class FileManagerController extends BaseController {
  constructor(props) {
    super(props);
  }

  async actionUpload() {
    const files = this.req.files || [];
    const filesNames = [];

    if (!files.length) {
      return loopar.throw('No files uploaded');
    }

    for (const file of files) {
      const fileManager = await loopar.newDocument("File Manager");
      fileManager.reqUploadFile = file;
      await fileManager.save();
      filesNames.push(fileManager.name);
    }

    return this.success(filesNames.join(', ') + ' uploaded successfully');
  }

  async actionUpdate() {
    const document = await loopar.db.count("File Manager", this.name)
      ? await loopar.getDocument("File Manager", this.name, this.data)
      : await loopar.newDocument("File Manager", this.hasData() ? this.data : null);

    const file = this.__REQ_FILES__ ? this.__REQ_FILES__[0] : null

    if (file) {
      document.reqUploadFile = file;
      document.name = file.originalname || file.name;
      document.size = file.size;
      document.type = file.type;
      document.extention = file.originalname.split('.').pop();
    }else{
      document.name = this.name;
      document.app = this.app;
      document.visible = "public";

      if(!document.loadFile(this.__REQ_FILES__ ? this.__REQ_FILES__[0] : null)){
        return this.notFound(`File [${this.name}] not found`);
      }
    }

    document.__document_status__ = "Active";

    if (this.hasData()) {
      await document.save();

      if(this.name !== document.name) {
        return this.redirect("update?name=" + document.name);
      }
      
      return await this.success(
        `File ${document.name} saved successfully`, { name: document.name }
      );
    } else {
      return await this.render({ ...await document.__meta__(), ...this.response || {} });
    }
  }

  async actionDelete() {
    const fileManager = await loopar.newDocument("File Manager");

    fileManager.name = this.file_name;
    fileManager.app = this.app;
    await fileManager.delete();

    return this.success('File deleted successfully');
  }

  async actionView() {
    this.client = "view";
    if(!this.name) {
      return loopar.throw("File name is required");
    }

    const fileManager = await loopar.newDocument("File Manager");
    fileManager.name = this.name;
    fileManager.app = this.app;
    if(await fileManager.loadFile()){
      return await this.render(await fileManager.__meta__());
    }else{
      return await this.notFound(`File [${this.name}] not found`);
    }
  }
}