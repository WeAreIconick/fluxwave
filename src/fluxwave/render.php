<?php
/**
 * Frontend Rendering Template
 * 
 * @package Fluxwave
 * @see https://github.com/WordPress/gutenberg/blob/trunk/docs/reference-guides/block-api/block-metadata.md#render
 */

// Security: Validate and sanitize all inputs
$tracks = isset( $attributes['tracks'] ) && is_array( $attributes['tracks'] ) ? $attributes['tracks'] : array();
$autoplay = isset( $attributes['autoplay'] ) && (bool) $attributes['autoplay'];
$loop = isset( $attributes['loop'] ) && (bool) $attributes['loop'];
$accent_color = isset( $attributes['accentColor'] ) ? sanitize_hex_color( $attributes['accentColor'] ) : '#06b6d4';

// Sanitize track data for security
$sanitized_tracks = array();
foreach ( $tracks as $track ) {
	if ( ! is_array( $track ) ) {
		continue;
	}
	
	$sanitized_tracks[] = array(
		'id'       => isset( $track['id'] ) ? absint( $track['id'] ) : 0,
		'url'      => isset( $track['url'] ) ? esc_url_raw( $track['url'] ) : '',
		'title'    => isset( $track['title'] ) ? sanitize_text_field( $track['title'] ) : '',
		'artist'   => isset( $track['artist'] ) ? sanitize_text_field( $track['artist'] ) : '',
		'album'    => isset( $track['album'] ) ? sanitize_text_field( $track['album'] ) : '',
		'artwork'  => isset( $track['artwork'] ) ? esc_url_raw( $track['artwork'] ) : '',
		'duration' => isset( $track['duration'] ) ? floatval( $track['duration'] ) : 0,
	);
}

// Prepare data for frontend script with additional sanitization
$player_data = array(
	'tracks'      => array_map( function( $track ) {
		return array(
			'id'       => absint( $track['id'] ),
			'url'      => esc_url_raw( $track['url'] ),
			'title'    => sanitize_text_field( $track['title'] ),
			'artist'   => sanitize_text_field( $track['artist'] ),
			'album'    => sanitize_text_field( $track['album'] ),
			'artwork'  => esc_url_raw( $track['artwork'] ),
			'duration' => floatval( $track['duration'] ),
		);
	}, $sanitized_tracks ),
	'autoplay'    => (bool) $autoplay,
	'loop'        => (bool) $loop,
	'accentColor' => sanitize_hex_color( $accent_color ),
);

// Generate unique ID for this block instance
$block_id = 'fluxwave-player-' . wp_unique_id();

// Get wrapper attributes (already escaped by WordPress core)
$wrapper_attributes = get_block_wrapper_attributes( 
	array(
		'id' => $block_id,
		'class' => 'fluxwave-player-block',
		'data-player-config' => esc_attr( wp_json_encode( $player_data ) ),
	)
);
?>

<div <?php echo $wrapper_attributes; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Escaped by get_block_wrapper_attributes() ?>>
	<?php if ( empty( $tracks ) ) : ?>
		<div class="fluxwave-empty-state p-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 text-center">
			<svg class="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
			</svg>
			<p class="text-gray-600 font-medium"><?php esc_html_e( 'No tracks in playlist', 'fluxwave' ); ?></p>
			<p class="text-sm text-gray-500 mt-1"><?php esc_html_e( 'Please add audio files in the block editor', 'fluxwave' ); ?></p>
		</div>
	<?php else : ?>
		<!-- Player will be initialized by view.js -->
		<div class="fluxwave-player-container">
			<div class="text-center py-8">
				<div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
				<p class="mt-2 text-sm text-gray-600"><?php esc_html_e( 'Loading player...', 'fluxwave' ); ?></p>
			</div>
		</div>
	<?php endif; ?>
</div>
