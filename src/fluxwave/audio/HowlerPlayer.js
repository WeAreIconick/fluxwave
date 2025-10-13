/**
 * Howler.js Audio Player Wrapper
 * Provides a clean interface for audio playback
 * 
 * @package Fluxwave
 */

import { Howl, Howler } from 'howler';

// Global singleton pattern to prevent multiple instances
let globalHowlerInstance = null;

// Initialize global Howler settings immediately when module loads
if (typeof Howler !== 'undefined') {
	// Set a reasonable HTML5 pool size
	Howler.html5PoolSize = 50; // Reasonable size, not too large
	
	// Enable auto-unlock for better resource management
	Howler.autoUnlock = true;
	
	// Force cleanup of all inactive sounds immediately
	if (typeof Howler._unload === 'function') {
		Howler._unload();
	}
	
	// Set up periodic cleanup every 30 seconds
	setInterval(() => {
		if (typeof Howler !== 'undefined' && typeof Howler._unload === 'function') {
			Howler._unload();
		}
	}, 30000);
}

class HowlerPlayer {
	constructor() {
		this.sound = null;
		this.isDestroyed = false;
		this.loadPromise = null;
		this.currentUrl = null;
		
		// Ensure global settings are applied (redundant but safe)
		if (typeof Howler !== 'undefined') {
			Howler.html5PoolSize = 50;
			Howler.autoUnlock = true;
		}
	}

	/**
	 * Validate URL for security
	 * @param {string} url - URL to validate
	 * @returns {boolean}
	 */
	isValidUrl(url) {
		if (!url || typeof url !== 'string') {
			return false;
		}
		
		try {
			const urlObj = new URL(url, window.location.origin);
			// Only allow http(s) protocols
			return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
		} catch {
			return false;
		}
	}

	/**
	 * Load an audio file with comprehensive error handling
	 * 
	 * @param {string} url - Audio file URL
	 * @param {Object} callbacks - Event callbacks
	 * @returns {Promise<boolean>} Resolves when audio is loaded
	 * @throws {Error} If URL is invalid or player is destroyed
	 */
	load(url, callbacks = {}) {
		// Cancel any existing load operation
		if (this.loadPromise) {
			this.loadPromise.cancel?.();
		}

		this.loadPromise = new Promise((resolve, reject) => {
			if (this.isDestroyed) {
				reject(new Error('Player has been destroyed'));
				return;
			}

			// Security: Validate URL
			if (!this.isValidUrl(url)) {
				reject(new Error('Invalid audio URL'));
				console.error('Fluxwave: Invalid or unsafe URL provided:', url);
				return;
			}

			// If we already have a sound for this URL, reuse it
			if (this.sound && this.currentUrl === url) {
				if (callbacks.onLoad) callbacks.onLoad();
				resolve();
				return;
			}

			// Clean up existing sound completely and immediately
			this._cleanupCurrentSound();

			// Create new Howl instance with proper resource management
			try {
				this.sound = new Howl({
					src: [url],
					html5: false, // Use Web Audio API instead of HTML5 to avoid pool issues
					preload: true, // Preload metadata
					format: ['mp3', 'aac', 'opus', 'webm', 'ogg', 'wav', 'flac'],
					pool: 1, // Limit to 1 instance per Howl
					onload: () => {
						if (!this.isDestroyed) {
							this.currentUrl = url;
							if (callbacks.onLoad) callbacks.onLoad();
							resolve();
						}
					},
					onloaderror: (id, error) => {
						console.error('Howler load error:', error);
						if (callbacks.onError) callbacks.onError(error);
						reject(error);
					},
					onplay: () => {
						if (!this.isDestroyed && callbacks.onPlay) callbacks.onPlay();
					},
					onpause: () => {
						if (!this.isDestroyed && callbacks.onPause) callbacks.onPause();
					},
					onend: () => {
						if (!this.isDestroyed && callbacks.onEnd) callbacks.onEnd();
					},
					onstop: () => {
						if (!this.isDestroyed && callbacks.onStop) callbacks.onStop();
					},
					onseek: () => {
						if (!this.isDestroyed && callbacks.onSeek) callbacks.onSeek();
					},
				});
			} catch (error) {
				console.error('Error creating Howl:', error);
				reject(error);
			}
		});

		return this.loadPromise;
	}

