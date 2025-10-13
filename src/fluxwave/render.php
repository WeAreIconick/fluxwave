<?php
/**
 * Frontend Rendering Template
 * Renders the Fluxwave audio player block on the frontend with comprehensive security validation
 * 
 * @package Fluxwave
 * @since 0.1.0
 * @see https://github.com/WordPress/gutenberg/blob/trunk/docs/reference-guides/block-api/block-metadata.md#render
 */

// Security: Validate and sanitize all inputs
$tracks = isset( $attributes['tracks'] ) && is_array( $attributes['tracks'] ) ? $attributes['tracks'] : array();
$autoplay = isset( $attributes['autoplay'] ) && (bool) $attributes['autoplay'];
$loop = isset( $attributes['loop'] ) && (bool) $attributes['loop'];
$accent_color = isset( $attributes['accentColor'] ) ? sanitize_hex_color( $attributes['accentColor'] ) : '#06b6d4';
$theme = isset( $attributes['theme'] ) ? sanitize_text_field( $attributes['theme'] ) : 'light';

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
	'theme'       => sanitize_text_field( $theme ),
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
	<style>
		/* Critical CSS to prevent FOUC */
		.fluxwave-player-block {
			opacity: 1;
			transition: opacity 0.3s ease-in-out;
		}
		.fluxwave-player-block.loading {
			opacity: 1;
		}
		.fluxwave-player-block.loaded {
			opacity: 1;
		}
		.fluxwave-audio-player {
			position: relative;
			opacity: 1;
			transition: opacity 0.5s ease-in-out;
		}
		.fluxwave-player-container {
			position: relative;
		}
		/* Hide only the skeleton loader when React is ready */
		.fluxwave-player-container.react-ready .fluxwave-skeleton {
			opacity: 0;
			pointer-events: none;
			transition: opacity 0.3s ease-in-out;
		}
		@keyframes pulse {
			0%, 100% { opacity: 1; }
			50% { opacity: 0.5; }
		}
		.animate-pulse {
			animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
		}
	</style>
	<?php if ( empty( $tracks ) ) : ?>
		<div class="fluxwave-empty-state p-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 text-center">
			<svg class="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
			</svg>
			<p class="text-gray-600 dark:text-white font-medium"><?php esc_html_e( 'No tracks in playlist', 'fluxwave' ); ?></p>
			<p class="text-sm text-gray-500 mt-1"><?php esc_html_e( 'Please add audio files in the block editor', 'fluxwave' ); ?></p>
		</div>
	<?php else : ?>
		<!-- Player will be initialized by view.js -->
		<div class="fluxwave-player-container">
			<!-- Skeleton loader that matches the final player layout -->
			<div class="fluxwave-audio-player fluxwave-skeleton w-full opacity-100 <?php echo $theme === 'dark' ? 'dark' : ''; ?>" style="--accent-color: <?php echo esc_attr( $accent_color ); ?>">
				<div class="bg-white dark:bg-black p-6 pb-8 sm:p-12 sm:pb-10 lg:p-8 xl:p-12 xl:pb-10 space-y-6 sm:space-y-8 lg:space-y-6 xl:space-y-8 items-center rounded-t-xl">
					<!-- Track Info Skeleton -->
					<div class="flex items-center space-x-4">
						<div class="flex-shrink-0">
							<div class="w-22 h-22 rounded-lg bg-gray-200 dark:bg-gray-800 animate-pulse"></div>
						</div>
						<div class="min-w-0 flex-auto space-y-1">
							<div class="h-4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse w-16"></div>
							<div class="h-3 bg-gray-200 dark:bg-gray-800 rounded animate-pulse w-24"></div>
							<div class="h-5 bg-gray-200 dark:bg-gray-800 rounded animate-pulse w-32"></div>
						</div>
					</div>
					
					<!-- Progress Bar Skeleton -->
					<div class="space-y-2">
						<div class="bg-gray-200 dark:bg-gray-800 rounded-full h-2 animate-pulse"></div>
						<div class="flex justify-between text-sm">
							<div class="h-4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse w-8"></div>
							<div class="h-4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse w-8"></div>
						</div>
					</div>
				</div>
				
				<!-- Transport Controls Skeleton -->
				<div class="bg-white dark:bg-black text-gray-600 dark:text-white flex items-center relative px-8 py-6 rounded-b-xl">
					<div class="flex-auto flex items-center justify-evenly">
						<div class="w-6 h-6 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
						<div class="w-6 h-6 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
						<div class="w-6 h-6 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
					</div>
					
					<!-- Play Button Skeleton -->
					<div class="bg-white dark:bg-white text-gray-900 dark:text-black flex-none -my-2 mx-auto w-20 h-20 rounded-full ring-1 ring-slate-900/5 shadow-md flex items-center justify-center">
						<div class="w-8 h-8 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
					</div>
					
					<div class="flex-auto flex items-center justify-evenly">
						<div class="w-6 h-6 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
						<div class="w-6 h-6 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
						<div class="w-12 h-6 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
					</div>
				</div>
			</div>
		</div>
	<?php endif; ?>
</div>
