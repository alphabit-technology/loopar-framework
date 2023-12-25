import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from '#app';
import { ComponentsLoader } from '#components-loader';
//import * as sources from '#app-source-loader';

const clientImporter = __META__.client_importer.client;
const meta = JSON.parse(__META__.meta);

const fetchDocument = async () => {
    try {
        return await import(`./__apps-source__/${clientImporter}.jsx`);
    } catch (error) {
        console.error(error)
    }
};

(async () => {
    const Document = await fetchDocument();
    await ComponentsLoader(meta.__DOCTYPE__.STRUCTURE);

    ReactDOM.hydrateRoot(
        document.getElementById('app-root'),
        <BrowserRouter>
            <App __META__={__META__} Document={Document} />
        </BrowserRouter>
    )
})();