'use strict';

import { PageController, loopar } from 'loopar';

export default class AnalyticsDashboardController extends PageController {
  constructor(props) {
    super(props);
  }

  async actionView(){
    const view = await loopar.newDocument("Analytics Dashboard")
    const days = this.data?.days || 30;
    view.days = days;

    if(this.method == AJAX && this.preloaded=='true'){
      return {
        instance: this.getInstance(),
        data: await view.data()
      }
    }

    return this.render(view)
  }
}