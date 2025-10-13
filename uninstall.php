<?php
/**
 * Uninstall Script
 * Fired when the plugin is uninstalled
 *
 * @package Fluxwave
 */

// Exit if accessed directly or not uninstalling
if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

// Cleanup tasks:
// - Block attributes are stored in post_content (cleaned up by WordPress automatically)
// - No custom database tables created
// - No options stored in wp_options
// - Clean up audio metadata transients

// Clean up all audio metadata cache transients
global $wpdb;
$transient_keys = $wpdb->get_col(
	$wpdb->prepare(
		"SELECT option_name FROM {$wpdb->options} WHERE option_name LIKE %s",
		$wpdb->esc_like( '_transient_fluxwave_audio_meta_' ) . '%'
	)
);

foreach ( $transient_keys as $key ) {
	$transient_name = str_replace( '_transient_', '', $key );
	delete_transient( $transient_name );
}

