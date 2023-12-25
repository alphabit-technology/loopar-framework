import React from 'react';
import ReactDOM from 'react-dom';
import App from '../App.jsx'; // Importa tu componente principal de React

// Este método "hidrata" la aplicación en el cliente, asumiendo que el servidor ya ha renderizado el HTML.
ReactDOM.hydrate(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
    document.getElementById('root') // Asegúrate de que coincida con el ID del contenedor en tu HTML.
);
