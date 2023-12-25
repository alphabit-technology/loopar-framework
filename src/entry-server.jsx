import React from 'react';
import ReactDOMServer from 'react-dom/server';
import App from '#app';
import { StaticRouter } from 'react-router-dom';
import { ComponentsLoader } from '#components-loader';
//import * as sources from '#app-source-loader';

export async function renderPage(url, __META__) {
    const context = {};
    const clientImporter = __META__.client_importer.client;
    const meta = JSON.parse(__META__.meta);

    const fetchDocument = async () => {
        try {
            return await import(`./__apps-source__/${clientImporter}.jsx`);
        } catch (error) {
            setError(error);
        }
    };

    const Document = await fetchDocument();
    await ComponentsLoader(meta.__DOCTYPE__.STRUCTURE);

    const appHtml = ReactDOMServer.renderToString(
        React.createElement(StaticRouter, { location: url, context },
            React.createElement(App, { __META__, Document })
        )
    )

    if (context.url) {
        return {
            redirect: context.url
        };
    }

    return {
        appHtml
    };
}
