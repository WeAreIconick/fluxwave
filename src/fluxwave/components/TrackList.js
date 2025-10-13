/**
 * Track List Component
 * Simple list of tracks without drag-and-drop functionality
 * Renders track items with proper state management
 * 
 * @package Fluxwave
 * @since 0.1.0
 */

import { __ } from '@wordpress/i18n';
import { memo } from '@wordpress/element';
import TrackItem from './TrackItem';

/**
 * TrackList component for displaying a list of tracks
 * 
 * @param {Object} props - Component props
 * @param {Array} props.tracks - Array of track objects
 * @param {Function} props.onRemove - Callback to remove track
 * @param {string|number} props.activeTrackId - ID of currently active track
 * @param {Function} props.onSelectTrack - Callback to select track
 * @param {Function} props.onUpdateArtwork - Callback to update track artwork
 * @param {Function} props.onUpdateTrack - Callback to update track metadata
 * @param {Function} props.onMoveUp - Callback to move track up
 * @param {Function} props.onMoveDown - Callback to move track down
 * @returns {JSX.Element} The track list component
 * @since 0.1.0
 */
const TrackList = memo(({ tracks, onRemove, activeTrackId, onSelectTrack, onUpdateArtwork, onUpdateTrack, onMoveUp, onMoveDown }) => {
	// Empty state
	if (tracks.length === 0) {
		return (
			<div className="fluxwave-track-list-empty py-12 text-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
				<svg
					className="w-12 h-12 mx-auto mb-3 text-gray-400"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={1.5}
						d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
					/>
				</svg>
				<p className="text-gray-600 font-medium">
					{__('No tracks in playlist', 'fluxwave')}
				</p>
				<p className="text-sm text-gray-500 mt-1">
					{__('Use the "Add Audio Files" button to add tracks', 'fluxwave')}
				</p>
			</div>
		);
	}

	return (
		<div className="fluxwave-track-list space-y-2">
			{/* Skip link for keyboard users */}
			<div className="sr-only">
				<a 
					href="#transport-controls" 
					className="skip-link"
					onClick={(e) => {
						e.preventDefault();
						const controls = document.querySelector('#transport-controls');
						if (controls) {
							controls.focus();
							controls.scrollIntoView();
						}
					}}
				>
					{__('Skip to player controls', 'fluxwave')}
				</a>
			</div>
			
			<div role="list" aria-label={__('Playlist tracks', 'fluxwave')}>
				{tracks.map((track, index) => (
				<TrackItem
					key={track.id}
					track={track}
					index={index}
					isActive={track.id === activeTrackId}
					isFirst={index === 0}
					isLast={index === tracks.length - 1}
					onRemove={onRemove}
					onSelect={onSelectTrack}
					onUpdateArtwork={onUpdateArtwork}
					onUpdateTrack={onUpdateTrack}
					onMoveUp={onMoveUp}
					onMoveDown={onMoveDown}
				/>
			))}
			</div>
		</div>
	);
});

TrackList.displayName = 'TrackList';

export default TrackList;