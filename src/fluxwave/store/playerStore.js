/**
 * Player State Store
 * Zustand store for managing audio player state
 *
 * @package
 */

import { create } from 'zustand';

const usePlayerStore = create( ( set, get ) => ( {
	// Current track
	currentTrack: null,

	// Playback state
	isPlaying: false,
	isLoading: false,
	currentTime: 0,
	duration: 0,
	progress: 0,

	// Audio settings
	volume: 1,
	playbackRate: 1,
	isMuted: false,

	// Playlist
	playlist: [],
	currentTrackIndex: 0,
	originalPlaylist: [], // Store original order for shuffle

	// Playback modes
	shuffleMode: false,
	repeatMode: 'none', // 'none', 'all', 'one'

	// UI state
	showWaveform: true,
	showVisualizer: false,

	// Actions
	setCurrentTrack: ( track ) => set( { currentTrack: track } ),

	setIsPlaying: ( isPlaying ) => set( { isPlaying } ),

	setIsLoading: ( isLoading ) => set( { isLoading } ),

	setCurrentTime: ( currentTime ) => {
		const { duration } = get();
		set( {
			currentTime,
			progress: duration > 0 ? currentTime / duration : 0,
		} );
	},

	setDuration: ( duration ) => set( { duration } ),

	setVolume: ( volume ) =>
		set( { volume: Math.max( 0, Math.min( 1, volume ) ) } ),

	setPlaybackRate: ( rate ) =>
		set( { playbackRate: Math.max( 0.5, Math.min( 2, rate ) ) } ),

	toggleMute: () => set( ( state ) => ( { isMuted: ! state.isMuted } ) ),

	setPlaylist: ( playlist ) =>
		set( {
			playlist,
			originalPlaylist: [ ...playlist ],
		} ),

	setCurrentTrackIndex: ( index ) => {
		const { playlist } = get();
		if ( index >= 0 && index < playlist.length ) {
			set( {
				currentTrackIndex: index,
				currentTrack: playlist[ index ],
			} );
		}
	},

	// Shuffle mode
	toggleShuffle: () => {
		const { shuffleMode, playlist, originalPlaylist, currentTrack } = get();
		const newShuffleMode = ! shuffleMode;

		if ( newShuffleMode ) {
			// Enable shuffle - randomize playlist
			const shuffled = [ ...playlist ];

			// Keep current track at current position
			const currentIndex = shuffled.findIndex(
				( t ) => t.id === currentTrack?.id
			);
			if ( currentIndex !== -1 ) {
				// Remove current track temporarily
				shuffled.splice( currentIndex, 1 );
			}

			// Fisher-Yates shuffle
			for ( let i = shuffled.length - 1; i > 0; i-- ) {
				const j = Math.floor( Math.random() * ( i + 1 ) );
				[ shuffled[ i ], shuffled[ j ] ] = [
					shuffled[ j ],
					shuffled[ i ],
				];
			}

			// Put current track back at start
			if ( currentTrack && currentIndex !== -1 ) {
				shuffled.unshift( currentTrack );
			}

			set( {
				shuffleMode: true,
				playlist: shuffled,
				currentTrackIndex: 0,
			} );
		} else {
			// Disable shuffle - restore original order
			const currentTrackId = currentTrack?.id;
			const newIndex = originalPlaylist.findIndex(
				( t ) => t.id === currentTrackId
			);

			set( {
				shuffleMode: false,
				playlist: [ ...originalPlaylist ],
				currentTrackIndex: newIndex >= 0 ? newIndex : 0,
			} );
		}
	},

	// Repeat mode
	setRepeatMode: ( mode ) => set( { repeatMode: mode } ),

	toggleRepeatMode: () => {
		const { repeatMode } = get();
		const modes = [ 'none', 'all', 'one' ];
		const currentIndex = modes.indexOf( repeatMode );
		const nextMode = modes[ ( currentIndex + 1 ) % modes.length ];
		set( { repeatMode: nextMode } );
	},

	nextTrack: () => {
		const { playlist, currentTrackIndex, repeatMode } = get();

		// Repeat one - stay on same track
		if ( repeatMode === 'one' ) {
			return true;
		}

		const nextIndex = currentTrackIndex + 1;

		if ( nextIndex < playlist.length ) {
			set( {
				currentTrackIndex: nextIndex,
				currentTrack: playlist[ nextIndex ],
			} );
			return true;
		}

		// End of playlist
		if ( repeatMode === 'all' ) {
			// Loop back to start
			set( {
				currentTrackIndex: 0,
				currentTrack: playlist[ 0 ],
			} );
			return true;
		}

		return false;
	},

	previousTrack: () => {
		const { playlist, currentTrackIndex } = get();
		const prevIndex = currentTrackIndex - 1;

		if ( prevIndex >= 0 ) {
			set( {
				currentTrackIndex: prevIndex,
				currentTrack: playlist[ prevIndex ],
			} );
			return true;
		}
		return false;
	},

	toggleWaveform: () =>
		set( ( state ) => ( { showWaveform: ! state.showWaveform } ) ),

	toggleVisualizer: () =>
		set( ( state ) => ( { showVisualizer: ! state.showVisualizer } ) ),

	reset: () =>
		set( {
			currentTrack: null,
			isPlaying: false,
			isLoading: false,
			currentTime: 0,
			duration: 0,
			progress: 0,
		} ),
} ) );

export default usePlayerStore;
