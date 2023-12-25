import React from 'react';
import ReactDOMServer from 'react-dom/server';
import App from '../App.jsx';
import { StaticRouter } from 'react-router-dom';

console.log('**********ENtry Server*********', App);
export async function renderPage(url, metaData) {
    const context = {};

    const appHtml = ReactDOMServer.renderToString(
        React.createElement(StaticRouter, { location: url, context },
            React.createElement(App, { metaData })
        )
    )

    if (context.url) {
        return {
            redirect: context.url
        };
    }

    return {
        appHtml
        // Puedes agregar más datos aquí para pasar al cliente si es necesario
    };
}
