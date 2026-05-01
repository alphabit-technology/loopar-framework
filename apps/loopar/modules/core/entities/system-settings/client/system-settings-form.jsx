
'use strict';

import FormContext from '@context/form-context';
import ThemeCustomizer from "./src/theme"

export default class SystemSettingsForm extends FormContext {
  constructor(props) {
      super(props);
  }

  render(){
    return super.render(null, {
      theme: ThemeCustomizer
    })
  }
}
