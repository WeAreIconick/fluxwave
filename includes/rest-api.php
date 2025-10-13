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
					'sanitize_callback' => function( $param ) {
						return min( absint( $param ), 100 ); // Max 100 per page
					},
				),
				'page' => array(
					'default'           => 1,
					'sanitize_callback' => 'absint',
				),
				'search' => array(
					'sanitize_callback' => 'sanitize_text_field',
				),
			),
		)
	);
}
add_action( 'rest_api_init', 'fluxwave_register_rest_routes' );

/**
 * Comprehensive API request validation
 * Validates authentication, authorization, request size, and batch limits
 *
 * @param WP_REST_Request $request Request object.
 * @return bool|WP_Error True if valid, WP_Error if invalid.
 * @since 0.1.0
 */
function fluxwave_validate_api_request( $request ) {
	// 1. Validate request size (max 1KB for GET requests)
	$content_length = $request->get_header( 'Content-Length' );
	if ( $content_length && intval( $content_length ) > 1024 ) {
		fluxwave_log_security_event( 'request_too_large', array( 'size' => $content_length ) );
		return new WP_Error( 'request_too_large', __( 'Request payload too large', 'fluxwave' ), array( 'status' => 413 ) );
	}
	
	// 2. Check for batch requests
	$client_ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
	$batch_key = 'fluxwave_batch_' . md5( $client_ip );
	$batch_requests = get_transient( $batch_key ) ?: 0;
	
	if ( $batch_requests > 10 ) { // Max 10 requests per minute
		fluxwave_log_security_event( 'batch_limit_exceeded', array( 'requests' => $batch_requests ) );
		return new WP_Error( 'batch_limit_exceeded', __( 'Too many requests. Please slow down.', 'fluxwave' ), array( 'status' => 429 ) );
	}
	
	set_transient( $batch_key, $batch_requests + 1, MINUTE_IN_SECONDS );
	
	// 3. Advanced Authentication check
	if ( ! is_user_logged_in() ) {
		fluxwave_log_security_event( 'not_authenticated', array( 'route' => $request->get_route() ) );
		return new WP_Error( 'not_authenticated', __( 'Authentication required', 'fluxwave' ), array( 'status' => 401 ) );
	}
	
	// 4. Session validation and timeout check
	$user_id = get_current_user_id();
	if ( ! fluxwave_validate_user_session( $user_id ) ) {
		fluxwave_log_security_event( 'session_expired', array( 'user_id' => $user_id ) );
		return new WP_Error( 'session_expired', __( 'Session expired', 'fluxwave' ), array( 'status' => 401 ) );
	}
	
	// 5. Enhanced Authorization check with granular permissions
	if ( ! fluxwave_check_audio_access_permissions( $user_id ) ) {
		fluxwave_log_security_event( 'insufficient_permissions', array( 'user_id' => $user_id ) );
		return new WP_Error( 'insufficient_permissions', __( 'Insufficient permissions', 'fluxwave' ), array( 'status' => 403 ) );
	}
	
	// 6. Advanced nonce verification with time-based validation
	$nonce = $request->get_header( 'X-WP-Nonce' );
	if ( $nonce && ! wp_verify_nonce( $nonce, 'wp_rest' ) ) {
		fluxwave_log_security_event( 'invalid_nonce', array( 'nonce' => substr( $nonce, 0, 8 ) . '...' ) );
		return new WP_Error( 'invalid_nonce', __( 'Invalid nonce', 'fluxwave' ), array( 'status' => 403 ) );
	}
	
	// 7. User agent validation (basic bot detection)
	if ( ! fluxwave_validate_user_agent( $request->get_header( 'User-Agent' ) ) ) {
		fluxwave_log_security_event( 'invalid_user_agent', array( 'user_agent' => substr( $request->get_header( 'User-Agent' ), 0, 50 ) ) );
		return new WP_Error( 'invalid_user_agent', __( 'Invalid request', 'fluxwave' ), array( 'status' => 403 ) );
	}
	
	// 8. Request fingerprinting for additional security
	$fingerprint = fluxwave_generate_request_fingerprint( $request );
	if ( ! fluxwave_validate_request_fingerprint( $fingerprint, $client_ip ) ) {
		fluxwave_log_security_event( 'suspicious_request', array( 'fingerprint' => substr( $fingerprint, 0, 8 ) . '...' ) );
		return new WP_Error( 'suspicious_request', __( 'Suspicious request detected', 'fluxwave' ), array( 'status' => 403 ) );
	}
	
	return true;
}

