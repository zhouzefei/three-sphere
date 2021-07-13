const webpack = require("webpack");
let webpackConfig = {
	entry: "./index.js",
	output:{
		filename:"index.js",
		publicPath:"/"
	},
	mode:"development",
	devtool: "cheap-module-eval-source-map" ,
	devServer: {
		port: 7979,
		open: true,
		host: "0.0.0.0",
		openPage: "./index.html",
		hot: true,
		publicPath:"/"
	},
	module: {
		rules: [
			{
				test: /\.js$/,
				exclude: /(node_modules|bower_components)/,
				use: [{
					loader: "babel-loader",
					options: {
						presets: [["@babel/preset-env"]],
						plugins: [
							[
								"@babel/plugin-proposal-decorators",
								{ legacy: true }
							],
							[
								"@babel/plugin-proposal-class-properties",
								{ loose: true }
							],
							"@babel/plugin-transform-runtime",
						]
					}
				}]
			},
			{
				test: /\.less$/,
				use: [
					{ loader: "style-loader" },
					{ loader: "css-loader" },
					{
						loader: "less-loader",
						options: {
							javascriptEnabled: true
						}
					}
				]
			},
			{
				test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
				use: [
					{
						loader: 'url-loader'
					}
				]
			}
		]
	}
};
module.exports = webpackConfig;
