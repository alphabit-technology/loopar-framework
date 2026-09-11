
'use strict';

import {BaseDocument, loopar} from 'loopar';

export default class Role extends BaseDocument {
    constructor(props){
        super(props);
    }

    /** System roles are seeded by installers; deleting one would just get it re-seeded. */
    async delete(...args) {
        if (loopar.utils.trueValue(this.is_system_role)) {
            loopar.throw(`Role "${this.name}" is a system role and cannot be deleted. Disable it instead.`);
        }
        return super.delete(...args);
    }
}