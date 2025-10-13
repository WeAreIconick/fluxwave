/**
 * Track Item Component
 * Individual draggable track item
 * 
 * @package Fluxwave
 */

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { __ } from '@wordpress/i18n';
import { Button, TextControl } from '@wordpress/components';
import { MediaUpload, MediaUploadCheck } from '@wordpress/block-editor';
import { useState } from '@wordpress/element';

const TrackItem = ({ track, index, isActive, onRemove, onSelect, onUpdateArtwork, onUpdateTrack }) => {
	const [isEditing, setIsEditing] = useState(false);
	const [editTitle, setEditTitle] = useState(track.title || '');
	const [editArtist, setEditArtist] = useState(track.artist || '');

	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: track.id });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : 1,
	};

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
			ref={setNodeRef}
			style={style}
			className={`fluxwave-track-item rounded-lg border transition-all ${
				isActive
					? 'bg-indigo-50 border-indigo-300 shadow-sm'
					: isDragging
					? 'bg-gray-100 border-gray-300'
					: 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
			}`}
		>
			<div className="flex items-center gap-3 p-3">
				{/* Drag Handle */}
				<div
					{...attributes}
					{...listeners}
					className="flex-shrink-0 cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-gray-600"
				>
					<svg
						className="w-5 h-5"
						fill="currentColor"
						viewBox="0 0 20 20"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
					</svg>
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
						/>
						<TextControl
							label={__('Artist', 'fluxwave')}
							value={editArtist}
							onChange={setEditArtist}
							className="mb-0"
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
