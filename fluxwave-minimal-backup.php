<?php
/**
 * Plugin Name:       Fluxwave
 * Description:       A modern, accessible WordPress audio player block with playlist management, customizable design, and advanced playback controls.
 * Version:           1.0.0
 * Requires at least: 6.7
 * Requires PHP:      7.4
 * Author:            iconick
 * Author URI:         https://iconick.io
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       fluxwave
 *
 * @package Fluxwave
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

// Define plugin constants
define( 'FLUXWAVE_VERSION', '1.0.0' );
define( 'FLUXWAVE_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'FLUXWAVE_PLUGIN_URL', plugin_dir_url( __FILE__ ) );

/**
 * Registers the block using a `blocks-manifest.php` file, which improves the performance of block type registration.
 * Behind the scenes, it also registers all assets so they can be enqueued
 * through the block editor in the corresponding context.
 *
 * @since 1.0.0
 * @return void
 */
function fluxwave_register_block_types() {
	// Check if build directory exists
	if ( ! file_exists( __DIR__ . '/build/blocks-manifest.php' ) ) {
		return;
	}

	// Check if WordPress functions are available
	if ( ! function_exists( 'register_block_type' ) ) {
		return;
	}

	/**
	 * Registers the block(s) metadata from the `blocks-manifest.php` and registers the block type(s)
	 * based on the registered block metadata.
	 * Added in WordPress 6.8 to simplify the block metadata registration process added in WordPress 6.7.
	 */
	if ( function_exists( 'wp_register_block_types_from_metadata_collection' ) ) {
		try {
			$result = wp_register_block_types_from_metadata_collection( __DIR__ . '/build', __DIR__ . '/build/blocks-manifest.php' );
			return;
		} catch ( Exception $e ) {
			if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
				error_log( 'Fluxwave block registration error (6.8): ' . $e->getMessage() );
			}
		}
	}

	/**
	 * Registers the block(s) metadata from the `blocks-manifest.php` file.
	 * Added to WordPress 6.7 to improve the performance of block type registration.
	 */
	if ( function_exists( 'wp_register_block_metadata_collection' ) ) {
		try {
			wp_register_block_metadata_collection( __DIR__ . '/build', __DIR__ . '/build/blocks-manifest.php' );
		} catch ( Exception $e ) {
			if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
				error_log( 'Fluxwave metadata collection error: ' . $e->getMessage() );
			}
		}
	}
	
	/**
	 * Registers the block type(s) in the `blocks-manifest.php` file.
	 */
	try {
		$manifest_data = require __DIR__ . '/build/blocks-manifest.php';
		if ( is_array( $manifest_data ) ) {
			foreach ( array_keys( $manifest_data ) as $block_type ) {
				if ( file_exists( __DIR__ . "/build/{$block_type}" ) ) {
					$registered = register_block_type( __DIR__ . "/build/{$block_type}" );
				}
			}
		}
	} catch ( Exception $e ) {
		// Silent fail to prevent critical errors
		if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
			error_log( 'Fluxwave block registration error: ' . $e->getMessage() );
		}
	}
}
add_action( 'init', 'fluxwave_register_block_types' );

/**
 * Security: Add nonce to admin scripts for CSRF protection
 * Only adds nonce for users with edit_posts capability
 *
 * @since 1.0.0
 * @return void
 */
function fluxwave_add_admin_nonce_script() {
	if ( is_admin() && current_user_can( 'edit_posts' ) ) {
		try {
			wp_add_inline_script(
				'wp-blocks',
				'window.fluxwaveNonce = ' . wp_json_encode( wp_create_nonce( 'fluxwave_admin' ) ) . ';',
				'before'
			);
		} catch ( Exception $e ) {
			// Silent fail to prevent critical errors
			if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
				error_log( 'Fluxwave admin script error: ' . $e->getMessage() );
			}
		}
	}
}
add_action( 'admin_enqueue_scripts', 'fluxwave_add_admin_nonce_script' );

// Load custom post types
if ( file_exists( FLUXWAVE_PLUGIN_DIR . 'includes/post-types.php' ) ) {
	require_once FLUXWAVE_PLUGIN_DIR . 'includes/post-types.php';
}

// Load REST API endpoints
if ( file_exists( FLUXWAVE_PLUGIN_DIR . 'includes/rest-api.php' ) ) {
	require_once FLUXWAVE_PLUGIN_DIR . 'includes/rest-api.php';
}

// Load unit tests in debug mode
if ( defined( 'WP_DEBUG' ) && WP_DEBUG && file_exists( FLUXWAVE_PLUGIN_DIR . 'tests/test-fluxwave.php' ) ) {
	require_once FLUXWAVE_PLUGIN_DIR . 'tests/test-fluxwave.php';
}
