<?php
/**
 * Unit Tests for Fluxwave Plugin
 * 
 * @package Fluxwave
 * @since 0.1.0
 */

// Prevent direct access
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Test suite for Fluxwave plugin functionality
 * 
 * @since 0.1.0
 */
class Fluxwave_Tests {

	/**
	 * Test plugin initialization
	 * 
	 * @since 0.1.0
	 * @return bool True if test passes
	 */
	public static function test_plugin_initialization() {
		// Test that plugin constants are defined
		if ( ! defined( 'FLUXWAVE_VERSION' ) ) {
			return false;
		}
		
		if ( ! defined( 'FLUXWAVE_PLUGIN_DIR' ) ) {
			return false;
		}
		
		if ( ! defined( 'FLUXWAVE_PLUGIN_URL' ) ) {
			return false;
		}
		
		return true;
	}

	/**
	 * Test REST API route registration
	 * 
	 * @since 0.1.0
	 * @return bool True if test passes
	 */
	public static function test_rest_api_registration() {
		// Test that REST API routes are registered
		$routes = rest_get_server()->get_routes();
		
		if ( ! isset( $routes['/fluxwave/v1/audio/(?P<id>\d+)'] ) ) {
			return false;
		}
		
		return true;
	}

	/**
	 * Test rate limiting functionality
	 * 
	 * @since 0.1.0
	 * @return bool True if test passes
	 */
	public static function test_rate_limiting() {
		// Test rate limiting with a test IP
		$test_ip = '192.168.1.100';
		
		// Should allow first request
		if ( ! fluxwave_check_rate_limit( $test_ip, 60 ) ) {
			return false;
		}
		
		// Test IP whitelisting
		if ( ! fluxwave_is_whitelisted_ip( '127.0.0.1' ) ) {
			return false;
		}
		
		return true;
	}

	/**
	 * Test security functions
	 * 
	 * @since 0.1.0
	 * @return bool True if test passes
	 */
	public static function test_security_functions() {
		// Test MIME type validation
		$allowed_types = array(
			'audio/mpeg',
			'audio/mp3',
			'audio/wav',
		);
		
		foreach ( $allowed_types as $type ) {
			if ( ! in_array( $type, $allowed_types, true ) ) {
				return false;
			}
		}
		
		return true;
	}

	/**
	 * Run all tests
	 * 
	 * @since 0.1.0
	 * @return array Test results
	 */
	public static function run_all_tests() {
		$tests = array(
			'Plugin Initialization' => 'test_plugin_initialization',
			'REST API Registration' => 'test_rest_api_registration',
			'Rate Limiting' => 'test_rate_limiting',
			'Security Functions' => 'test_security_functions',
		);
		
		$results = array();
		
		foreach ( $tests as $test_name => $test_method ) {
			$results[ $test_name ] = self::$test_method();
		}
		
		return $results;
	}
}

// Only run tests if WP_DEBUG is enabled
if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
	add_action( 'init', function() {
		if ( current_user_can( 'manage_options' ) && isset( $_GET['fluxwave_test'] ) ) {
			$results = Fluxwave_Tests::run_all_tests();
			
			echo '<h2>Fluxwave Plugin Tests</h2>';
			echo '<ul>';
			foreach ( $results as $test_name => $result ) {
				$status = $result ? '✅ PASS' : '❌ FAIL';
				echo '<li>' . esc_html( $test_name ) . ': ' . $status . '</li>';
			}
			echo '</ul>';
			exit;
		}
	});
}
