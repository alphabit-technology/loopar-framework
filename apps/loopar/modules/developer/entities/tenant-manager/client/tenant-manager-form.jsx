
'use strict';

import FormContext from '@context/form-context';
import loopar from "loopar";

export default class TenantManagerForm extends FormContext {
  notRequireChanges = true;
  
  constructor(props){
    super(props);
  }

  async setOnProduction(){
    loopar.confirm(`Are you sure you want to set ${this.name} on production?`, () => {
      loopar.api.post("Tenant Manager", "setOnProduction", {
        query: { name: this.name },
        success: () => {
          loopar.refresh();
        },
        error: (message) => {
          loopar.throw(message);
        },
      });
    });
  }
}