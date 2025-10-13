/**
 * Frontend Script
 * Initializes the Fluxwave player on the frontend
 * Handles multiple player instances and provides security validation
 * 
 * @package Fluxwave
 * @since 0.1.0
 */

import { createRoot } from '@wordpress/element';
import AudioPlayer from './components/AudioPlayer';
import domReady from '@wordpress/dom-ready';
import './style.scss';

// Store root instances for cleanup
const rootInstances = new Map();

/**
 * Initialize all Fluxwave players on the page
 * Scans for all player blocks and initializes them with proper configuration
 * 
 * @returns {void}
 * @since 0.1.0
 */
function initPlayers() {
	const playerBlocks = document.querySelectorAll('.fluxwave-player-block');

	playerBlocks.forEach((block) => {
		const configData = block.getAttribute('data-player-config');
		
		if (!configData) {
			console.error('Fluxwave: No player configuration found');
			return;
		}

		try {
			// Security: Validate JSON before parsing
			const config = JSON.parse(configData);
			
			// Security: Validate config structure
			if (typeof config !== 'object' || config === null) {
				console.error('Fluxwave: Invalid player configuration');
				return;
			}
			
			// Security: Sanitize accent color
			if (config.accentColor && !/^#[0-9A-Fa-f]{6}$/.test(config.accentColor)) {
				config.accentColor = '#06b6d4'; // Use default if invalid
			}
			
			// Security: Validate tracks array
			if (config.tracks && Array.isArray(config.tracks)) {
				config.tracks = config.tracks.filter(track => {
					// Ensure track has required properties and valid URL
					return track && 
						   typeof track === 'object' && 
						   track.url && 
						   typeof track.url === 'string' &&
						   (track.url.startsWith('http://') || track.url.startsWith('https://'));
				});
			}
			
			const container = block.querySelector('.fluxwave-player-container');

			if (!container) {
				console.error('Fluxwave: Player container not found');
				return;
			}

			// Clean up existing root if it exists
			if (rootInstances.has(container)) {
				const existingRoot = rootInstances.get(container);
				existingRoot.unmount();
				rootInstances.delete(container);
			}

			// Create React root and render player
			const root = createRoot(container);
			rootInstances.set(container, root);
			
			root.render(
				<AudioPlayer
					tracks={config.tracks || []}
					autoplay={config.autoplay === true}
					loop={config.loop === true}
					accentColor={config.accentColor || '#06b6d4'}
				/>
			);
		} catch (error) {
			console.error('Fluxwave: Error initializing player', error);
		}
	});
}

/**
 * Cleanup all players
 */
function cleanupPlayers() {
	rootInstances.forEach((root) => {
		try {
			root.unmount();
		} catch (error) {
			console.error('Error unmounting Fluxwave player:', error);
		}
	});
	rootInstances.clear();
}

// Initialize when DOM is ready
domReady(() => {
	initPlayers();
});

// Cleanup on page unload
window.addEventListener('beforeunload', cleanupPlayers);

// For SPA navigation (if applicable)
if (typeof window.addEventListener !== 'undefined') {
	window.addEventListener('popstate', cleanupPlayers);
}
