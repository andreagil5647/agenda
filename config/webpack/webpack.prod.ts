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
      // on unrelated changes. Third-party code is split in two by how often
      // it changes: React is upgraded rarely and is the largest part, so it
      // gets a chunk of its own that survives upgrades of everything else.
      runtimeChunk: 'single',
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          react: {
            // The optional middle part is pnpm's layout: .pnpm/<name>@<version>/node_modules/.
            test: /[\\/]node_modules[\\/](\.pnpm[\\/][^\\/]+[\\/]node_modules[\\/])?(react|react-dom|scheduler)[\\/]/,
            name: 'react',
            chunks: 'all',
            priority: 10,
          },
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
      // Sizes before compression. The whole app is one entry of about 399 kB
      // (122 kB gzipped), 219 kB of it React and 38 kB of it styles, which hold
      // every theme and the rules for the theme fonts. The entry
      // limit leaves a little room above that, so growth shows up as a warning;
      // no single file may pass the per-asset limit, which is what keeps the
      // chunks split. Other languages load on demand and are not in the entry.
      maxEntrypointSize: 400_000,
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
