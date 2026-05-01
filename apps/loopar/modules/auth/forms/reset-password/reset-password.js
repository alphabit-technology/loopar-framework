
'use strict';

import {BaseDocument} from 'loopar';

export default class ResetPassword extends BaseDocument {
    constructor(props){
        super(props);
    }

    async resetPassword() {
        const user = await loopar.getUser(this.user_name);
    }
}