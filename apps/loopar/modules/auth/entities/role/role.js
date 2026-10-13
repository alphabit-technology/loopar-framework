
'use strict';

import {BaseDocument, loopar} from 'loopar';

export default class Role extends BaseDocument {
    constructor(props){
        super(props);
    }

    /**
     * System roles are seeded by installers; deleting one by hand would just
     * get it re-seeded. The exception is uninstalling the app that owns it.
     */
    async delete(...args) {
        const uninstallingOwner = this.app && loopar.installingApp === this.app;
        if (loopar.utils.trueValue(this.is_system_role) && !uninstallingOwner) {
            loopar.throw(`Role "${this.name}" is a system role and cannot be deleted. Disable it instead.`);
        }
        return super.delete(...args);
    }
}