/**
 * Validate user session and check for timeout
 *
 * @param int $user_id User ID.
 * @return bool True if session is valid.
 * @since 0.1.0
 */
function fluxwave_validate_user_session( $user_id ) {
	// Check if user exists and is active
	$user = get_user_by( 'id', $user_id );
	if ( ! $user || ! $user->exists() ) {
		return false;
	}
	
	// Check if user account is not locked
	if ( get_user_meta( $user_id, 'fluxwave_account_locked', true ) ) {
		return false;
	}
	
	// Check session timeout (24 hours)
	$last_activity = get_user_meta( $user_id, 'fluxwave_last_activity', true );
	if ( $last_activity && ( time() - $last_activity ) > DAY_IN_SECONDS ) {
		return false;
	}
	
	// Update last activity
	update_user_meta( $user_id, 'fluxwave_last_activity', time() );
	
	return true;
}

/**
 * Check granular audio access permissions
 *
 * @param int $user_id User ID.
 * @return bool True if user has audio access.
 * @since 0.1.0
 */
function fluxwave_check_audio_access_permissions( $user_id ) {
	// Basic read permission
	if ( ! current_user_can( 'read' ) ) {
		return false;
	}
	
	// Check for audio-specific permissions
	if ( current_user_can( 'upload_files' ) || current_user_can( 'edit_posts' ) ) {
		return true;
	}
	
	// Check custom audio access capability
	if ( current_user_can( 'fluxwave_access_audio' ) ) {
		return true;
	}
	
	// Check if user has specific audio access granted
	$audio_access = get_user_meta( $user_id, 'fluxwave_audio_access', true );
	if ( $audio_access && $audio_access > time() ) {
		return true;
	}
	
	return false;
}

/**
 * Validate user agent for basic bot detection
 *
 * @param string $user_agent User agent string.
 * @return bool True if user agent is valid.
 * @since 0.1.0
 */
function fluxwave_validate_user_agent( $user_agent ) {
	if ( empty( $user_agent ) ) {
		return false;
	}
	
	// Block known bot user agents
	$blocked_agents = array(
		'bot', 'crawler', 'spider', 'scraper', 'curl', 'wget',
		'python', 'java', 'php', 'perl', 'ruby', 'go-http'
	);
	
	$user_agent_lower = strtolower( $user_agent );
	foreach ( $blocked_agents as $blocked ) {
		if ( strpos( $user_agent_lower, $blocked ) !== false ) {
			return false;
		}
	}
	
	// Must contain browser indicators
	$browser_indicators = array( 'mozilla', 'webkit', 'chrome', 'firefox', 'safari', 'edge' );
	$has_browser = false;
	foreach ( $browser_indicators as $indicator ) {
		if ( strpos( $user_agent_lower, $indicator ) !== false ) {
			$has_browser = true;
			break;
		}
	}
	
	return $has_browser;
}

/**
 * Generate request fingerprint for security validation
 *
 * @param WP_REST_Request $request Request object.
 * @return string Request fingerprint.
 * @since 0.1.0
 */
function fluxwave_generate_request_fingerprint( $request ) {
	$components = array(
		$request->get_method(),
		$request->get_route(),
		$request->get_header( 'User-Agent' ),
		$request->get_header( 'Accept' ),
		$request->get_header( 'Accept-Language' ),
		$_SERVER['REMOTE_ADDR'] ?? 'unknown',
	);
	
	return md5( implode( '|', $components ) );
}

