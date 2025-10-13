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
 * 
 * @since 0.1.0
 * @return void
 */
function fluxwave_register_rest_routes() {
	// Get audio file metadata
	register_rest_route(
		'fluxwave/v1',
		'/audio/(?P<id>\d+)',
		array(
			'methods'             => 'GET',
			'callback'            => 'fluxwave_get_audio_metadata',
			'permission_callback' => function( $request ) {
			// Only allow access to authenticated users with proper capabilities
			if ( ! is_user_logged_in() ) {
				return false;
			}
			
			// Check if user can read posts (basic capability)
			if ( ! current_user_can( 'read' ) ) {
				return false;
			}
			
			// Additional nonce verification for extra security
			$nonce = $request->get_header( 'X-WP-Nonce' );
			if ( $nonce && ! wp_verify_nonce( $nonce, 'wp_rest' ) ) {
				return false;
			}
			
			return true;
		},
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
 * Advanced rate limiting with IP whitelisting and adaptive limits
 *
 * @param string $key Rate limit key (usually IP address).
 * @param int    $limit Maximum requests per minute.
 * @return bool True if within limit, false if exceeded.
 * @since 0.1.0
 */
function fluxwave_check_rate_limit( $key, $limit = 60 ) {
	// Check if IP is whitelisted (admin IPs, localhost, etc.)
	if ( fluxwave_is_whitelisted_ip( $key ) ) {
		return true;
	}
	
	$transient_key = 'fluxwave_rate_limit_' . md5( $key );
	$requests = get_transient( $transient_key );
	
	// Adaptive rate limiting based on user behavior
	$adaptive_limit = fluxwave_get_adaptive_limit( $key, $limit );
	
	if ( false === $requests ) {
		$requests = 1;
		set_transient( $transient_key, $requests, MINUTE_IN_SECONDS );
		return true;
	}
	
	if ( $requests >= $adaptive_limit ) {
		// Log rate limit violations for monitoring
		if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
			error_log( sprintf( 'Fluxwave: Rate limit exceeded for key %s (%d/%d requests)', $key, $requests, $adaptive_limit ) );
		}
		
		// Track repeat offenders
		fluxwave_track_rate_limit_violation( $key );
		return false;
	}
	
	set_transient( $transient_key, $requests + 1, MINUTE_IN_SECONDS );
	return true;
}

/**
 * Check if IP is whitelisted for rate limiting
 *
 * @param string $ip IP address to check.
 * @return bool True if whitelisted.
 * @since 0.1.0
 */
function fluxwave_is_whitelisted_ip( $ip ) {
	$whitelisted_ips = array(
		'127.0.0.1',
		'::1',
		'localhost',
	);
	
	// Add admin IPs if configured
	if ( defined( 'FLUXWAVE_ADMIN_IPS' ) ) {
		$admin_ips = explode( ',', FLUXWAVE_ADMIN_IPS );
		$whitelisted_ips = array_merge( $whitelisted_ips, array_map( 'trim', $admin_ips ) );
	}
	
	return in_array( $ip, $whitelisted_ips, true );
}

/**
 * Get adaptive rate limit based on user behavior
 *
 * @param string $ip IP address.
 * @param int    $default_limit Default rate limit.
 * @return int Adaptive rate limit.
 * @since 0.1.0
 */
function fluxwave_get_adaptive_limit( $ip, $default_limit ) {
	$violation_key = 'fluxwave_violations_' . md5( $ip );
	$violations = get_transient( $violation_key );
	
	if ( false === $violations ) {
		return $default_limit;
	}
	
	// Reduce limit for repeat offenders
	if ( $violations > 5 ) {
		return max( 10, $default_limit / 4 ); // Minimum 10 requests
	} elseif ( $violations > 2 ) {
		return max( 20, $default_limit / 2 ); // Minimum 20 requests
	}
	
	return $default_limit;
}

/**
 * Track rate limit violations for adaptive limiting
 *
 * @param string $ip IP address.
 * @return void
 * @since 0.1.0
 */
function fluxwave_track_rate_limit_violation( $ip ) {
	$violation_key = 'fluxwave_violations_' . md5( $ip );
	$violations = get_transient( $violation_key );
	
	if ( false === $violations ) {
		$violations = 1;
	} else {
		$violations++;
	}
	
	// Store violations for 1 hour
	set_transient( $violation_key, $violations, HOUR_IN_SECONDS );
}

/**
 * Get audio file metadata
 * Retrieves and validates audio file information with comprehensive error handling
 *
 * @param WP_REST_Request $request Request object containing the audio file ID.
 * @return WP_REST_Response|WP_Error Response object with audio metadata or error.
 * @since 0.1.0
 */
function fluxwave_get_audio_metadata( $request ) {
	// Rate limiting: 60 requests per minute per IP
	$client_ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
	if ( ! fluxwave_check_rate_limit( $client_ip, 60 ) ) {
		// Log security event
		if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
			error_log( sprintf( 'Fluxwave: Rate limit exceeded for IP %s', $client_ip ) );
		}
		return new WP_Error( 'rate_limit_exceeded', __( 'Rate limit exceeded. Please try again later.', 'fluxwave' ), array( 'status' => 429 ) );
	}
	
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
		// Log potential security attempt
		if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
			error_log( sprintf( 'Fluxwave: Invalid attachment ID requested: %d (IP: %s)', $id, $client_ip ) );
		}
		return new WP_Error( 'not_found', __( 'Audio file not found', 'fluxwave' ), array( 'status' => 404 ) );
	}

	// Security: Verify it's an audio file with allowed MIME types
	$mime_type = get_post_mime_type( $id );
	$allowed_mime_types = array(
		'audio/mpeg',
		'audio/mp3',
		'audio/mp4',
		'audio/wav',
		'audio/ogg',
		'audio/webm',
		'audio/aac',
		'audio/flac',
		'audio/x-m4a',
	);
	
	if ( ! in_array( $mime_type, $allowed_mime_types, true ) ) {
		// Log potential security attempt
		if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
			error_log( sprintf( 'Fluxwave: Invalid MIME type requested: %s for ID %d (IP: %s)', $mime_type, $id, $client_ip ) );
		}
		return new WP_Error( 'invalid_type', __( 'File type not supported. Only audio files are allowed.', 'fluxwave' ), array( 'status' => 400 ) );
	}

	// Get attachment metadata
	$metadata = wp_get_attachment_metadata( $id );
	$file_url = wp_get_attachment_url( $id );
	$file_path = get_attached_file( $id );

	// Security: Validate file exists and is readable
	if ( ! $file_path || ! file_exists( $file_path ) ) {
		return new WP_Error( 'file_not_found', __( 'Audio file not found on server', 'fluxwave' ), array( 'status' => 404 ) );
	}
	
	// Security: Validate file size (max 100MB)
	$file_size = filesize( $file_path );
	$max_file_size = 100 * 1024 * 1024; // 100MB
	if ( $file_size > $max_file_size ) {
		return new WP_Error( 'file_too_large', __( 'Audio file is too large. Maximum size is 100MB.', 'fluxwave' ), array( 'status' => 413 ) );
	}

	$data = array(
		'id'       => $id,
		'title'    => sanitize_text_field( get_the_title( $id ) ),
		'url'      => esc_url_raw( $file_url ),
		'mime'     => sanitize_mime_type( $mime_type ),
		'filesize' => $file_size,
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

/**
 * Security monitoring: Log all API access attempts
 *
 * @param WP_REST_Request $request Request object.
 * @return void
 * @since 0.1.0
 */
function fluxwave_log_api_access( $request ) {
	if ( ! defined( 'WP_DEBUG' ) || ! WP_DEBUG ) {
		return;
	}
	
	$client_ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
	$user_agent = $_SERVER['HTTP_USER_AGENT'] ?? 'unknown';
	$endpoint = $request->get_route();
	$method = $request->get_method();
	
	error_log( sprintf( 
		'Fluxwave API Access: %s %s from %s (User-Agent: %s)', 
		$method, 
		$endpoint, 
		$client_ip, 
		substr( $user_agent, 0, 100 ) 
	) );
}
add_action( 'rest_api_init', function() {
	add_action( 'rest_request_before_callbacks', 'fluxwave_log_api_access' );
} );
