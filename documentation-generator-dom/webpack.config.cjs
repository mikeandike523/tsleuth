// webpack.config.js
const path = require('path');

module.exports = {
  mode: 'development',
  entry: './src/hydrate.ts', // Your entry point
  output: {
    filename: 'hydrate.js', // The name of the bundled file
    path: path.resolve(__dirname, 'dist'), // Where to output the file
  },
  module: {
    rules: [
      {
        test: /\.(js|ts)$/, // Regex to select files that will be transformed
        exclude: /node_modules/, // Do not transform node_modules
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              [
                '@babel/preset-env',
                {
                  targets: {
                    browsers: 'last 2 versions',
                  },
                },
              ],
              '@babel/preset-typescript',
            ],
            plugins: [
              [
                'module-resolver',
                {
                  root: ['./src'],
                  alias: {
                    '@': './src',
                  },
                },
              ],
            ],
          },
        },
      },
    ],
  },
  resolve: {
    extensions: ['.js', '.ts'], // The file extensions that Webpack will resolve
  },
};
