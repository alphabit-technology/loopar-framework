
'use strict';

import FormContext from '@context/form-context';
import {loopar} from "loopar";

export default class EmailSettingsForm extends FormContext {
    constructor(props){
        super(props);
    }

    testConnection(){
      this.send({ action: "testConnection", notRequireChanges: true, query: this.getFormValues()}, (r) => {
        console.log(["Response", r]);
        if(r.success){
          loopar.notify("Connection successful", "success");
        } else {
          loopar.notify(r.message, "error", "Connection failed");
        }
      }, (error) => {
        console.log("Error", error);
        loopar.notify("Connection failed", "error");
      });
    }
}