	/**
	 * Clean up current sound instance
	 * @private
	 */
	_cleanupCurrentSound() {
		if (this.sound) {
			try {
				// Stop all playback
				this.sound.stop();
				// Unload and free resources immediately
				this.sound.unload();
			} catch (error) {
				console.warn('Error cleaning up previous sound:', error);
			}
			this.sound = null;
			this.currentUrl = null;
		}
	}

	/**
	 * Play audio
	 */
	play() {
		if (this.sound) {
			this.sound.play();
		}
	}

	/**
	 * Pause audio
	 */
	pause() {
		if (this.sound) {
			this.sound.pause();
		}
	}

	/**
	 * Stop audio
	 */
	stop() {
		if (this.sound) {
			this.sound.stop();
		}
	}

	/**
	 * Toggle play/pause
	 */
	toggle() {
		if (this.sound) {
			if (this.sound.playing()) {
				this.pause();
			} else {
				this.play();
			}
		}
	}

	/**
	 * Seek to position (in seconds)
	 * 
	 * @param {number} seconds - Position in seconds
	 */
	seek(seconds) {
		if (this.sound && !isNaN(seconds) && isFinite(seconds)) {
			this.sound.seek(Math.max(0, seconds));
		}
	}

	/**
	 * Get current playback position (in seconds)
	 * 
	 * @returns {number} Current position
	 */
	getCurrentTime() {
		if (!this.sound) return 0;
		
		const time = this.sound.seek();
		return (!isNaN(time) && isFinite(time)) ? time : 0;
	}

	/**
	 * Get total duration (in seconds)
	 * 
	 * @returns {number} Duration
	 */
	getDuration() {
		if (!this.sound) return 0;
		
		const dur = this.sound.duration();
		return (!isNaN(dur) && isFinite(dur)) ? dur : 0;
	}

	/**
	 * Check if audio is playing
	 * 
	 * @returns {boolean}
	 */
	isPlaying() {
		return this.sound ? this.sound.playing() : false;
	}

	/**
	 * Set volume (0-1)
	 * 
	 * @param {number} volume - Volume level
	 */
	setVolume(volume) {
		if (this.sound && !isNaN(volume)) {
			this.sound.volume(Math.max(0, Math.min(1, volume)));
		}
	}

	/**
	 * Get current volume (0-1)
	 * 
	 * @returns {number} Current volume
	 */
	getVolume() {
		return this.sound ? this.sound.volume() : 1;
	}

	/**
	 * Set playback rate (0.5-2.0)
	 * 
	 * @param {number} rate - Playback rate
	 */
	setRate(rate) {
		if (this.sound && !isNaN(rate)) {
			this.sound.rate(Math.max(0.5, Math.min(2, rate)));
		}
	}

	/**
	 * Get playback rate
	 * 
	 * @returns {number} Current rate
	 */
	getRate() {
		return this.sound ? this.sound.rate() : 1;
	}

	/**
	 * Clean up resources
	 */
	destroy() {
		this.isDestroyed = true;
		
		// Cancel any pending load operation
		if (this.loadPromise) {
			this.loadPromise.cancel?.();
			this.loadPromise = null;
		}
		
		// Clean up current sound
		this._cleanupCurrentSound();
		
		// Force cleanup of any remaining resources
		if (typeof Howler !== 'undefined') {
			try {
				// Unload all sounds to free HTML5 audio elements
				Howler._unload();
			} catch (error) {
				console.warn('Error during global Howler cleanup:', error);
			}
		}
	}
}

export default HowlerPlayer;
