const path = require('path');
const git = require('git-rev-sync');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');

const isProduction = process.env.MODE === 'production';
console.log("isProduction", isProduction);

const config = {
    entry: "./site/index.ts",
    mode: isProduction ? 'production' : 'development',
    output: {
        path: path.resolve(__dirname, "build")
    },
    module: {
        rules: [
            { test: /\.ts?$/, loader: "ts-loader", exclude: [/node_modules/, /tests/] },
            { test: /\.(less|css)$/, use: [{ loader: "style-loader" }, { loader: "css-loader" }, { loader: "less-loader" }] },
            { test: /\.ttf$/, use: ['file-loader'] },
            { test: /\.tad$/, use: ['raw-loader'] }
        ]
    },
    resolve: {
        extensions: [".ts", ".js"]
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: path.resolve(__dirname, "site/index.html"),
            minify: { removeComments: false },
            templateParameters: {
                "BUILD_HASH": git.short() + (git.isDirty() ? '-dirty' : ''),
                "BUILD_COUNT": git.count(),
                "BUILD_TIME": git.date()
            }
        }),
        new MonacoWebpackPlugin({
            languages: [],
			features: []
        })
    ],
    devServer: {
        contentBase: path.resolve(__dirname, "public"),
        compress: false,
        inline: !isProduction
    }
};

module.exports = config;