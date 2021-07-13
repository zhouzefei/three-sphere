const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");
const path = require("path");
let webpackConfig = {
	entry: "./src/index.js",
	output: {
		filename: "index.js",
		library: "ThreeSphere",
		libraryTarget: "umd"
	},
	externals: {
        jquery: "jquery", //打包时候排除react
        three: "three",
        '@tntv/layers':"@tntv/layers"
	},
	optimization: {
		minimize: true
	},
	plugins:[
		new BundleAnalyzerPlugin()
	],
	module: {
		rules: [
			{
				test: /\.js$/,
				exclude: /(node_modules|bower_components)/,
				use: [
					{
						loader: "babel-loader",
						options: {
							presets: [["@babel/preset-env"]],
							plugins: [
								["@babel/plugin-proposal-decorators", { legacy: true }],
								["@babel/plugin-proposal-class-properties", { loose: true }],
								"@babel/plugin-transform-runtime"
							]
						}
					}
				]
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
						loader: 'url-loader',
						options:{
							limit: 10000,
							name:"[hash:8]-[name].[ext]"
						}
					}
				]
			}
		]
	}
};
module.exports = webpackConfig;
