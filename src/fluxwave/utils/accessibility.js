/**
 * Accessibility Utilities
 * Helper functions for keyboard navigation and screen reader support
 *
 * @package
 */

import { __ } from '@wordpress/i18n';

/**
 * Handle keyboard events for player controls
 * Enhanced with more comprehensive keyboard shortcuts
 *
 * @param {KeyboardEvent} event
 * @param {Object}        handlers
 */
export const handlePlayerKeyboard = ( event, handlers ) => {
	const {
		onPlayPause,
		onSeek,
		onVolumeUp,
		onVolumeDown,
		onNext,
		onPrevious,
		onSkipForward,
		onSkipBackward,
	} = handlers;

	// Don't interfere with form inputs
	if (
		event.target.tagName === 'INPUT' ||
		event.target.tagName === 'TEXTAREA' ||
		event.target.contentEditable === 'true'
	) {
		return;
	}

	switch ( event.key ) {
		case ' ':
		case 'Enter':
			event.preventDefault();
			if ( onPlayPause ) {
				onPlayPause();
			}
			break;

		case 'ArrowLeft':
			event.preventDefault();
			if ( event.shiftKey && onPrevious ) {
				onPrevious();
			} else if ( event.ctrlKey && onSkipBackward ) {
				onSkipBackward();
			} else if ( onSeek ) {
				onSeek( 'backward' );
			}
			break;

		case 'ArrowRight':
			event.preventDefault();
			if ( event.shiftKey && onNext ) {
				onNext();
			} else if ( event.ctrlKey && onSkipForward ) {
				onSkipForward();
			} else if ( onSeek ) {
				onSeek( 'forward' );
			}
			break;

		case 'ArrowUp':
			event.preventDefault();
			if ( onVolumeUp ) {
				onVolumeUp();
			}
			break;

		case 'ArrowDown':
			event.preventDefault();
			if ( onVolumeDown ) {
				onVolumeDown();
			}
			break;

		case 'Home':
			event.preventDefault();
			if ( onSeek ) {
				onSeek( 'start' );
			}
			break;

		case 'End':
			event.preventDefault();
			if ( onSeek ) {
				onSeek( 'end' );
			}
			break;

		case 'PageUp':
			event.preventDefault();
			if ( onSeek ) {
				onSeek( 'forward-30' );
			}
			break;

		case 'PageDown':
			event.preventDefault();
			if ( onSeek ) {
				onSeek( 'backward-30' );
			}
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
export const announceToScreenReader = ( message, priority = 'polite' ) => {
	const announcement = document.createElement( 'div' );
	announcement.setAttribute( 'role', 'status' );
	announcement.setAttribute( 'aria-live', priority );
	announcement.setAttribute( 'aria-atomic', 'true' );
	announcement.className = 'sr-only';
	announcement.textContent = message;

	document.body.appendChild( announcement );

	// Remove after announcement
	setTimeout( () => {
		document.body.removeChild( announcement );
	}, 1000 );
};

/**
 * Format time for screen readers
 *
 * @param {number} seconds
 * @return {string} Formatted time string for screen readers
 */
export const formatTimeForScreenReader = ( seconds ) => {
	if ( ! seconds || isNaN( seconds ) ) {
		return '0 seconds';
	}

	const mins = Math.floor( seconds / 60 );
	const secs = Math.floor( seconds % 60 );

	if ( mins === 0 ) {
		return `${ secs } ${ secs === 1 ? 'second' : 'seconds' }`;
	}

	return `${ mins } ${ mins === 1 ? 'minute' : 'minutes' } and ${ secs } ${
		secs === 1 ? 'second' : 'seconds'
	}`;
};

/**
 * Get keyboard shortcuts help text
 *
 * @return {string} Formatted keyboard shortcuts help
 */
export const getKeyboardShortcutsHelp = () => {
	return [
		__( 'Keyboard Shortcuts:', 'fluxwave' ),
		__( 'Space or Enter: Play/Pause', 'fluxwave' ),
		__( 'Left/Right Arrow: Seek backward/forward', 'fluxwave' ),
		__( 'Shift + Left/Right: Previous/Next track', 'fluxwave' ),
		__( 'Ctrl + Left/Right: Skip 10 seconds', 'fluxwave' ),
		__( 'Home/End: Jump to start/end', 'fluxwave' ),
		__( 'Page Up/Down: Skip 30 seconds', 'fluxwave' ),
		__( 'Up/Down Arrow: Volume up/down', 'fluxwave' ),
	].join( '\n' );
};

export default {
	handlePlayerKeyboard,
	announceToScreenReader,
	formatTimeForScreenReader,
	getKeyboardShortcutsHelp,
};
