const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const config = {
    entry: "./site/index.ts",
    mode: process.env.MODE || 'development',
    output: {
        path: path.resolve(__dirname, "public")
    },
    module: {
        rules: [
            { test: /\.ts?$/, loader: "ts-loader", exclude: [/node_modules/] },
            { test: /\.js?$/, loader: "babel-loader", exclude: [/node_modules/] },
			{ test: /\.(less|css)$/, use: [{ loader: "style-loader" }, { loader: "css-loader" }, { loader: "less-loader" }] },
            { test: /\.ttf$/, use: ['file-loader'] }
        ]
    },
    resolve: {
        extensions: [".ts", ".js"]
    },
	plugins: [
		new HtmlWebpackPlugin({
			template: path.resolve(__dirname, "site/index.html")
		})
	],
    devServer: {
        contentBase: path.resolve(__dirname, "public"),
        compress: false
    }
};


module.exports = config;