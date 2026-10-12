import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import webpack from 'webpack';
import type { Configuration, RuleSetUseItem } from 'webpack';
import { loadPublicEnv, toDefinePluginEnv } from './env.ts';
import { paths } from './paths.ts';

type Mode = 'development' | 'production';

/**
 * In development styles are injected with style-loader so they hot-reload; in
 * production they are extracted to a content-hashed file that caches apart
 * from the JavaScript.
 */
function cssLoaders({ isDev, scoped }: { isDev: boolean; scoped: boolean }): RuleSetUseItem[] {
  return [
    isDev ? 'style-loader' : MiniCssExtractPlugin.loader,
    {
      loader: 'css-loader',
      options: {
        modules: scoped
          ? {
              // A default export object, so components write `styles.panel`.
              namedExport: false,
              // Readable class names while developing, short hashes when shipped.
              localIdentName: isDev ? '[name]__[local]' : '[hash:base64:6]',
            }
          : false,
      },
    },
  ];
}

/**
 * Shared between dev and prod. Each mode calls this and layers on its own
 * devtool, output and optimization settings, then merges with webpack-merge.
 */
export function createCommonConfig(mode: Mode): Configuration {
  const isDev = mode === 'development';
  const env = loadPublicEnv(mode);

  return {
    entry: paths.entry,
    resolve: {
      extensions: ['.tsx', '.ts', '.js'],
      alias: { '@': paths.src },
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          exclude: /node_modules/,
          loader: 'swc-loader',
          options: {
            jsc: {
              transform: {
                react: {
                  runtime: 'automatic',
                  development: isDev,
                  // Fast Refresh needs the babel-style plugin, which swc's
                  // react transform can drive directly.
                  refresh: isDev,
                },
              },
            },
          },
        },
        // Component styles: class names are scoped to the file that declares them.
        { test: /\.module\.css$/, use: cssLoaders({ isDev, scoped: true }) },
        // Everything else is global on purpose: design tokens and the base layer.
        { test: /\.css$/, exclude: /\.module\.css$/, use: cssLoaders({ isDev, scoped: false }) },
        {
          test: /\.(png|jpe?g|gif|svg|webp)$/i,
          type: 'asset/resource',
          generator: { filename: 'images/[name].[contenthash:8][ext]' },
        },
        {
          test: /\.(woff2?|ttf)$/i,
          type: 'asset/resource',
          generator: { filename: 'fonts/[name].[contenthash:8][ext]' },
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: paths.htmlTemplate,
        // The pre-paint theme script (added with the design system) must
        // run before first render, so nothing here injects it after body.
        inject: 'body',
      }),
      new ForkTsCheckerWebpackPlugin({
        typescript: {
          configFile: `${paths.root}/tsconfig.json`,
          diagnosticOptions: { syntactic: true, semantic: true },
        },
      }),
      new webpack.DefinePlugin(toDefinePluginEnv(env, mode)),
    ],
  };
}
