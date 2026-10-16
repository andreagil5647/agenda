import ReactRefreshWebpackPlugin from '@pmmmwh/react-refresh-webpack-plugin';
import type { Configuration as DevServerConfiguration } from 'webpack-dev-server';
import { merge } from 'webpack-merge';
import { createCommonConfig } from './webpack.common.ts';

const devServer: DevServerConfiguration = {
  port: 3000,
  hot: true,
  historyApiFallback: true,
  // An error covers the page, because the app cannot be used anyway. A warning does not: it
  // would hide a working app from whoever is using it, the end-to-end tests included.
  client: { overlay: { errors: true, warnings: false } },
  // Same-origin /api/* in the browser, mirroring the Render static-site
  // rewrite used in production (see ADR 0003 in the backend repo). Cookies
  // set by the API are then first-party in both environments.
  proxy: [
    {
      context: ['/api'],
      target: 'http://localhost:4000',
      changeOrigin: true,
    },
  ],
};

export default merge(createCommonConfig('development'), {
  mode: 'development',
  // Cheap eval source maps: fast rebuilds, accurate line numbers, good
  // enough for a dev server that never ships. Production uses a full,
  // public source-map instead (see webpack.prod.ts).
  devtool: 'eval-cheap-module-source-map',
  output: {
    filename: 'js/[name].js',
    publicPath: '/',
  },
  plugins: [new ReactRefreshWebpackPlugin()],
  devServer,
});
