import CssMinimizerPlugin from 'css-minimizer-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import TerserPlugin from 'terser-webpack-plugin';
import type { Configuration } from 'webpack';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
import { merge } from 'webpack-merge';
import { paths } from './paths.ts';
import { createCommonConfig } from './webpack.common.ts';

export default (env: Record<string, boolean>): Configuration =>
  merge(createCommonConfig('production'), {
    mode: 'production',
    // A full source map, published alongside the bundle: the app is open
    // source, so hiding stack traces from users would not hide anything
    // from an attacker, only from debugging write-ups (see docs/debugging).
    devtool: 'source-map',
    output: {
      path: paths.dist,
      publicPath: '/',
      filename: 'js/[name].[contenthash:8].js',
      chunkFilename: 'js/[name].[contenthash:8].chunk.js',
      clean: true,
    },
    optimization: {
      minimize: true,
      minimizer: [
        new TerserPlugin({ terserOptions: { format: { comments: false } } }),
        new CssMinimizerPlugin(),
      ],
      // One runtime chunk so module ids don't shift every app chunk's hash
      // on unrelated changes; a vendor chunk so third-party code, which
      // changes far less often than app code, caches independently.
      runtimeChunk: 'single',
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendor',
            chunks: 'all',
          },
        },
      },
    },
    performance: {
      hints: 'warning',
      // Calibrated once the design system and real routes exist; a bare
      // health-check page should stay far under this.
      maxEntrypointSize: 250_000,
      maxAssetSize: 250_000,
    },
    plugins: [
      new MiniCssExtractPlugin({
        filename: 'css/[name].[contenthash:8].css',
        chunkFilename: 'css/[name].[contenthash:8].chunk.css',
      }),
      ...(env.analyze
        ? [new BundleAnalyzerPlugin({ analyzerMode: 'static', openAnalyzer: true })]
        : []),
    ],
  });