/**
 * Validate request fingerprint against known patterns
 *
 * @param string $fingerprint Request fingerprint.
 * @param string $client_ip Client IP address.
 * @return bool True if fingerprint is valid.
 * @since 0.1.0
 */
function fluxwave_validate_request_fingerprint( $fingerprint, $client_ip ) {
	// Check against known suspicious patterns
	$suspicious_key = 'fluxwave_suspicious_' . md5( $fingerprint );
	$suspicious_count = get_transient( $suspicious_key ) ?: 0;
	
	if ( $suspicious_count > 5 ) {
		return false;
	}
	
	// Check for rapid identical requests (potential automated attack)
	$rapid_key = 'fluxwave_rapid_' . md5( $fingerprint . $client_ip );
	$rapid_count = get_transient( $rapid_key ) ?: 0;
	
	if ( $rapid_count > 3 ) {
		// Mark as suspicious
		set_transient( $suspicious_key, $suspicious_count + 1, HOUR_IN_SECONDS );
		return false;
	}
	
	// Track rapid requests
	set_transient( $rapid_key, $rapid_count + 1, MINUTE_IN_SECONDS );
	
	return true;
}

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
	// Rate limiting: 60 requests per minute per IP (additional to batch limiting)
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

	// Optimized single query to get all attachment data
	global $wpdb;
	$attachment_data = $wpdb->get_row( $wpdb->prepare( "
		SELECT 
			p.ID,
			p.post_title,
			p.post_mime_type,
			pm_file.meta_value as file_path,
			pm_metadata.meta_value as metadata
		FROM {$wpdb->posts} p
		LEFT JOIN {$wpdb->postmeta} pm_file ON p.ID = pm_file.post_id AND pm_file.meta_key = '_wp_attached_file'
		LEFT JOIN {$wpdb->postmeta} pm_metadata ON p.ID = pm_metadata.post_id AND pm_metadata.meta_key = '_wp_attachment_metadata'
		WHERE p.ID = %d AND p.post_type = 'attachment'
	", $id ) );

	if ( ! $attachment_data ) {
		return new WP_Error( 'not_found', __( 'Audio file not found', 'fluxwave' ), array( 'status' => 404 ) );
	}

	// Parse metadata
	$metadata = $attachment_data->metadata ? maybe_unserialize( $attachment_data->metadata ) : array();
	$file_path = $attachment_data->file_path ? wp_upload_dir()['basedir'] . '/' . $attachment_data->file_path : '';
	$file_url = wp_get_attachment_url( $id );

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
 * Get paginated list of audio files
 * Retrieves audio files with pagination and search support
 *
 * @param WP_REST_Request $request Request object containing pagination parameters.
 * @return WP_REST_Response|WP_Error Response object with paginated audio data or error.
 * @since 0.1.0
 */
function fluxwave_get_audio_list( $request ) {
	// Rate limiting: 30 requests per minute per IP
	$client_ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
	if ( ! fluxwave_check_rate_limit( $client_ip, 30 ) ) {
		return new WP_Error( 'rate_limit_exceeded', __( 'Rate limit exceeded. Please try again later.', 'fluxwave' ), array( 'status' => 429 ) );
	}
	
	$per_page = $request->get_param( 'per_page' );
	$page = $request->get_param( 'page' );
	$search = $request->get_param( 'search' );
	
	// Performance: Check cache first
	$cache_key = 'fluxwave_audio_list_' . md5( serialize( array( $per_page, $page, $search ) ) );
	$cached_data = get_transient( $cache_key );
	
	if ( false !== $cached_data ) {
		return rest_ensure_response( $cached_data );
	}
	
	// Build query args
	$args = array(
		'post_type'      => 'attachment',
		'post_mime_type' => 'audio',
		'post_status'    => 'inherit',
		'posts_per_page' => $per_page,
		'paged'          => $page,
		'orderby'        => 'date',
		'order'          => 'DESC',
	);
	
	// Add search if provided
	if ( $search ) {
		$args['s'] = $search;
	}
	
	// Get total count for pagination headers
	$count_args = $args;
	$count_args['posts_per_page'] = -1;
	$count_args['fields'] = 'ids';
	$total_query = new WP_Query( $count_args );
	$total = $total_query->found_posts;
	
	// Get paginated results
	$query = new WP_Query( $args );
	$audio_files = array();
	
	if ( $query->have_posts() ) {
		while ( $query->have_posts() ) {
			$query->the_post();
			$id = get_the_ID();
			
			// Get basic metadata
			$metadata = wp_get_attachment_metadata( $id );
			$file_url = wp_get_attachment_url( $id );
			
			$audio_files[] = array(
				'id'       => $id,
				'title'    => sanitize_text_field( get_the_title() ),
				'url'      => esc_url_raw( $file_url ),
				'mime'     => sanitize_mime_type( get_post_mime_type( $id ) ),
				'duration' => isset( $metadata['length'] ) ? floatval( $metadata['length'] ) : 0,
			);
		}
	}
	
	wp_reset_postdata();
	
	$response_data = array(
		'audio_files' => $audio_files,
		'total'       => $total,
		'pages'       => ceil( $total / $per_page ),
		'current_page' => $page,
		'per_page'    => $per_page,
	);
	
	// Performance: Cache for 5 minutes
	set_transient( $cache_key, $response_data, 5 * MINUTE_IN_SECONDS );
	
	$response = rest_ensure_response( $response_data );
	
	// Add pagination headers
	$response->header( 'X-WP-Total', $total );
	$response->header( 'X-WP-TotalPages', ceil( $total / $per_page ) );
	
	return $response;
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
	add_filter( 'rest_pre_serve_request', 'fluxwave_add_cors_headers', 10, 4 );
	add_filter( 'rest_post_dispatch', 'fluxwave_handle_api_error', 10, 3 );
} );

/**
 * Add CORS headers for Fluxwave API endpoints
 * Ensures proper cross-origin request handling
 *
 * @param bool             $served Whether the request has already been served.
 * @param WP_REST_Response $result Result to send to the client.
 * @param WP_REST_Request  $request Request used to generate the response.
 * @param WP_REST_Server   $server Server instance.
 * @return bool Whether the request was served.
 * @since 0.1.0
 */
function fluxwave_add_cors_headers( $served, $result, $request, $server ) {
	// Only add CORS headers for Fluxwave endpoints
	if ( strpos( $request->get_route(), '/fluxwave/' ) === 0 ) {
		$origin = get_site_url();
		
		// Set CORS headers
		header( "Access-Control-Allow-Origin: {$origin}" );
		header( 'Access-Control-Allow-Methods: GET, OPTIONS' );
		header( 'Access-Control-Allow-Headers: X-WP-Nonce, Content-Type, Authorization' );
		header( 'Access-Control-Max-Age: 86400' );
		header( 'Access-Control-Allow-Credentials: true' );
		
		// Add comprehensive security headers
		header( 'X-Content-Type-Options: nosniff' );
		header( 'X-Frame-Options: SAMEORIGIN' );
		header( 'X-XSS-Protection: 1; mode=block' );
		header( 'Referrer-Policy: strict-origin-when-cross-origin' );
		header( 'Strict-Transport-Security: max-age=31536000; includeSubDomains' );
		header( 'Content-Security-Policy: default-src \'self\'; script-src \'self\' \'unsafe-inline\'; style-src \'self\' \'unsafe-inline\'; img-src \'self\' data: https:; media-src \'self\' https:; connect-src \'self\';' );
		header( 'Permissions-Policy: geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), speaker=()' );
		header( 'X-Permitted-Cross-Domain-Policies: none' );
		header( 'Cross-Origin-Embedder-Policy: require-corp' );
		header( 'Cross-Origin-Opener-Policy: same-origin' );
		header( 'Cross-Origin-Resource-Policy: same-origin' );
		
		// Handle preflight OPTIONS requests
		if ( $request->get_method() === 'OPTIONS' ) {
			status_header( 200 );
			exit;
		}
	}
	
	return $served;
}

/**
 * Sanitize error messages for production
 * Prevents sensitive information leakage
 *
 * @param WP_Error $error Error object.
 * @return WP_Error Sanitized error object.
 * @since 0.1.0
 */
function fluxwave_sanitize_error_message( $error ) {
	// In production, sanitize error messages to prevent information leakage
	if ( ! defined( 'WP_DEBUG' ) || ! WP_DEBUG ) {
		$error_code = $error->get_error_code();
		$sanitized_messages = array(
			'request_too_large' => __( 'Request too large', 'fluxwave' ),
			'batch_limit_exceeded' => __( 'Too many requests', 'fluxwave' ),
			'not_authenticated' => __( 'Authentication required', 'fluxwave' ),
			'insufficient_permissions' => __( 'Access denied', 'fluxwave' ),
			'invalid_nonce' => __( 'Invalid request', 'fluxwave' ),
			'rate_limit_exceeded' => __( 'Rate limit exceeded', 'fluxwave' ),
			'not_found' => __( 'Resource not found', 'fluxwave' ),
			'invalid_type' => __( 'Invalid file type', 'fluxwave' ),
			'file_not_found' => __( 'File not found', 'fluxwave' ),
			'file_too_large' => __( 'File too large', 'fluxwave' ),
		);
		
		if ( isset( $sanitized_messages[ $error_code ] ) ) {
			return new WP_Error( $error_code, $sanitized_messages[ $error_code ], $error->get_error_data() );
		}
	}
	
	return $error;
}

/**
 * Enhanced error handling for API responses
 * Applies sanitization and logging
 *
 * @param WP_REST_Response|WP_Error $response Response object.
 * @param WP_REST_Server            $server Server object.
 * @param WP_REST_Request           $request Request object.
 * @return WP_REST_Response|WP_Error Processed response.
 * @since 0.1.0
 */
function fluxwave_handle_api_error( $response, $server, $request ) {
	// Only process Fluxwave API errors
	if ( ! $request || strpos( $request->get_route(), '/fluxwave/' ) !== 0 ) {
		return $response;
	}
	
	// If it's an error, sanitize and log
	if ( is_wp_error( $response ) ) {
		// Log error for monitoring
		if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
			$client_ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
			error_log( sprintf( 
				'Fluxwave API Error: %s - %s (IP: %s, Route: %s)', 
				$response->get_error_code(),
				$response->get_error_message(),
				$client_ip,
				$request->get_route()
			) );
		}
		
		// Sanitize error message
		$response = fluxwave_sanitize_error_message( $response );
	}
	
	return $response;
}

