
'use strict';

import { SingleController, loopar } from 'loopar';

export default class GPTController extends SingleController {
  constructor(props) {
    super(props);
  }

  async actionPrompt() {
    const gpt = await loopar.getDocument("GPT");

    const { prompt, document_type } = this.body || {};

    return await gpt.prompt({ prompt, document_type });
  }
}