/**
 * Track Item Component
 * Individual track item with reorder buttons, metadata editing, and artwork management
 * 
 * @package Fluxwave
 * @since 0.1.0
 */

import { __ } from '@wordpress/i18n';
import { Button, TextControl } from '@wordpress/components';
import { MediaUpload } from '@wordpress/block-editor';
import { useState } from '@wordpress/element';

/**
 * TrackItem component for displaying and managing individual tracks
 * 
 * @param {Object} props - Component props
 * @param {Object} props.track - Track object with id, url, title, artist, album, artwork, duration
 * @param {number} props.index - Track index in playlist
 * @param {boolean} props.isActive - Whether this track is currently active
 * @param {boolean} props.isFirst - Whether this is the first track
 * @param {boolean} props.isLast - Whether this is the last track
 * @param {Function} props.onRemove - Callback to remove track
 * @param {Function} props.onSelect - Callback to select track
 * @param {Function} props.onUpdateArtwork - Callback to update track artwork
 * @param {Function} props.onUpdateTrack - Callback to update track metadata
 * @param {Function} props.onMoveUp - Callback to move track up
 * @param {Function} props.onMoveDown - Callback to move track down
 * @returns {JSX.Element} The track item component
 * @since 0.1.0
 */
const TrackItem = ({ 
	track, 
	index, 
	isActive, 
	isFirst, 
	isLast, 
	onRemove, 
	onSelect, 
	onUpdateArtwork, 
	onUpdateTrack,
	onMoveUp,
	onMoveDown
}) => {
	const [isEditing, setIsEditing] = useState(false);
	const [editTitle, setEditTitle] = useState(track.title || '');
	const [editArtist, setEditArtist] = useState(track.artist || '');

	/**
	 * Custom SVG Arrow Up Icon
	 */
	const ArrowUpIcon = () => (
		<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
			<path d="M8 3.5L3.5 8h2.5v4.5h4V8h2.5L8 3.5z"/>
		</svg>
	);

	/**
	 * Custom SVG Arrow Down Icon
	 */
	const ArrowDownIcon = () => (
		<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
			<path d="M8 12.5L12.5 8H10V3.5H6V8H3.5L8 12.5z"/>
		</svg>
	);

	/**
	 * Format duration
	 */
	const formatDuration = (seconds) => {
		if (!seconds || isNaN(seconds) || !isFinite(seconds)) return '--:--';
		const mins = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	};

	/**
	 * Handle artwork selection
	 */
	const handleArtworkSelect = (media) => {
		if (onUpdateArtwork) {
			onUpdateArtwork(track.id, media.url);
		}
	};

	/**
	 * Save metadata changes
	 */
	const handleSaveMetadata = () => {
		if (onUpdateTrack) {
			onUpdateTrack(track.id, {
				title: editTitle,
				artist: editArtist,
			});
		}
		setIsEditing(false);
	};

	/**
	 * Cancel editing
	 */
	const handleCancelEdit = () => {
		setEditTitle(track.title || '');
		setEditArtist(track.artist || '');
		setIsEditing(false);
	};

	return (
		<div
			className={`fluxwave-track-item rounded-lg border transition-all ${
				isActive
					? 'bg-indigo-50 border-indigo-300 shadow-sm'
					: 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
			}`}
			role="listitem"
			aria-label={`Track ${index + 1}: ${track.title || 'Untitled'} by ${track.artist || 'Unknown Artist'}`}
			tabIndex="0"
			onKeyDown={(e) => {
				// Keyboard navigation for track reordering
				if (e.key === 'ArrowUp' && !isFirst) {
					e.preventDefault();
					e.stopPropagation();
					onMoveUp(track.id);
				} else if (e.key === 'ArrowDown' && !isLast) {
					e.preventDefault();
					e.stopPropagation();
					onMoveDown(track.id);
				} else if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault();
					e.stopPropagation();
					onSelect(track.id);
				} else if (e.key === 'Delete' || e.key === 'Backspace') {
					e.preventDefault();
					e.stopPropagation();
					if (window.confirm(__('Are you sure you want to remove this track?', 'fluxwave'))) {
						onRemove(track.id);
					}
				}
			}}
		>
			<div className="flex items-center gap-3 p-3">
				{/* Reorder Buttons */}
				<div className="flex-shrink-0 flex flex-col gap-1" role="group" aria-label={__('Track reorder controls', 'fluxwave')}>
					<Button
						icon={ArrowUpIcon}
						size="small"
						onClick={(e) => {
							e.stopPropagation();
							onMoveUp(track.id);
						}}
						disabled={isFirst}
						label={isFirst ? __('Cannot move up - first track', 'fluxwave') : __('Move track up', 'fluxwave')}
						showTooltip={true}
						className="!min-w-0 !w-11 !h-11"
						aria-describedby={`track-${track.id}-instructions`}
					/>
					<Button
						icon={ArrowDownIcon}
						size="small"
						onClick={(e) => {
							e.stopPropagation();
							onMoveDown(track.id);
						}}
						disabled={isLast}
						label={isLast ? __('Cannot move down - last track', 'fluxwave') : __('Move track down', 'fluxwave')}
						showTooltip={true}
						className="!min-w-0 !w-11 !h-11"
						aria-describedby={`track-${track.id}-instructions`}
					/>
				</div>
				
				{/* Hidden instructions for screen readers */}
				<div id={`track-${track.id}-instructions`} className="sr-only">
					{__('Use arrow keys to reorder tracks, Enter or Space to select, Delete to remove', 'fluxwave')}
				</div>

				{/* Track Number */}
				<div className="flex-shrink-0 w-8 text-center text-sm font-medium text-gray-600">
					{index + 1}
				</div>

				{/* Album Artwork with Upload */}
				<div className="flex-shrink-0">
					<MediaUpload
						onSelect={handleArtworkSelect}
						allowedTypes={['image']}
						value={track.artworkId}
						render={({ open }) => (
							<div className="text-center">
								<div 
									className="relative group cursor-pointer mb-1"
									onClick={(e) => {
										e.stopPropagation();
										open();
									}}
									title={track.artwork ? __('Click to change artwork', 'fluxwave') : __('Click to add artwork', 'fluxwave')}
								>
									{track.artwork ? (
										<>
											<img
												src={track.artwork}
												alt={track.title}
												className="w-16 h-16 rounded object-cover border-2 border-gray-200"
											/>
											<div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 rounded flex items-center justify-center transition-all">
												<svg 
													className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" 
													fill="none" 
													stroke="currentColor" 
													viewBox="0 0 24 24"
												>
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
												</svg>
											</div>
										</>
									) : (
										<div className="w-16 h-16 rounded bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-dashed border-gray-400 flex flex-col items-center justify-center text-gray-500 hover:border-indigo-400 hover:text-indigo-500 hover:bg-gradient-to-br hover:from-indigo-50 hover:to-blue-50 transition-all">
											<svg 
												className="w-7 h-7 mb-0.5" 
												fill="none" 
												stroke="currentColor" 
												viewBox="0 0 24 24"
											>
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
											</svg>
											<span className="text-[9px] font-medium">Image</span>
										</div>
									)}
								</div>
								<p className="text-[10px] text-gray-500">{track.artwork ? __('Change', 'fluxwave') : __('Add Art', 'fluxwave')}</p>
							</div>
						)}
					/>
				</div>

				{/* Track Info - Editable or Display */}
				{isEditing ? (
					<div className="flex-grow min-w-0 space-y-2">
						<TextControl
							label={__('Track Title', 'fluxwave')}
							value={editTitle}
							onChange={setEditTitle}
							className="mb-0"
							__next40pxDefaultSize={true}
							__nextHasNoMarginBottom={true}
						/>
						<TextControl
							label={__('Artist', 'fluxwave')}
							value={editArtist}
							onChange={setEditArtist}
							className="mb-0"
							__next40pxDefaultSize={true}
							__nextHasNoMarginBottom={true}
						/>
						<div className="flex gap-2 pt-1">
							<Button
								variant="primary"
								size="small"
								onClick={handleSaveMetadata}
							>
								{__('Save', 'fluxwave')}
							</Button>
							<Button
								variant="secondary"
								size="small"
								onClick={handleCancelEdit}
							>
								{__('Cancel', 'fluxwave')}
							</Button>
						</div>
					</div>
				) : (
					<div className="flex-grow min-w-0">
						<p className="text-sm font-medium text-gray-900 truncate">
							{track.title || __('Untitled', 'fluxwave')}
						</p>
						{track.artist && (
							<p className="text-xs text-gray-500 truncate">{track.artist}</p>
						)}
					</div>
				)}

				{/* Duration */}
				<div className="flex-shrink-0 text-sm text-gray-500">
					{formatDuration(typeof track.duration === 'number' ? track.duration : parseFloat(track.duration) || 0)}
				</div>

				{/* Edit Button */}
				{!isEditing && (
					<Button
						isSmall
						variant="secondary"
						onClick={(e) => {
							e.stopPropagation();
							setIsEditing(true);
						}}
						className="flex-shrink-0"
						title={__('Edit track info', 'fluxwave')}
					>
						<svg
							className="w-4 h-4"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
							/>
						</svg>
					</Button>
				)}

				{/* Remove Button */}
				{!isEditing && (
					<Button
						isSmall
						isDestructive
						variant="secondary"
						onClick={(e) => {
							e.stopPropagation();
							onRemove(track.id);
						}}
						className="flex-shrink-0"
						title={__('Remove track', 'fluxwave')}
					>
						<svg
							className="w-4 h-4"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
							/>
						</svg>
					</Button>
				)}
			</div>
		</div>
	);
};

export default TrackItem;
