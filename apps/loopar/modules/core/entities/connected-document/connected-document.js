
'use strict';

import { BaseDocument, loopar } from 'loopar';

export default class ConnectedDocument extends BaseDocument {
    constructor(props) {
        super(props);
    }

    async save() {
        const exist = await loopar.db.getValue("Connected Document", "name", this.name, { distinctToId: this.id, includeDeleted: true });

        if (exist) {
            await loopar.db.setValue("Connected Document", "__document_status__", "Active", this.name);

            /*const connected =  await loopar.getDocument(this.name);

            if(connected){
                await this.values().forEach(async (value, key) => {
                    connected[key] = value;
                });
                
                await connected.save();
            }*/

            return true;
        } else {
            return await super.save();
        }
    }
}