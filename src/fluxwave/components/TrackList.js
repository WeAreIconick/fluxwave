/**
 * Track List Component
 * Sortable list of tracks with drag-drop and virtual scrolling for large playlists
 * 
 * @package Fluxwave
 */

import {
	DndContext,
	closestCenter,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
} from '@dnd-kit/core';
import {
	arrayMove,
	SortableContext,
	sortableKeyboardCoordinates,
	verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { __ } from '@wordpress/i18n';
import { memo, useMemo } from '@wordpress/element';
import { List } from 'react-window';
import TrackItem from './TrackItem';

// Use virtual scrolling for playlists with 50+ tracks
const VIRTUAL_SCROLL_THRESHOLD = 50;

const TrackList = memo(({ tracks, onReorder, onRemove, activeTrackId, onSelectTrack, onUpdateArtwork, onUpdateTrack }) => {
	const useVirtualScroll = tracks.length >= VIRTUAL_SCROLL_THRESHOLD;
	// Memoize sensors to prevent recreation on every render
	const sensors = useMemo(() => 
		[
			useSensor(PointerSensor, {
				activationConstraint: {
					distance: 8, // 8px movement required to start drag
				},
			}),
			useSensor(KeyboardSensor, {
				coordinateGetter: sortableKeyboardCoordinates,
			})
		],
	[]);
	
	const sensorsList = useSensors(...sensors);
	
	// Memoize track IDs array
	const trackIds = useMemo(() => tracks.map((t) => t.id), [tracks]);

	/**
	 * Handle drag end
	 */
	const handleDragEnd = (event) => {
		const { active, over } = event;

		if (active.id !== over?.id) {
			const oldIndex = tracks.findIndex((track) => track.id === active.id);
			const newIndex = tracks.findIndex((track) => track.id === over.id);

			if (oldIndex !== -1 && newIndex !== -1) {
				const newTracks = arrayMove(tracks, oldIndex, newIndex);
				onReorder(newTracks);
			}
		}
	};

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

	// Render function for virtual list
	const Row = ({ index, style }) => {
		const track = tracks[index];
		return (
			<div style={style}>
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
			</div>
		);
	};

	return (
		<DndContext
			sensors={sensorsList}
			collisionDetection={closestCenter}
			onDragEnd={handleDragEnd}
		>
			<SortableContext
				items={trackIds}
				strategy={verticalListSortingStrategy}
			>
				{useVirtualScroll ? (
					// Virtual scrolling for large playlists (50+ tracks)
					<div className="fluxwave-track-list">
						<div className="mb-2 text-xs text-gray-500 text-center">
							{__('Large playlist - using optimized scrolling', 'fluxwave')}
						</div>
						<List
							height={600}
							itemCount={tracks.length}
							itemSize={80}
							width="100%"
						>
							{Row}
						</List>
					</div>
				) : (
					// Regular rendering for smaller playlists (<50 tracks)
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
				)}
			</SortableContext>
		</DndContext>
	);
});

TrackList.displayName = 'TrackList';

export default TrackList;