/**
 * Advanced security monitoring and alerting
 * Tracks security events and triggers alerts
 *
 * @param string $event_type Type of security event.
 * @param array  $event_data Event data.
 * @return void
 * @since 0.1.0
 */
function fluxwave_log_security_event( $event_type, $event_data = array() ) {
	$client_ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
	$user_id = get_current_user_id();
	$timestamp = current_time( 'mysql' );
	
	// Create security event record
	$event = array(
		'type' => $event_type,
		'ip' => $client_ip,
		'user_id' => $user_id,
		'timestamp' => $timestamp,
		'data' => $event_data,
		'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown',
		'request_uri' => $_SERVER['REQUEST_URI'] ?? 'unknown',
	);
	
	// Log to error log
	error_log( sprintf( 
		'Fluxwave Security Event: %s - IP: %s, User: %d, Data: %s', 
		$event_type, 
		$client_ip, 
		$user_id, 
		wp_json_encode( $event_data ) 
	) );
	
	// Store in database for analysis
	$security_logs = get_option( 'fluxwave_security_logs', array() );
	$security_logs[] = $event;
	
	// Keep only last 1000 events
	if ( count( $security_logs ) > 1000 ) {
		$security_logs = array_slice( $security_logs, -1000 );
	}
	
	update_option( 'fluxwave_security_logs', $security_logs );
	
	// Check for security thresholds and trigger alerts
	fluxwave_check_security_thresholds( $event_type, $client_ip );
}

