/**
 * Block Editor Component
 * 
 * @package Fluxwave
 */

import { __ } from '@wordpress/i18n';
import { useBlockProps, InspectorControls, ColorPalette } from '@wordpress/block-editor';
import { PanelBody, ToggleControl, Button, ButtonGroup } from '@wordpress/components';
import { useState } from '@wordpress/element';
import AudioPlayer from './components/AudioPlayer';
import PlaylistEditor from './components/PlaylistEditor';
import './editor.scss';

export default function Edit({ attributes, setAttributes }) {
	const { tracks, autoplay, loop, accentColor } = attributes;
	const [viewMode, setViewMode] = useState('editor'); // 'editor' or 'preview'

	const blockProps = useBlockProps({
		className: 'fluxwave-block-editor',
	});

	/**
	 * Handle tracks change
	 */
	const handleTracksChange = (newTracks) => {
		setAttributes({ tracks: newTracks });
	};

	return (
		<>
			<InspectorControls>
				<PanelBody title={__('Player Settings', 'fluxwave')} initialOpen={true}>
					<ToggleControl
						label={__('Autoplay', 'fluxwave')}
						checked={autoplay}
						onChange={(value) => setAttributes({ autoplay: value })}
						help={__('Start playing automatically when page loads', 'fluxwave')}
						__nextHasNoMarginBottom
					/>

					<ToggleControl
						label={__('Loop Playlist', 'fluxwave')}
						checked={loop}
						onChange={(value) => setAttributes({ loop: value })}
						help={__('Repeat playlist when it ends', 'fluxwave')}
						__nextHasNoMarginBottom
					/>
				</PanelBody>

				<PanelBody title={__('Accent Color', 'fluxwave')} initialOpen={true}>
					<ColorPalette
						value={accentColor}
						onChange={(color) => setAttributes({ accentColor: color || '#06b6d4' })}
						colors={[
							{ name: __('Cyan', 'fluxwave'), color: '#06b6d4' },
							{ name: __('Blue', 'fluxwave'), color: '#3b82f6' },
							{ name: __('Indigo', 'fluxwave'), color: '#6366f1' },
							{ name: __('Purple', 'fluxwave'), color: '#a855f7' },
							{ name: __('Pink', 'fluxwave'), color: '#ec4899' },
							{ name: __('Red', 'fluxwave'), color: '#ef4444' },
							{ name: __('Orange', 'fluxwave'), color: '#f97316' },
							{ name: __('Amber', 'fluxwave'), color: '#f59e0b' },
							{ name: __('Yellow', 'fluxwave'), color: '#eab308' },
							{ name: __('Lime', 'fluxwave'), color: '#84cc16' },
							{ name: __('Green', 'fluxwave'), color: '#10b981' },
							{ name: __('Emerald', 'fluxwave'), color: '#059669' },
							{ name: __('Teal', 'fluxwave'), color: '#14b8a6' },
						]}
					/>
				</PanelBody>
			</InspectorControls>

			<div {...blockProps}>
				{/* View Mode Toggle */}
				<div className="mb-4 flex items-center justify-between border-b border-gray-200 pb-3">
					<ButtonGroup>
						<Button
							variant={viewMode === 'editor' ? 'primary' : 'secondary'}
							onClick={() => setViewMode('editor')}
						>
							{__('Edit Playlist', 'fluxwave')}
						</Button>
						<Button
							variant={viewMode === 'preview' ? 'primary' : 'secondary'}
							onClick={() => setViewMode('preview')}
							disabled={tracks.length === 0}
						>
							{__('Preview Player', 'fluxwave')}
						</Button>
					</ButtonGroup>
					
					{viewMode === 'preview' && (
						<span className="text-xs text-gray-500">
							{__('This is how your player will look on the frontend', 'fluxwave')}
						</span>
					)}
				</div>

			{/* Editor View */}
			{viewMode === 'editor' && (
				<div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
					<PlaylistEditor
						tracks={tracks}
						onChange={handleTracksChange}
					/>
				</div>
			)}

				{/* Preview View */}
				{viewMode === 'preview' && tracks.length > 0 && (
					<div>
						<AudioPlayer
							tracks={tracks}
							autoplay={false} // Don't autoplay in editor
							loop={loop}
							accentColor={accentColor}
						/>
					</div>
				)}
			</div>
		</>
	);
}
