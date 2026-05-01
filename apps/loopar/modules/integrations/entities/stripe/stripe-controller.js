
'use strict';

import { SingleController } from 'loopar';
import { loopar } from "loopar";

export default class StripeController extends SingleController {
    static publicActions = ["clientSecret"];
    constructor(props) {
        super(props);
    }

    async actionClientSecret() {
        const stripe = await loopar.getDocument("Stripe");

        return await this.success(await stripe.authorize());
    }
}