/**
 * Check security thresholds and trigger alerts
 *
 * @param string $event_type Type of security event.
 * @param string $client_ip Client IP address.
 * @return void
 * @since 0.1.0
 */
function fluxwave_check_security_thresholds( $event_type, $client_ip ) {
	// Check for suspicious activity patterns
	$suspicious_key = 'fluxwave_suspicious_activity_' . md5( $client_ip );
	$suspicious_count = get_transient( $suspicious_key ) ?: 0;
	
	// Increment suspicious activity counter
	$suspicious_count++;
	set_transient( $suspicious_key, $suspicious_count, HOUR_IN_SECONDS );
	
	// Alert thresholds
	$thresholds = array(
		'rate_limit_exceeded' => 5,
		'batch_limit_exceeded' => 3,
		'invalid_nonce' => 3,
		'suspicious_request' => 2,
		'invalid_user_agent' => 2,
	);
	
	if ( isset( $thresholds[ $event_type ] ) && $suspicious_count >= $thresholds[ $event_type ] ) {
		// Trigger security alert
		fluxwave_trigger_security_alert( $event_type, $client_ip, $suspicious_count );
	}
}

/**
 * Trigger security alert for administrators
 *
 * @param string $event_type Type of security event.
 * @param string $client_ip Client IP address.
 * @param int    $count Number of occurrences.
 * @return void
 * @since 0.1.0
 */
