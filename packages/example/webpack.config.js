const path = require("node:path");
const HTMLWebpackPlugin = require('html-webpack-plugin');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');
const {SVGWebpackPlugin, getPostCSSURL } = require('svg-webpack-plugin');

const getConfig = (env, options) => {
  const { PORT } = env;
  const { mode = 'production' } = options;
  const isDevelopment = mode === 'development';
  const base = process.cwd();
  const dist = 'dist';
  const name = 'browser';

  return {
    devServer: {
      bonjour: false,
      client: {
        overlay: false,
        webSocketURL: {
          hostname: '0.0.0.0',
          pathname: '/ws',
          port: PORT,
          protocol: 'ws',
        },
      },
      devMiddleware: {
        writeToDisk: true,
      },
      historyApiFallback: true,
      host: `localhost`,
      hot: true,
      liveReload: true,
      port: PORT,
      static: {
        directory: path.join(process.cwd(), 'dist'),
      },
    },
    entry: {
      main: [require.resolve('./index.tsx')],
    },
    module: {
      rules: [
        {
          issuer: /\.[jt]sx?$/,
          loader: require.resolve('svg-webpack-plugin/dist/loader'),
          test: /\.svg$/,
        },
        {
          test: /\.scss$/,
          type: 'javascript/auto',
          use: [
            require.resolve("style-loader"),
            {
              loader: require.resolve('css-loader'),
              options: {
                url: false,
                esModule: true,
                modules: true,
              },
            },
            {
              loader: require.resolve('postcss-loader'),
              options: {
                postcssOptions: (context) => ({
                  plugins: [getPostCSSURL(context)]
                }),
              }
            },
            require.resolve('sass-loader'),
          ]
        },
        // {
        //   test: /\.svg$/,
        //   type: 'asset',
        //   resourceQuery: /inline/
        // },
        {
          exclude: /node_modules/,
          loader: require.resolve('swc-loader'),
          options: {
            jsc: {
              transform: {
                react: {
                  development: isDevelopment,
                  refresh: isDevelopment,
                },
              },
            },
          },
          test: /\.[tj]sx?$/,
        },
      ],
    },
    mode,
    name,
    output: {
      filename: './[name]_[contenthash].js',
      path: path.join(base, dist),
      publicPath: '/',
    },
    plugins: [
      isDevelopment && new ReactRefreshWebpackPlugin(),
      new SVGWebpackPlugin(),
      new HTMLWebpackPlugin({
        filename: 'index.html',
        template: path.join(__dirname, './index.html'),
        title: '@example App',
      }),
    ].filter(Boolean),
    resolve: {
      extensions: ['.ts', '.tsx', '...'],
    },
    stats: 'minimal',
    target: 'web',
  };
};

module.exports = getConfig;
