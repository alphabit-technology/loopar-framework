
'use strict';

import { BaseController, loopar } from 'loopar';

export default class ViewerController extends BaseController {
    enabledActions = ['view'];
    constructor(props) {
        super(props);
    }

    async actionView() {
        const document = await loopar.getDocument(this.document, this.name);
        return await this.render(await document.__meta__());
    }

    async actionList() {
        const list = await loopar.getList(this.document);
        return await this.render(list);
    }
}