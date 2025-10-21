/**
 * Webpack Configuration Overrides for Performance Optimization
 *
 * @package
 */

const defaultConfig = require( '@wordpress/scripts/config/webpack.config' );
const TerserPlugin = require( 'terser-webpack-plugin' );
const DependencyExtractionWebpackPlugin = require( '@wordpress/dependency-extraction-webpack-plugin' );

module.exports = {
	...defaultConfig,
	plugins: defaultConfig.plugins.map( ( plugin ) => {
		// Replace the default DependencyExtractionWebpackPlugin with a configured one
		if ( plugin.constructor.name === 'DependencyExtractionWebpackPlugin' ) {
			return new DependencyExtractionWebpackPlugin( {
				requestToExternal( request ) {
					// Force React and ReactDOM to use WordPress globals
					if ( request === 'react' ) {
						return 'React';
					}
					if ( request === 'react-dom' ) {
						return 'ReactDOM';
					}
					// Let the plugin handle other WordPress dependencies
					return undefined;
				},
				requestToHandle( request ) {
					// Map React/ReactDOM to WordPress script handles
					if ( request === 'react' ) {
						return 'react';
					}
					if ( request === 'react-dom' ) {
						return 'react-dom';
					}
					return undefined;
				},
			} );
		}
		return plugin;
	} ),
	optimization: {
		...defaultConfig.optimization,
		minimize: true,
		minimizer: [
			new TerserPlugin( {
				terserOptions: {
					compress: {
						drop_console: false, // Keep console for debugging
						drop_debugger: true,
						pure_funcs: [ 'console.debug' ], // Remove console.debug in production
						unused: true, // Remove unused code
						dead_code: true, // Remove dead code
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
			} ),
		],
		// IMPORTANT: Code splitting is disabled because WordPress blocks-manifest registration
		// doesn't automatically handle split chunks. All dependencies must be bundled into
		// the main entry files or explicitly registered as WordPress script dependencies.
		// Enabling splitChunks causes module resolution failures in the WordPress environment.
		splitChunks: false,
		usedExports: true, // Enable tree shaking
		sideEffects: false, // Mark as side-effect free for better tree shaking
	},
	performance: {
		hints: 'warning',
		// Increased limits since we're bundling all dependencies
		maxEntrypointSize: 500000, // 500KB
		maxAssetSize: 450000, // 450KB
	},
};