function fluxwave_trigger_security_alert( $event_type, $client_ip, $count ) {
	// Send email alert to administrators
	$admin_email = get_option( 'admin_email' );
	$site_name = get_bloginfo( 'name' );
	
	$subject = sprintf( '[%s] Security Alert: %s', $site_name, $event_type );
	$message = sprintf( 
		"A security event has been detected on your WordPress site:\n\n" .
		"Event Type: %s\n" .
		"IP Address: %s\n" .
		"Occurrences: %d\n" .
		"Time: %s\n" .
		"Site: %s\n\n" .
		"Please review your security logs and consider taking appropriate action.",
		$event_type,
		$client_ip,
		$count,
		current_time( 'mysql' ),
		get_site_url()
	);
	
	wp_mail( $admin_email, $subject, $message );
	
	// Log the alert
	error_log( sprintf( 
		'Fluxwave Security Alert Triggered: %s - IP: %s, Count: %d', 
		$event_type, 
		$client_ip, 
		$count 
	) );
}

/**
 * Get security statistics for monitoring
 *
 * @return array Security statistics.
 * @since 0.1.0
 */
function fluxwave_get_security_stats() {
	$security_logs = get_option( 'fluxwave_security_logs', array() );
	$stats = array(
		'total_events' => count( $security_logs ),
		'events_by_type' => array(),
		'events_by_ip' => array(),
		'recent_events' => array_slice( $security_logs, -10 ),
	);
	
	// Count events by type and IP
	foreach ( $security_logs as $event ) {
		$type = $event['type'];
		$ip = $event['ip'];
		
		$stats['events_by_type'][ $type ] = ( $stats['events_by_type'][ $type ] ?? 0 ) + 1;
		$stats['events_by_ip'][ $ip ] = ( $stats['events_by_ip'][ $ip ] ?? 0 ) + 1;
	}
	
	return $stats;
}
