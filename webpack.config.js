/**
 * Webpack Configuration Overrides for Performance Optimization
 * 
 * @package Fluxwave
 */

const defaultConfig = require('@wordpress/scripts/config/webpack.config');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
	...defaultConfig,
	optimization: {
		...defaultConfig.optimization,
		minimize: true,
		minimizer: [
			new TerserPlugin({
				terserOptions: {
					compress: {
						drop_console: false, // Keep console for debugging
						drop_debugger: true,
						pure_funcs: ['console.debug'], // Remove console.debug in production
					},
					mangle: {
						safari10: true,
					},
					output: {
						comments: false,
						ascii_only: true,
					},
				},
				extractComments: false,
			}),
		],
		splitChunks: {
			...defaultConfig.optimization.splitChunks,
			cacheGroups: {
				...defaultConfig.optimization.splitChunks.cacheGroups,
				// Split Howler into separate chunk for better caching
				howler: {
					test: /[\\/]node_modules[\\/]howler[\\/]/,
					name: 'howler',
					chunks: 'all',
					priority: 20,
				},
				// Split DnD Kit into separate chunk
				dndkit: {
					test: /[\\/]node_modules[\\/]@dnd-kit[\\/]/,
					name: 'dndkit',
					chunks: 'all',
					priority: 15,
				},
			},
		},
	},
	performance: {
		hints: 'warning',
		maxEntrypointSize: 300000, // 300KB
		maxAssetSize: 250000, // 250KB
	},
};

