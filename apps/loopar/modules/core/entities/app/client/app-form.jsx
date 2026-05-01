'use strict';

import FormContext from '@context/form-context';
import {loopar} from 'loopar';
import { Button } from '@cn/components/ui/button';
import { PlusIcon } from 'lucide-react';

export default class AppForm extends FormContext {
  /**
   * @type {FormField} is a field of the form, described in the meta.json file
   */
  web_app_settings = {}; /** @type {FormContext} will be set on load document*/

  get webAppSettigs() {
    return this.web_app_settings;
  }

  constructor(props) {
    super(props);

    this.state = {
      ...this.state,
      loaded: false,
    };
  }

  setCustomActions() {
    super.setCustomActions();

    const setIncrementVersion = (type) => {
      this.setCustomAction(`increment${type}`, (
        <Button
          variant="link"
          onClick={(e) => {
            e.preventDefault();
            loopar.confirm(`Are you sure you want to increment the ${type} version of the app ${this.getValue("name")}?`, () => {
              loopar.api.post("App", `increment${type}`, {
                query: { name: this.getValue('name') },
                success: (result) => {
                  this.setValue('version', result.version);
                }
              });
            });
          }}
        >
          <PlusIcon className="mr-2" />
          {type}
        </Button>
      ))
    }

    setIncrementVersion('Patch');
    setIncrementVersion('Minor');
    setIncrementVersion('Major'); 
  }

  componentDidMount() {
    super.componentDidMount();
    this.setCustomActions();

    /*this.on("type", "change", (e) => {
      this.setFieldDf('web_app_settings', 'hidden', e.target.value === 'Web App' ? 0 : 1);
    });

    this.on("has_footer", "change", (e) => {
      this.setFieldDf('footer', 'hidden', e.target.value ? 0 : 1);
    });

    this.on("has_copyright", "change", (e) => {
      this.setFieldDf('copyright', 'hidden', e.target.value ? 0 : 1);
    });

    setTimeout(() => {

    this.setState({loaded: true});
    })*/

    /**To prevent screen flashing on initial load */
    /*setTimeout(() => {
      super.componentDidMount();
      //this.context.setLoaded(true);

      this.initScroll();
    }, 0);*/
  }
}