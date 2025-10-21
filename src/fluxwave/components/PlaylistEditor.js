/**
 * Playlist Editor Component
 * Manage tracks in the block editor with full CRUD operations
 * Handles media selection, track management, and playlist organization
 *
 * @package
 * @since 0.1.0
 */

import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import { MediaUpload, MediaUploadCheck } from '@wordpress/block-editor';
import VirtualizedTrackList from './VirtualizedTrackList';

/**
 * PlaylistEditor component for managing the entire playlist
 *
 * @param {Object}   props          - Component props
 * @param {Array}    props.tracks   - Array of track objects
 * @param {Function} props.onChange - Callback when tracks change
 * @return {JSX.Element} The playlist editor component
 * @since 0.1.0
 */
const PlaylistEditor = ( { tracks, onChange } ) => {
	const [ selectedTrackId, setSelectedTrackId ] = useState( null );

	/**
	 * Handle media selection
	 * @param {Array} media - Array of media objects
	 */
	const handleSelectMedia = ( media ) => {
		const newTracks = media.map( ( item ) => {
			return {
				id: item.id,
				url: item.url,
				title: item.title || item.filename,
				artist: item.meta?.artist || '',
				album: item.meta?.album || '',
				artwork: item.sizes?.thumbnail?.url || item.icon,
				artworkId: null,
				duration: 0, // Will be calculated by Howler.js when loaded
			};
		} );

		onChange( [ ...tracks, ...newTracks ] );
	};

	/**
	 * Handle track removal
	 * @param {string|number} trackId - ID of the track to remove
	 */
	const handleRemove = ( trackId ) => {
		const newTracks = tracks.filter( ( t ) => t.id !== trackId );
		onChange( newTracks );

		if ( selectedTrackId === trackId ) {
			setSelectedTrackId( null );
		}
	};

	/**
	 * Handle artwork update
	 * @param {string|number} trackId    - ID of the track
	 * @param {string}        artworkUrl - URL of the artwork image
	 */
	const handleUpdateArtwork = ( trackId, artworkUrl ) => {
		const newTracks = tracks.map( ( track ) => {
			if ( track.id === trackId ) {
				return {
					...track,
					artwork: artworkUrl,
				};
			}
			return track;
		} );
		onChange( newTracks );
	};

	/**
	 * Handle track metadata update
	 * @param {string|number} trackId - ID of the track
	 * @param {Object}        updates - Object containing updated track properties
	 */
	const handleUpdateTrack = ( trackId, updates ) => {
		const newTracks = tracks.map( ( track ) => {
			if ( track.id === trackId ) {
				return {
					...track,
					...updates,
				};
			}
			return track;
		} );
		onChange( newTracks );
	};

	/**
	 * Handle clear all
	 */
	const handleClearAll = () => {
		// For now, we'll clear without confirmation to avoid using window.confirm
		// In a production app, you might want to implement a proper modal dialog
		onChange( [] );
		setSelectedTrackId( null );
	};

	/**
	 * Handle move track up
	 * @param {string|number} trackId - ID of the track to move up
	 */
	const handleMoveUp = ( trackId ) => {
		const trackIndex = tracks.findIndex(
			( track ) => track.id === trackId
		);
		if ( trackIndex > 0 ) {
			const newTracks = [ ...tracks ];
			[ newTracks[ trackIndex - 1 ], newTracks[ trackIndex ] ] = [
				newTracks[ trackIndex ],
				newTracks[ trackIndex - 1 ],
			];
			onChange( newTracks );
		}
	};

	/**
	 * Handle move track down
	 * @param {string|number} trackId - ID of the track to move down
	 */
	const handleMoveDown = ( trackId ) => {
		const trackIndex = tracks.findIndex(
			( track ) => track.id === trackId
		);
		if ( trackIndex < tracks.length - 1 ) {
			const newTracks = [ ...tracks ];
			[ newTracks[ trackIndex ], newTracks[ trackIndex + 1 ] ] = [
				newTracks[ trackIndex + 1 ],
				newTracks[ trackIndex ],
			];
			onChange( newTracks );
		}
	};

	return (
		<div className="fluxwave-playlist-editor">
			{ /* Header */ }
			<div className="flex items-center justify-between mb-4">
				<div>
					<h3 className="text-base font-semibold text-gray-900">
						{ __( 'Playlist', 'fluxwave' ) }
					</h3>
					<p className="text-sm text-gray-600">
						{ ( () => {
							if ( tracks.length === 0 ) {
								return __( 'No tracks added yet', 'fluxwave' );
							}
							if ( tracks.length === 1 ) {
								return __( '1 track', 'fluxwave' );
							}
							// translators: %d is the number of tracks
							return __( '%d tracks', 'fluxwave' ).replace(
								'%d',
								tracks.length
							);
						} )() }
					</p>
				</div>

				<div className="flex gap-2">
					{ tracks.length > 0 && (
						<Button
							variant="secondary"
							isDestructive
							onClick={ handleClearAll }
							className="text-sm"
						>
							{ __( 'Clear All', 'fluxwave' ) }
						</Button>
					) }

					<MediaUploadCheck>
						<MediaUpload
							onSelect={ handleSelectMedia }
							allowedTypes={ [ 'audio' ] }
							multiple={ true }
							value={ tracks.map( ( t ) => t.id ) }
							render={ ( { open } ) => (
								<Button variant="primary" onClick={ open }>
									{ tracks.length === 0
										? __( 'Add Audio Files', 'fluxwave' )
										: __( 'Add More', 'fluxwave' ) }
								</Button>
							) }
						/>
					</MediaUploadCheck>
				</div>
			</div>

			{ /* Track List */ }
			<VirtualizedTrackList
				tracks={ tracks }
				onRemove={ handleRemove }
				activeTrackId={ selectedTrackId }
				onSelectTrack={ setSelectedTrackId }
				onUpdateArtwork={ handleUpdateArtwork }
				onUpdateTrack={ handleUpdateTrack }
				onMoveUp={ handleMoveUp }
				onMoveDown={ handleMoveDown }
				height={ 400 }
				itemHeight={ 80 }
			/>
		</div>
	);
};

export default PlaylistEditor;
