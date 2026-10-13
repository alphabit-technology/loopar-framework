'use strict';

import { PageController, loopar } from 'loopar';

export default class AnalyticsDashboardController extends PageController {
  constructor(props) {
    super(props);
  }

  async actionView(){
    const view = await loopar.newDocument("Analytics Dashboard")
    // loopar.call sends these as query params (this.query), not in the body.
    const input = { ...(this.data || {}), ...(this.query || {}) };
    const days = Math.max(1, Math.min(365, Number(input.days) || 30));
    view.days = days;
    view.site = String(input.site || '');

    if(this.method == AJAX && this.preloaded=='true'){
      return {
        instance: this.getInstance(),
        data: await view.data()
      }
    }

    return this.render(view)
  }
}