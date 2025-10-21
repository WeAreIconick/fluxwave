<?php
/**
 * REST API endpoints for Fluxwave
 * Minimal version to prevent critical errors
 *
 * @package Fluxwave
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Register REST API routes
 * 
 * @since 0.1.0
 * @return void
 */
function fluxwave_register_rest_routes() {
	// Only register if WordPress REST API is available
	if ( ! function_exists( 'register_rest_route' ) ) {
		return;
	}

	// Get audio file metadata
	register_rest_route(
		'fluxwave/v1',
		'/audio/(?P<id>\d+)',
		array(
			'methods'             => 'GET',
			'callback'            => 'fluxwave_get_audio_metadata',
			'permission_callback' => 'fluxwave_validate_api_request',
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

	// Get multiple audio files with pagination
	register_rest_route(
		'fluxwave/v1',
		'/audio',
		array(
			'methods'             => 'GET',
			'callback'            => 'fluxwave_get_audio_list',
			'permission_callback' => 'fluxwave_validate_api_request',
			'args'                => array(
				'per_page' => array(
					'default'           => 20,
					'validate_callback' => function( $param ) {
						return is_numeric( $param ) && $param > 0 && $param <= 100;
					},
					'sanitize_callback' => 'absint',
				),
				'page' => array(
					'default'           => 1,
					'validate_callback' => function( $param ) {
						return is_numeric( $param ) && $param > 0;
					},
					'sanitize_callback' => 'absint',
				),
			),
		)
	);
}

/**
 * Get audio metadata
 *
 * @param WP_REST_Request $request Request object
 * @return WP_REST_Response|WP_Error
 */
function fluxwave_get_audio_metadata( $request ) {
	$id = $request->get_param( 'id' );
	
	// Get attachment
	$attachment = get_post( $id );
	if ( ! $attachment || $attachment->post_type !== 'attachment' ) {
		return new WP_Error( 'invalid_attachment', 'Invalid attachment ID', array( 'status' => 404 ) );
	}
	
	// Check MIME type
	$mime_type = get_post_mime_type( $id );
	if ( ! in_array( $mime_type, array( 'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a' ), true ) ) {
		return new WP_Error( 'invalid_mime_type', 'Not an audio file', array( 'status' => 400 ) );
	}
	
	// Get file info
	$file_path = get_attached_file( $id );
	if ( ! $file_path || ! file_exists( $file_path ) ) {
		return new WP_Error( 'file_not_found', 'Audio file not found', array( 'status' => 404 ) );
	}
	
	// Get metadata
	$metadata = wp_get_attachment_metadata( $id );
	$url = wp_get_attachment_url( $id );
	
	// Prepare response
	$response = array(
		'id' => $id,
		'url' => $url,
		'title' => get_the_title( $id ),
		'artist' => isset( $metadata['artist'] ) ? $metadata['artist'] : '',
		'album' => isset( $metadata['album'] ) ? $metadata['album'] : '',
		'duration' => isset( $metadata['length'] ) ? $metadata['length'] : 0,
		'file_size' => filesize( $file_path ),
		'mime_type' => $mime_type,
	);
	
	return rest_ensure_response( $response );
}

/**
 * Get audio list
 *
 * @param WP_REST_Request $request Request object
 * @return WP_REST_Response|WP_Error
 */
function fluxwave_get_audio_list( $request ) {
	$page = $request->get_param( 'page' );
	$per_page = $request->get_param( 'per_page' );
	$offset = ( $page - 1 ) * $per_page;
	
	// Query audio files
	$query = new WP_Query( array(
		'post_type' => 'attachment',
		'post_mime_type' => array( 'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a' ),
		'post_status' => 'inherit',
		'posts_per_page' => $per_page,
		'offset' => $offset,
		'orderby' => 'date',
		'order' => 'DESC',
	) );
	
	$audio_files = array();
	if ( $query->have_posts() ) {
		while ( $query->have_posts() ) {
			$query->the_post();
			$id = get_the_ID();
			$metadata = wp_get_attachment_metadata( $id );
			
			$audio_files[] = array(
				'id' => $id,
				'url' => wp_get_attachment_url( $id ),
				'title' => get_the_title( $id ),
				'artist' => isset( $metadata['artist'] ) ? $metadata['artist'] : '',
				'album' => isset( $metadata['album'] ) ? $metadata['album'] : '',
				'duration' => isset( $metadata['length'] ) ? $metadata['length'] : 0,
			);
		}
	}
	wp_reset_postdata();
	
	// Prepare response
	$response = array(
		'files' => $audio_files,
		'total' => $query->found_posts,
		'pages' => ceil( $query->found_posts / $per_page ),
		'current_page' => $page,
	);
	
	return rest_ensure_response( $response );
}

/**
 * Validate API request
 *
 * @param WP_REST_Request $request Request object
 * @return bool|WP_Error
 */
function fluxwave_validate_api_request( $request ) {
	// Check if user is logged in
	if ( ! is_user_logged_in() ) {
		return new WP_Error( 'not_logged_in', 'Authentication required', array( 'status' => 401 ) );
	}
	
	// Check user capabilities
	if ( ! current_user_can( 'upload_files' ) ) {
		return new WP_Error( 'insufficient_permissions', 'Insufficient permissions', array( 'status' => 403 ) );
	}
	
	// Verify nonce
	$nonce = $request->get_header( 'X-WP-Nonce' );
	if ( $nonce && ! wp_verify_nonce( $nonce, 'wp_rest' ) ) {
		return new WP_Error( 'invalid_nonce', 'Invalid nonce', array( 'status' => 403 ) );
	}
	
	return true;
}

// Add error handling for REST API registration
function fluxwave_safe_register_rest_routes() {
	try {
		fluxwave_register_rest_routes();
	} catch ( Exception $e ) {
		// Silent fail to prevent critical errors
		if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
			error_log( 'Fluxwave REST API registration error: ' . $e->getMessage() );
		}
	}
}
add_action( 'rest_api_init', 'fluxwave_safe_register_rest_routes' );
