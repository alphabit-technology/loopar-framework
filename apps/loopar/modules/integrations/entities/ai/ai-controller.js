
'use strict';

import { SingleController, loopar } from 'loopar';

export default class AIController extends SingleController {
  constructor(props) {
    super(props);
  }

  async actionPrompt() {
    const ai = await loopar.getDocument("AI");
    const { prompt, document_type } = this.body || {};

    return await ai.prompt({ prompt, document_type });
  }
}
