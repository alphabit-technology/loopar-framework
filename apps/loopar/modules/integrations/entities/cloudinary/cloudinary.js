'use strict';

import { BaseStorage, CloudinaryDriver } from 'loopar';

export default class Cloudinary extends BaseStorage {
  constructor(props) {
    super(props);
  }

  async buildDriver() {
    return new CloudinaryDriver({
      provider_id: this.cloud_name,
      access_key: this.api_key,
      secret_key: this.api_secret,
      folder_root: this.folder_root || 'loopar',
    });
  }
}
