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

// Additional security check - ensure we're actually uninstalling
if ( ! current_user_can( 'delete_plugins' ) ) {
	exit;
}

// Cleanup tasks:
// - Block attributes are stored in post_content (cleaned up by WordPress automatically)
// - No custom database tables created
// - No options stored in wp_options
// - Clean up audio metadata transients

// Clean up audio metadata cache
// Clear the entire fluxwave cache group
wp_cache_flush_group( 'fluxwave' );

