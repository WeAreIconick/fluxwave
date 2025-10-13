<?php
/**
 * REST API endpoints for Fluxwave
 * (Currently minimal - all data stored in block attributes)
 *
 * @package Fluxwave
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Register REST API routes
 */
function fluxwave_register_rest_routes() {
	// Get audio file metadata
	register_rest_route(
		'fluxwave/v1',
		'/audio/(?P<id>\d+)',
		array(
			'methods'             => 'GET',
			'callback'            => 'fluxwave_get_audio_metadata',
			'permission_callback' => '__return_true', // Public endpoint - read-only
			'args'                => array(
				'id' => array(
					'required'          => true,
					'validate_callback' => function( $param ) {
						return is_numeric( $param ) && $param > 0;
					},
					'sanitize_callback' => 'absint',
				),
			),
		)
	);
}
add_action( 'rest_api_init', 'fluxwave_register_rest_routes' );

/**
 * Get audio file metadata
 *
 * @param WP_REST_Request $request Request object.
 * @return WP_REST_Response|WP_Error
 */
function fluxwave_get_audio_metadata( $request ) {
	$id = absint( $request->get_param( 'id' ) );
	
	// Performance: Check cache first
	$cache_key = 'fluxwave_audio_meta_' . $id;
	$cached_data = get_transient( $cache_key );
	
	if ( false !== $cached_data ) {
		return rest_ensure_response( $cached_data );
	}
	
	// Security: Verify it's a valid attachment
	$attachment = get_post( $id );
	if ( ! $attachment || 'attachment' !== $attachment->post_type ) {
		return new WP_Error( 'not_found', __( 'Audio file not found', 'fluxwave' ), array( 'status' => 404 ) );
	}

	// Security: Verify it's an audio file
	$mime_type = get_post_mime_type( $id );
	if ( 0 !== strpos( $mime_type, 'audio/' ) ) {
		return new WP_Error( 'invalid_type', __( 'File is not an audio file', 'fluxwave' ), array( 'status' => 400 ) );
	}

	// Get attachment metadata
	$metadata = wp_get_attachment_metadata( $id );
	$file_url = wp_get_attachment_url( $id );
	$file_path = get_attached_file( $id );

	// Security: Validate file exists and is readable
	if ( ! $file_path || ! file_exists( $file_path ) ) {
		return new WP_Error( 'file_not_found', __( 'Audio file not found on server', 'fluxwave' ), array( 'status' => 404 ) );
	}

	$data = array(
		'id'       => $id,
		'title'    => sanitize_text_field( get_the_title( $id ) ),
		'url'      => esc_url_raw( $file_url ),
		'mime'     => sanitize_mime_type( $mime_type ),
		'filesize' => filesize( $file_path ),
	);

	// Add audio-specific metadata if available
	if ( isset( $metadata['length_formatted'] ) ) {
		$data['duration_formatted'] = sanitize_text_field( $metadata['length_formatted'] );
	}
	if ( isset( $metadata['length'] ) ) {
		$data['duration'] = floatval( $metadata['length'] );
	}

	// Performance: Cache for 1 hour
	set_transient( $cache_key, $data, HOUR_IN_SECONDS );

	return rest_ensure_response( $data );
}

/**
 * Clear audio metadata cache when attachment is updated
 * 
 * @param int $post_id Post ID.
 */
function fluxwave_clear_audio_cache( $post_id ) {
	// Only clear cache for audio attachments
	if ( 'attachment' === get_post_type( $post_id ) ) {
		$mime_type = get_post_mime_type( $post_id );
		if ( 0 === strpos( $mime_type, 'audio/' ) ) {
			delete_transient( 'fluxwave_audio_meta_' . $post_id );
		}
	}
}
add_action( 'edit_attachment', 'fluxwave_clear_audio_cache' );
add_action( 'delete_attachment', 'fluxwave_clear_audio_cache' );
