import {tenants} from "./tenant/tenant-builder.js"

const apps = tenants().filter(app => app.name === 'dev');

export { 
  apps
};