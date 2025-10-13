/**
 * Track List Component
 * Simple list of tracks without drag-and-drop functionality
 * 
 * @package Fluxwave
 */

import { __ } from '@wordpress/i18n';
import { memo } from '@wordpress/element';
import TrackItem from './TrackItem';

const TrackList = memo(({ tracks, onRemove, activeTrackId, onSelectTrack, onUpdateArtwork, onUpdateTrack }) => {
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
			{tracks.map((track, index) => (
				<TrackItem
					key={track.id}
					track={track}
					index={index}
					isActive={track.id === activeTrackId}
					onRemove={onRemove}
					onSelect={onSelectTrack}
					onUpdateArtwork={onUpdateArtwork}
					onUpdateTrack={onUpdateTrack}
				/>
			))}
		</div>
	);
});

TrackList.displayName = 'TrackList';

export default TrackList;