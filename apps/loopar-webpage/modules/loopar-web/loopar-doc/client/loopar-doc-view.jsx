
'use strict';

import WebContext from '$context/web-context';

export default class LooparDocView extends WebContext {
    menu = [
        { title: "Overview", href: "#overview" },
        { title: "Installation", href: "#installation" },
        { title: "Configuration", href: "#configuration" },
        { title: "Usage", href: "#usage" },
        { title: "Components", href: "#components" },
        { title: "Modules", href: "#modules" },
        { title: "Plugins", href: "#plugins" },
        { title: "API", href: "#api" },
        { title: "License", href: "#license" },
    ]

    constructor(props) {
        super(props);
    }
}