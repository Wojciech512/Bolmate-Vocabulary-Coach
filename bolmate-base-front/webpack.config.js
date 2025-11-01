/*
 * Copyright (c) 2020. Bolmate.nl
 */

module.exports = function (env) {
    if (env && env.hasOwnProperty('rootdir') && env.rootdir) {
        __dirname = env.rootdir;
    }
    const packageJson = require('./package.json'), version = packageJson.version, publicPath = '/';
    // Requires
    const webpack = require('webpack');
    const HtmlWebpackPlugin = require('html-webpack-plugin');
    const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');
    const CompressionPlugin = require('compression-webpack-plugin');
    const MiniCssExtractPlugin = require('mini-css-extract-plugin');
    const TerserPlugin = require('terser-webpack-plugin');
    const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

    const mode = process.env.WEBPACK_ENV;
    const target = mode === 'dev' ? 'web' : 'browserslist';
    const devtool = mode === 'dev' ? 'inline-source-map' : 'source-map';
    const devServer = mode === 'dev' ? {
        host: '127.0.0.1', port: 1337, historyApiFallback: true, open: true, hot: true,
    } : {}, cacheString = '[contenthash]-cache';
    console.debug('Dev server config', devServer);

    const plugins = [new HtmlWebpackPlugin({
        template: 'index.tpl', inject: 'body', environment: {
            mode: JSON.stringify(mode),
        }, version: JSON.stringify(version),
    }), new ForkTsCheckerWebpackPlugin()];
    const rules = [{
        test: /\.tsx?$/, loader: 'ts-loader', options: {
            // disable type checker - we will use it in fork plugin
            transpileOnly: true
        }
    }, {enforce: 'pre', test: /\.js$/, loader: 'source-map-loader'}, { // Images: png, gif, jpg, jpeg, webp, mp4
        test: /\.(png|gif|jpe?g|webp|mp4)$/, type: 'asset/resource', generator: {
            outputPath: 'resources/images/', publicPath: 'resources/images/'
        }
    }, { // Font files: eot, ttf, woff, woff2
        test: /\.(otf|svg|eot|ttf|woff2?)(\?.*$|$)/, type: 'asset/resource', generator: {
            outputPath: 'resources/fonts/', publicPath: 'resources/fonts/'
        }
    }, { // PDF files
        test: /\.(pdf|xlsx)(\?.*$|$)/, type: 'asset/resource', generator: {
            outputPath: 'resources/files/', publicPath: 'resources/files/'
        }
    },];
    if (mode === 'dev') {
        rules.push({
            test: /\.s?css$/, use: ['style-loader', 'css-loader', 'sass-loader']
        });
    } else {
        plugins.push(new CompressionPlugin({
            algorithm: "gzip", test: /\.js$|\.css$|\.html$/, threshold: 10240,
        }), new webpack.optimize.AggressiveMergingPlugin(), new MiniCssExtractPlugin({
            filename: `resources/style/[name]-${cacheString}.css`,
        }));
        rules.push({
            test: /\.s?css$/, use: [{
                loader: MiniCssExtractPlugin.loader, options: {
                    publicPath: '../../',
                },
            }, {loader: 'css-loader', options: {importLoaders: 1}}, {loader: 'sass-loader'},],
        })
    }

    return {
        mode: mode === 'dev' ? 'development' : 'production', entry: './src/index.tsx', optimization: {
            minimize: true, minimizer: [new TerserPlugin({
                parallel: true, terserOptions: {
                    ecma: 8, compress: {
                        drop_console: mode === 'prod',
                    }
                }
            }), new OptimizeCssAssetsPlugin({
                cssProcessorOptions: {
                    zindex: false,
                },
            })], moduleIds: 'deterministic', runtimeChunk: 'single', splitChunks: {
                cacheGroups: {
                    defaultVendors: {
                        test: /[\\/]node_modules[\\/]/, name: 'vendors', chunks: 'all',
                    },
                },
            }
        }, output: {
            filename: `[name]-${cacheString}.js`, path: __dirname + '/dist', publicPath,
        }, devtool, devServer, resolve: {
            extensions: ['.ts', '.tsx', '.js', '.json'], symlinks: false,
        }, module: {
            rules,
        }, plugins, ignoreWarnings: [/Failed to parse source map/], target,
    }
};
