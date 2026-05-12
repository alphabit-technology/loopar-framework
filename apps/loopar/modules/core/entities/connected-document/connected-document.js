
'use strict';

import { BaseDocument, loopar, Op } from 'loopar';

export default class ConnectedDocument extends BaseDocument {
    constructor(props) {
        super(props);
    }

    async save() {
        const filter = this.id
            ? { name: this.name, id: { [Op.ne]: this.id } }
            : { name: this.name };

        const exist = await loopar.db.getValue("Connected Document", "name", filter, { includeDeleted: true });

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