/**
 * Accessibility Utilities
 * Helper functions for keyboard navigation and screen reader support
 * 
 * @package Fluxwave
 */

/**
 * Handle keyboard events for player controls
 * 
 * @param {KeyboardEvent} event
 * @param {Object} handlers
 */
export const handlePlayerKeyboard = (event, handlers) => {
	const { onPlayPause, onSeek, onVolumeUp, onVolumeDown, onNext, onPrevious } = handlers;

	switch (event.key) {
		case ' ':
		case 'Enter':
			event.preventDefault();
			if (onPlayPause) onPlayPause();
			break;

		case 'ArrowLeft':
			event.preventDefault();
			if (event.shiftKey && onPrevious) {
				onPrevious();
			} else if (onSeek) {
				onSeek('backward');
			}
			break;

		case 'ArrowRight':
			event.preventDefault();
			if (event.shiftKey && onNext) {
				onNext();
			} else if (onSeek) {
				onSeek('forward');
			}
			break;

		case 'ArrowUp':
			event.preventDefault();
			if (onVolumeUp) onVolumeUp();
			break;

		case 'ArrowDown':
			event.preventDefault();
			if (onVolumeDown) onVolumeDown();
			break;

		default:
			break;
	}
};

/**
 * Announce to screen readers
 * 
 * @param {string} message
 * @param {string} priority - 'polite' or 'assertive'
 */
export const announceToScreenReader = (message, priority = 'polite') => {
	const announcement = document.createElement('div');
	announcement.setAttribute('role', 'status');
	announcement.setAttribute('aria-live', priority);
	announcement.setAttribute('aria-atomic', 'true');
	announcement.className = 'sr-only';
	announcement.textContent = message;

	document.body.appendChild(announcement);

	// Remove after announcement
	setTimeout(() => {
		document.body.removeChild(announcement);
	}, 1000);
};

/**
 * Format time for screen readers
 * 
 * @param {number} seconds
 * @returns {string}
 */
export const formatTimeForScreenReader = (seconds) => {
	if (!seconds || isNaN(seconds)) return '0 seconds';

	const mins = Math.floor(seconds / 60);
	const secs = Math.floor(seconds % 60);

	if (mins === 0) {
		return `${secs} ${secs === 1 ? 'second' : 'seconds'}`;
	}

	return `${mins} ${mins === 1 ? 'minute' : 'minutes'} and ${secs} ${secs === 1 ? 'second' : 'seconds'}`;
};

export default {
	handlePlayerKeyboard,
	announceToScreenReader,
	formatTimeForScreenReader,
};
