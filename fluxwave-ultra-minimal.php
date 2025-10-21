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
 * Register the Fluxwave block
 *
 * @since 1.0.0
 * @return void
 */
function fluxwave_register_block() {
	// Only register if WordPress is ready
	if ( ! function_exists( 'register_block_type' ) ) {
		return;
	}

	// Check if build directory exists
	if ( ! file_exists( __DIR__ . '/build/fluxwave/block.json' ) ) {
		return;
	}

	try {
		register_block_type( __DIR__ . '/build/fluxwave' );
	} catch ( Exception $e ) {
		// Silent fail to prevent critical errors
		if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
			error_log( 'Fluxwave block registration error: ' . $e->getMessage() );
		}
	}
}
add_action( 'init', 'fluxwave_register_block' );

/**
 * Add admin nonce for security
 *
 * @since 1.0.0
 * @return void
 */
function fluxwave_add_admin_nonce() {
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
add_action( 'admin_enqueue_scripts', 'fluxwave_add_admin_nonce' );

// Load REST API endpoints if they exist
if ( file_exists( FLUXWAVE_PLUGIN_DIR . 'includes/rest-api.php' ) ) {
	require_once FLUXWAVE_PLUGIN_DIR . 'includes/rest-api.php';
}
