
'use strict';

import {BaseController} from 'loopar';

export default class AIModelController extends BaseController {
    constructor(props){
        super(props);
    }

    async actionPrompt() {
        const gpt = await loopar.getDocument("AI Model", this.name);

        const data = this.data;
        const r = await gpt.prompt(data);

        return await this.success(r);
    }
}