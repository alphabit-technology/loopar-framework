'use strict';

import { BaseDocument, loopar } from 'loopar';
import OpenAI from "openai";
import {AIPrompt} from "loopar";

export default class GPT extends BaseDocument {
  constructor(props) {
    super(props);
  }

  validateSettings() {
    !this.api_key && loopar.throw(`Please set the API key in the settings of the GPT model<br/><br/><a href="/desk/Integrations/GPT/update">Chat GPT Api Settings</a>`);
  }

  async prompt(data) {
    this.validateSettings();

    const testModel = await loopar.getDocument("AI Model", "GPT-5")
    const { prompt, document_type } = data;

    const openai = new OpenAI({
      apiKey: this.api_key,
    });

    const p = AIPrompt(prompt, document_type);

    const response = await openai.responses.create({
      model: this.model,
      ///instructions: p.system.content,
      //input: p.user.content,
      input: [
        p.system,
        { "role": "user", "content": p.user.content }
      ],
      temperature: this.temperature || 1,
      top_p: this.top_p || 1,
    });

    return response.output_text;
  }
}