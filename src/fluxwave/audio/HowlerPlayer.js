/**
 * Howler.js Audio Player Wrapper
 * Provides a clean interface for audio playback
 * 
 * @package Fluxwave
 */

import { Howl, Howler } from 'howler';

class HowlerPlayer {
	constructor() {
		this.sound = null;
		this.isDestroyed = false;
		
		// Set a very large HTML5 pool size to prevent exhaustion
		// This is set once globally for all instances
		if (typeof Howler !== 'undefined') {
			Howler.html5PoolSize = 100;
			// Also unload all inactive sounds periodically
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
	 * Load an audio file
	 * 
	 * @param {string} url - Audio file URL
	 * @param {Object} callbacks - Event callbacks
	 * @returns {Promise} Resolves when audio is loaded
	 */
	load(url, callbacks = {}) {
		return new Promise((resolve, reject) => {
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

			// Clean up existing sound completely and immediately
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
			}

			// Create new Howl instance immediately (no delay)
			try {
				this.sound = new Howl({
					src: [url],
					html5: true, // Enable streaming for large files
					preload: true, // Preload metadata
					format: ['mp3', 'aac', 'opus', 'webm', 'ogg', 'wav', 'flac'],
					pool: 1, // Limit to 1 instance per Howl
					onload: () => {
						if (!this.isDestroyed) {
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
		
		if (this.sound) {
			try {
				// Stop playback first
				if (this.sound.playing()) {
					this.sound.stop();
				}
				// Unload to free resources
				this.sound.unload();
			} catch (error) {
				console.warn('Error during sound cleanup:', error);
			}
			this.sound = null;
		}
	}
}

export default HowlerPlayer;
