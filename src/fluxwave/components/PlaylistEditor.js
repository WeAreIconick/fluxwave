/**
 * Playlist Editor Component
 * Manage tracks in the block editor with full CRUD operations
 * Handles media selection, track management, and playlist organization
 * 
 * @package Fluxwave
 * @since 0.1.0
 */

import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import { MediaUpload, MediaUploadCheck } from '@wordpress/block-editor';
import TrackList from './TrackList';

/**
 * PlaylistEditor component for managing the entire playlist
 * 
 * @param {Object} props - Component props
 * @param {Array} props.tracks - Array of track objects
 * @param {Function} props.onChange - Callback when tracks change
 * @returns {JSX.Element} The playlist editor component
 * @since 0.1.0
 */
const PlaylistEditor = ({ tracks, onChange }) => {
	const [selectedTrackId, setSelectedTrackId] = useState(null);

	/**
	 * Handle media selection
	 */
	const handleSelectMedia = (media) => {
		const newTracks = media.map((item) => {
			// Try to get duration from various possible properties
			let duration = 0;
			
			// WordPress stores duration in meta.length_formatted (string like "3:45")
			// or meta.length (seconds as number or string)
			if (item.meta?.length_formatted) {
				// Parse "3:45" format
				const parts = String(item.meta.length_formatted).split(':');
				if (parts.length === 2) {
					const mins = parseInt(parts[0], 10) || 0;
					const secs = parseInt(parts[1], 10) || 0;
					duration = (mins * 60) + secs;
				}
			} else if (item.meta?.length) {
				duration = parseFloat(item.meta.length);
			} else if (item.fileLength) {
				duration = parseFloat(item.fileLength);
			}
			
			return {
				id: item.id,
				url: item.url,
				title: item.title || item.filename,
				artist: item.meta?.artist || '',
				album: item.meta?.album || '',
				artwork: item.sizes?.thumbnail?.url || item.icon,
				artworkId: null,
				duration: !isNaN(duration) && isFinite(duration) && duration > 0 ? duration : 0,
			};
		});

		onChange([...tracks, ...newTracks]);
	};


	/**
	 * Handle track removal
	 */
	const handleRemove = (trackId) => {
		const newTracks = tracks.filter((t) => t.id !== trackId);
		onChange(newTracks);
		
		if (selectedTrackId === trackId) {
			setSelectedTrackId(null);
		}
	};

	/**
	 * Handle artwork update
	 */
	const handleUpdateArtwork = (trackId, artworkUrl) => {
		const newTracks = tracks.map((track) => {
			if (track.id === trackId) {
				return {
					...track,
					artwork: artworkUrl,
				};
			}
			return track;
		});
		onChange(newTracks);
	};

	/**
	 * Handle track metadata update
	 */
	const handleUpdateTrack = (trackId, updates) => {
		const newTracks = tracks.map((track) => {
			if (track.id === trackId) {
				return {
					...track,
					...updates,
				};
			}
			return track;
		});
		onChange(newTracks);
	};

	/**
	 * Handle clear all
	 */
	const handleClearAll = () => {
		if (window.confirm(__('Are you sure you want to remove all tracks?', 'fluxwave'))) {
			onChange([]);
			setSelectedTrackId(null);
		}
	};

	/**
	 * Handle move track up
	 */
	const handleMoveUp = (trackId) => {
		const trackIndex = tracks.findIndex(track => track.id === trackId);
		if (trackIndex > 0) {
			const newTracks = [...tracks];
			[newTracks[trackIndex - 1], newTracks[trackIndex]] = [newTracks[trackIndex], newTracks[trackIndex - 1]];
			onChange(newTracks);
		}
	};

	/**
	 * Handle move track down
	 */
	const handleMoveDown = (trackId) => {
		const trackIndex = tracks.findIndex(track => track.id === trackId);
		if (trackIndex < tracks.length - 1) {
			const newTracks = [...tracks];
			[newTracks[trackIndex], newTracks[trackIndex + 1]] = [newTracks[trackIndex + 1], newTracks[trackIndex]];
			onChange(newTracks);
		}
	};

	return (
		<div className="fluxwave-playlist-editor">
			{/* Header */}
			<div className="flex items-center justify-between mb-4">
				<div>
					<h3 className="text-base font-semibold text-gray-900">
						{__('Playlist', 'fluxwave')}
					</h3>
					<p className="text-sm text-gray-600">
						{tracks.length === 0
							? __('No tracks added yet', 'fluxwave')
							: tracks.length === 1
							? __('1 track', 'fluxwave')
							: __('%d tracks', 'fluxwave').replace('%d', tracks.length)}
					</p>
				</div>

				<div className="flex gap-2">
					{tracks.length > 0 && (
						<Button
							variant="secondary"
							isDestructive
							onClick={handleClearAll}
							className="text-sm"
						>
							{__('Clear All', 'fluxwave')}
						</Button>
					)}

					<MediaUploadCheck>
						<MediaUpload
							onSelect={handleSelectMedia}
							allowedTypes={['audio']}
							multiple={true}
							value={tracks.map((t) => t.id)}
							render={({ open }) => (
								<Button variant="primary" onClick={open}>
									{tracks.length === 0
										? __('Add Audio Files', 'fluxwave')
										: __('Add More', 'fluxwave')}
								</Button>
							)}
						/>
					</MediaUploadCheck>
				</div>
			</div>

			{/* Track List */}
			<TrackList
				tracks={tracks}
				onRemove={handleRemove}
				activeTrackId={selectedTrackId}
				onSelectTrack={setSelectedTrackId}
				onUpdateArtwork={handleUpdateArtwork}
				onUpdateTrack={handleUpdateTrack}
				onMoveUp={handleMoveUp}
				onMoveDown={handleMoveDown}
			/>

		</div>
	);
};

export default PlaylistEditor;
