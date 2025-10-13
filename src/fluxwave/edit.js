/**
 * Block Editor Component
 * Main editor interface for the Fluxwave audio player block
 * 
 * @package Fluxwave
 * @since 0.1.0
 */

import { __ } from '@wordpress/i18n';
import { useBlockProps, InspectorControls, ColorPalette } from '@wordpress/block-editor';
import { PanelBody, ToggleControl, Button, SelectControl } from '@wordpress/components';
import { useState } from '@wordpress/element';
import AudioPlayer from './components/AudioPlayer';
import PlaylistEditor from './components/PlaylistEditor';
import './editor.scss';

/**
 * Edit component for the Fluxwave block
 * 
 * @param {Object} props - Component props
 * @param {Object} props.attributes - Block attributes
 * @param {Array} props.attributes.tracks - Array of track objects
 * @param {boolean} props.attributes.autoplay - Whether to autoplay
 * @param {boolean} props.attributes.loop - Whether to loop playlist
 * @param {string} props.attributes.accentColor - Accent color hex value
 * @param {Function} props.setAttributes - Function to update block attributes
 * @returns {JSX.Element} The edit component
 * @since 0.1.0
 */
export default function Edit({ attributes, setAttributes }) {
	const { tracks, autoplay, loop, accentColor } = attributes;
	const [viewMode, setViewMode] = useState('editor'); // 'editor' or 'preview'

	const blockProps = useBlockProps({
		className: 'fluxwave-block-editor',
	});

	/**
	 * Handle tracks change from PlaylistEditor
	 * 
	 * @param {Array} newTracks - Updated tracks array
	 * @returns {void}
	 * @since 0.1.0
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
						__next40pxDefaultSize={true}
						__nextHasNoMarginBottom={true}
					/>

					<ToggleControl
						label={__('Loop Playlist', 'fluxwave')}
						checked={loop}
						onChange={(value) => setAttributes({ loop: value })}
						help={__('Repeat playlist when it ends', 'fluxwave')}
						__next40pxDefaultSize={true}
						__nextHasNoMarginBottom={true}
					/>
				</PanelBody>

				<PanelBody title={__('Theme', 'fluxwave')} initialOpen={true}>
					<SelectControl
						label={__('Player Theme', 'fluxwave')}
						value={attributes.theme || 'light'}
						options={[
							{ label: __('Light', 'fluxwave'), value: 'light' },
							{ label: __('Dark', 'fluxwave'), value: 'dark' }
						]}
						onChange={(value) => setAttributes({ theme: value })}
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
					<SelectControl
						value={viewMode}
						options={[
							{ label: __('Edit Playlist', 'fluxwave'), value: 'editor' },
							{ label: __('Preview Player', 'fluxwave'), value: 'preview' }
						]}
						onChange={setViewMode}
					/>
					
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
							theme={attributes.theme || 'light'}
						/>
					</div>
				)}
			</div>
		</>
	);
}
