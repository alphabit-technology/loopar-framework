
import path from 'path';
import nodeExternals from 'webpack-node-externals';
import fs from 'fs';
import moduleAlias from 'module-alias';

import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const componentsAlias = {};
const makeComponentToAlias = (dir) => {
  const alias = {};
  fs.readdirSync(dir).forEach(file => {
    if (fs.lstatSync(path.resolve(__dirname, dir, file)).isDirectory()) {
      Object.assign(alias, makeComponentToAlias(path.resolve(dir, file)));
    } else {
      componentsAlias[`@${file.split(".")[0]}`] = path.resolve(__dirname, dir, file);
      componentsAlias[`./${file}`] = path.resolve(__dirname, dir, file);
      //componentsAlias[`./src/${file}`] = path.resolve(__dirname, dir, file);
    }
  })
  return componentsAlias;
}
const alias = {
  // Aquí definirías tus alias, por ejemplo:
  //"@components": "./src/components",
  //"@utils": "./src/utils",
  ...componentsAlias,
  '@app': path.resolve(__dirname, 'src/App.jsx')
}


moduleAlias.addAliases(alias)

makeComponentToAlias('./loopar-env/src/components');

const resolveConfig = {
  alias: {
    ...componentsAlias,
    '@app': path.resolve(__dirname, 'src/App.jsx')
  }
}

const moduleConfig = {
  rules: [
    {
      test: /\.jsx?$/,
      exclude: [/node_modules/, /apps/, /loopar-env/, /dist/, /config/, /public/, /src-vite/, /database/],
      use: {
        loader: 'babel-loader',
        options: {
          presets: ['@babel/preset-env', '@babel/preset-react'], // Presets para ES6 y React
          plugins: [
            ['module-resolver', {
              alias: alias
            }]
          ]
        }
      }
    },
    // otras reglas...
  ]
};



const clientConfig = {
  target: 'web',
  entry: './src/client/index.js',
  //resolve: resolveConfig,
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.client.js',
  },
  module: moduleConfig,
};

const serverConfig = {
  target: 'node',
  entry: './src/server/index.jsx',
  //resolve: resolveConfig,
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'ssr-bundle.js',
    libraryTarget: 'commonjs2'
  },
  module: moduleConfig,
};

export default [clientConfig, serverConfig];

/*const serverConfig = {
  // Configuración para el lado del servidor
  entry: './loopar-env/index.js',
  target: 'node',
  // ...
  ...alias,
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.server.js',
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/, // Manejo de archivos JS y JSX
        exclude: [/node_modules/, /apps/, /loopar-env/, /dist/, /config/, /public/, /src-vite/, /database/],
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react'] // Presets para ES6 y React
          }
        }
      },
      // otras reglas...
    ]
  },
  // ...
};*/



/*export default [
  {
    // Configuración para el lado del cliente
    target: 'web',
    entry: './src/client/index.js',
    experiments: {
      outputModule: true,
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'bundle.client.js',
      module: true, // Habilita la generación de módulos ES6
      library: {
        type: 'module'
      },
      chunkFormat: 'module',
    },
    module: {
      rules: [
        {
          test: /\.jsx?$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env', '@babel/preset-react']
            }
          }
        },
        // Puedes añadir más reglas para otros tipos de archivos como CSS, imágenes, etc.
      ]
    },
    resolve: {
      extensions: ['.js', '.jsx']
    }
  },
  {
    // Configuración para el lado del servidor
    entry: './loopar-env/index.js',
    target: 'node',
    externals: [nodeExternals()],
    experiments: {
      outputModule: true,
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'bundle.server.js',
      module: true, // Habilita la generación de módulos ES6
      library: {
        type: 'module'
      },
      chunkFormat: 'module',
    },
    module: {
      rules: [
        {
          test: /\.jsx?$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env', '@babel/preset-react']
            }
          }
        }
        // Puedes añadir más reglas aquí también.
      ]
    },
    module: {
      rules: [
        {
          test: /\.m?js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env']
            }
          }
        }
      ]
    }

    resolve: {
      extensions: ['.js', '.jsx']
    }
  }
];
*/