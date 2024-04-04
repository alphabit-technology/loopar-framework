
'use strict';

import WebContext from '/gui/document/web-context.js';

export default class LooparHomeView extends WebContext {
    constructor(props) {
        super(props);


        console.log("LooparHomeView constructor");
    }

    render(){
        return (
            div({className: "container-fluid"}, [
                div({className: "row"}, [
                    div({className: "col-12"}, [
                        h1({className: "text-center"}, "Loopar Home")
                    ])
                ])
            ])
        );
    }
}