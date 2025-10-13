/**
 * Audio Player Component
 * Main player component that integrates Howler.js and UI
 * 
 * @package Fluxwave
 */

import { useEffect, useRef, useState, useCallback, memo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import HowlerPlayer from '../audio/HowlerPlayer';
import usePlayerStore from '../store/playerStore';
import TransportControls from './TransportControls';
import ProgressBar from './ProgressBar';
import TrackInfo from './TrackInfo';
import { announceToScreenReader, formatTimeForScreenReader } from '../utils/accessibility';

const AudioPlayer = ({ tracks = [], autoplay = false, loop = false, accentColor = '#06b6d4', onReady }) => {
	const [error, setError] = useState(null);
	const [isInitialized, setIsInitialized] = useState(false);
	const playerRef = useRef(null);
	const animationFrameRef = useRef(null);
	const lastUpdateTime = useRef(0);

	// Simple selectors to prevent infinite re-renders
	const currentTrack = usePlayerStore((state) => state.currentTrack);
	const currentTrackIndex = usePlayerStore((state) => state.currentTrackIndex);
	const isPlaying = usePlayerStore((state) => state.isPlaying);
	const isLoading = usePlayerStore((state) => state.isLoading);
	const currentTime = usePlayerStore((state) => state.currentTime);
	const duration = usePlayerStore((state) => state.duration);
	const volume = usePlayerStore((state) => state.volume);
	const playbackRate = usePlayerStore((state) => state.playbackRate);
	const repeatMode = usePlayerStore((state) => state.repeatMode);
	
	// Actions (stable references)
	const setCurrentTrack = usePlayerStore((state) => state.setCurrentTrack);
	const setCurrentTrackIndex = usePlayerStore((state) => state.setCurrentTrackIndex);
	const setIsPlaying = usePlayerStore((state) => state.setIsPlaying);
	const setIsLoading = usePlayerStore((state) => state.setIsLoading);
	const setCurrentTime = usePlayerStore((state) => state.setCurrentTime);
	const setDuration = usePlayerStore((state) => state.setDuration);
	const setPlaylist = usePlayerStore((state) => state.setPlaylist);
	const nextTrack = usePlayerStore((state) => state.nextTrack);
	const previousTrack = usePlayerStore((state) => state.previousTrack);

	// Initialize Howler player on mount (only once)
	useEffect(() => {
		playerRef.current = new HowlerPlayer();

		// Call onReady callback when player is initialized
		if (onReady) {
			// Small delay to ensure DOM is ready
			setTimeout(() => {
				setIsInitialized(true);
				onReady();
			}, 50);
		} else {
			setIsInitialized(true);
		}

		// Cleanup on unmount
		return () => {
			if (animationFrameRef.current) {
				cancelAnimationFrame(animationFrameRef.current);
				animationFrameRef.current = null;
			}
			if (playerRef.current) {
				playerRef.current.destroy();
				playerRef.current = null;
			}
		};
	}, [onReady]);

	// Set playlist when tracks change
	useEffect(() => {
		if (tracks.length > 0) {
			setPlaylist(tracks);
			if (!currentTrack) {
				setCurrentTrackIndex(0);
			}
		}
	}, [tracks]);

	// Load track when current track index changes
	useEffect(() => {
		const playlist = usePlayerStore.getState().playlist;
		if (playlist[currentTrackIndex]) {
			loadTrack(playlist[currentTrackIndex]);
		}
	}, [currentTrackIndex]);

	// Announce track changes to screen readers
	useEffect(() => {
		if (currentTrack) {
			const trackInfo = `${currentTrack.title || __('Untitled Track', 'fluxwave')}${currentTrack.artist ? ` by ${currentTrack.artist}` : ''}`;
			announceToScreenReader(
				__('Now playing:', 'fluxwave') + ' ' + trackInfo,
				'polite'
			);
		}
	}, [currentTrack]);

	// Announce playback state changes
	useEffect(() => {
		if (currentTrack) {
			const state = isPlaying ? __('Playback started', 'fluxwave') : __('Playback paused', 'fluxwave');
			announceToScreenReader(state, 'polite');
		}
	}, [isPlaying, currentTrack]);

	// Announce errors to screen readers
	useEffect(() => {
		if (error) {
			announceToScreenReader(__('Error:', 'fluxwave') + ' ' + error, 'assertive');
		}
	}, [error]);

	// Focus management - focus play button when track changes
	useEffect(() => {
		if (currentTrack) {
			// Small delay to ensure DOM is updated
			setTimeout(() => {
				const playButton = document.querySelector('[aria-label*="Play"], [aria-label*="Pause"]');
				if (playButton) {
					playButton.focus();
				}
			}, 100);
		}
	}, [currentTrack]);

	// Update playback time
	useEffect(() => {
		if (isPlaying) {
			updatePlaybackTime();
		}
	}, [isPlaying]);

	// Update playback rate when it changes
	useEffect(() => {
		if (playerRef.current && playbackRate) {
			playerRef.current.setRate(playbackRate);
		}
	}, [playbackRate]);

	/**
	 * Load a track with comprehensive error handling and logging
	 * 
	 * @param {Object} track - Track object with url, title, etc.
	 * @returns {Promise<void>} Resolves when track is loaded
	 */
	const loadTrack = async (track) => {
		if (!track || !track.url) return;

		// Prevent concurrent loads
		if (isLoading) {
			console.log('Fluxwave: Skipping load - already loading');
			return;
		}

		// Clear any previous errors
		setError(null);
		setIsLoading(true);
		setCurrentTrack(track);

		try {
			// Load into Howler with better error handling
			await playerRef.current.load(track.url, {
				onLoad: () => {
					const trackDuration = playerRef.current.getDuration();
					
					// Ensure duration is valid
					if (trackDuration && !isNaN(trackDuration) && isFinite(trackDuration)) {
						setDuration(trackDuration);
					} else {
						setDuration(0);
					}
					
					setIsLoading(false);
					setError(null);

					// Set playback rate
					if (playbackRate) {
						playerRef.current.setRate(playbackRate);
					}

					if (autoplay || isPlaying) {
						handlePlay();
					}
				},
				onEnd: () => {
					handleTrackEnd();
				},
				onError: (error) => {
					console.error('Error loading track:', error);
					setIsLoading(false);
					setDuration(0);
					
					// Provide more specific error messages
					let errorMessage = 'Failed to load audio file';
					if (error && error.message) {
						if (error.message.includes('Decoding audio data failed')) {
							errorMessage = 'Audio file format not supported or corrupted';
						} else if (error.message.includes('404')) {
							errorMessage = 'Audio file not found';
						} else if (error.message.includes('403')) {
							errorMessage = 'Access denied to audio file';
						} else {
							errorMessage = error.message;
						}
					}
					
					setError(errorMessage);
				},
			});

			// Set volume
			if (volume !== undefined) {
				playerRef.current.setVolume(volume);
			}
		} catch (error) {
			console.error('Error loading track:', error);
			setIsLoading(false);
			setDuration(0);
			setError(__('Failed to load audio file', 'fluxwave'));
		}
	};

	/**
	 * Update playback time (animation frame) - Throttled for performance
	 */
	const updatePlaybackTime = useCallback(() => {
		if (playerRef.current && isPlaying) {
			const now = performance.now();
			
			// Throttle: Only update every 100ms for better performance
			if (now - lastUpdateTime.current >= 100) {
				const time = playerRef.current.getCurrentTime();
				
				// Ensure time is valid before setting
				if (!isNaN(time) && isFinite(time)) {
					setCurrentTime(time);
				}
				
				lastUpdateTime.current = now;
			}

			animationFrameRef.current = requestAnimationFrame(updatePlaybackTime);
		}
	}, [isPlaying, setCurrentTime]);

	/**
	 * Handle play - memoized for performance
	 */
	const handlePlay = useCallback(() => {
		if (playerRef.current) {
			playerRef.current.play();
			setIsPlaying(true);
		}
	}, [setIsPlaying]);

	/**
	 * Handle pause - memoized for performance
	 */
	const handlePause = useCallback(() => {
		if (playerRef.current) {
			playerRef.current.pause();
			setIsPlaying(false);
		}
	}, [setIsPlaying]);

	/**
	 * Handle play/pause toggle - memoized for performance
	 */
	const handlePlayPause = useCallback(() => {
		if (isPlaying) {
			handlePause();
		} else {
			handlePlay();
		}
	}, [isPlaying, handlePlay, handlePause]);

	/**
	 * Handle seek - memoized for performance
	 */
	const handleSeek = useCallback((time) => {
		// Validate seek time
		if (isNaN(time) || !isFinite(time)) return;
		
		if (playerRef.current) {
			playerRef.current.seek(time);
			setCurrentTime(time);
		}
	}, [setCurrentTime]);

	/**
	 * Skip forward 10 seconds - memoized for performance
	 */
	const handleSkipForward = useCallback(() => {
		const newTime = Math.min(currentTime + 10, duration);
		handleSeek(newTime);
	}, [currentTime, duration, handleSeek]);

	/**
	 * Skip backward 10 seconds - memoized for performance
	 */
	const handleSkipBackward = useCallback(() => {
		const newTime = Math.max(currentTime - 10, 0);
		handleSeek(newTime);
	}, [currentTime, handleSeek]);

	/**
	 * Handle volume change - memoized for performance
	 */
	const handleVolumeChange = useCallback((newVolume) => {
		if (playerRef.current) {
			playerRef.current.setVolume(newVolume);
		}
	}, []);

	/**
	 * Handle playback rate change - memoized for performance
	 */
	const handlePlaybackRateChange = useCallback((rate) => {
		if (playerRef.current) {
			playerRef.current.setRate(rate);
		}
	}, []);

	/**
	 * Handle next track - memoized for performance
	 */
	const handleNext = useCallback(() => {
		const hasNext = nextTrack();
		if (hasNext && repeatMode === 'one') {
			// Repeat one - restart current track
			handleSeek(0);
			if (isPlaying) {
				handlePlay();
			}
		}
	}, [nextTrack, repeatMode, handleSeek, isPlaying, handlePlay]);

	/**
	 * Handle previous track - memoized for performance
	 */
	const handlePrevious = useCallback(() => {
		const safeCurrentTime = !isNaN(currentTime) ? currentTime : 0;
		
		// If more than 3 seconds in, restart current track
		if (safeCurrentTime > 3) {
			handleSeek(0);
		} else {
			previousTrack();
		}
	}, [currentTime, handleSeek, previousTrack]);

	/**
	 * Handle track end - memoized for performance
	 */
	const handleTrackEnd = useCallback(() => {
		if (repeatMode === 'one') {
			// Repeat current track
			handleSeek(0);
			handlePlay();
		} else {
			const hasNext = nextTrack();
			if (hasNext) {
				// Next track will load and play automatically
			} else {
				setIsPlaying(false);
			}
		}
	}, [repeatMode, handleSeek, handlePlay, nextTrack, setIsPlaying]);

	// Manage animation frame for playback time updates
	useEffect(() => {
		if (isPlaying && playerRef.current) {
			animationFrameRef.current = requestAnimationFrame(updatePlaybackTime);
		} else {
			if (animationFrameRef.current) {
				cancelAnimationFrame(animationFrameRef.current);
				animationFrameRef.current = null;
			}
		}

		// Cleanup function
		return () => {
			if (animationFrameRef.current) {
				cancelAnimationFrame(animationFrameRef.current);
				animationFrameRef.current = null;
			}
		};
	}, [isPlaying, updatePlaybackTime]);

	// Setup keyboard shortcuts - AFTER all handlers are defined
	useEffect(() => {
		const handleKeyPress = (e) => {
			// Only handle if not in an input field
			if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
				return;
			}

			switch (e.key) {
				case ' ':
					e.preventDefault();
					handlePlayPause();
					break;
				case 'ArrowLeft':
					if (e.shiftKey) {
						e.preventDefault();
						handlePrevious();
					}
					break;
				case 'ArrowRight':
					if (e.shiftKey) {
						e.preventDefault();
						handleNext();
					}
					break;
				default:
					break;
			}
		};

		window.addEventListener('keydown', handleKeyPress);

		return () => {
			window.removeEventListener('keydown', handleKeyPress);
		};
	}, [handlePlayPause, handlePrevious, handleNext]); // Now properly depends on handlers

	// Empty state
	if (tracks.length === 0) {
		return (
			<div className="fluxwave-audio-player p-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
				<div className="text-center text-gray-500">
					<svg
						className="w-12 h-12 mx-auto mb-3 text-gray-400"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
						/>
					</svg>
					<p className="font-medium">{__('No tracks added', 'fluxwave')}</p>
					<p className="text-sm mt-1">{__('Add audio files to start building your playlist', 'fluxwave')}</p>
				</div>
			</div>
		);
	}

	const playlist = usePlayerStore.getState().playlist;
	const safeCurrentTime = !isNaN(currentTime) ? currentTime : 0;
	const hasNext = currentTrackIndex < playlist.length - 1 || repeatMode !== 'none';
	const hasPrevious = currentTrackIndex > 0 || safeCurrentTime > 3;

	return (
		<div 
			className={`fluxwave-audio-player w-full ${isInitialized ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
			style={{ '--accent-color': accentColor }}
			role="region"
			aria-label={currentTrack?.title ? `Audio player - ${currentTrack.title}` : 'Audio player'}
			aria-live="polite"
			aria-atomic="false"
		>
			<div className="bg-white border-slate-100 border-b rounded-t-xl p-4 pb-6 sm:p-10 sm:pb-8 lg:p-6 xl:p-10 xl:pb-8 space-y-6 sm:space-y-8 lg:space-y-6 xl:space-y-8 items-center">
				{/* Track Info */}
				<TrackInfo 
					track={currentTrack} 
					currentTrackIndex={currentTrackIndex}
					totalTracks={tracks.length}
					accentColor={accentColor}
				/>
				
				{/* Screen reader status */}
				<div className="sr-only" role="status" aria-live="polite">
					{isPlaying ? __('Playing', 'fluxwave') : __('Paused', 'fluxwave')}
					{currentTrack?.title && `: ${currentTrack.title}`}
				</div>

				{/* Progress Bar */}
				<ProgressBar
					currentTime={currentTime}
					duration={duration}
					onSeek={handleSeek}
					accentColor={accentColor}
				/>
			</div>

			{/* Transport Controls */}
			<div id="transport-controls" tabIndex="-1">
				<TransportControls
					isPlaying={isPlaying}
					onPlayPause={handlePlayPause}
					onNext={handleNext}
					onPrevious={handlePrevious}
					hasPrevious={hasPrevious}
					hasNext={hasNext}
					playbackRate={playbackRate}
					onPlaybackRateChange={handlePlaybackRateChange}
					onSkipForward={handleSkipForward}
					onSkipBackward={handleSkipBackward}
					accentColor={accentColor}
				/>
			</div>

			{/* Loading Overlay */}
			{isLoading && (
				<div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded-xl" role="status" aria-live="polite">
					<div className="text-center">
						<div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: accentColor }} aria-hidden="true"></div>
						<p className="mt-2 text-sm text-slate-600">{__('Loading...', 'fluxwave')}</p>
					</div>
				</div>
			)}

			{/* Error Message */}
			{error && (
				<div className="absolute inset-0 bg-white bg-opacity-95 flex items-center justify-center z-10 rounded-xl" role="alert" aria-live="assertive">
					<div className="text-center p-6 max-w-md">
						<svg className="w-12 h-12 mx-auto mb-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
						<p className="text-sm text-slate-900 font-medium mb-2">{error}</p>
						<button
							onClick={() => {
								setError(null);
								if (currentTrack) {
									loadTrack(currentTrack);
								}
							}}
							className="px-4 py-2 text-sm rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"
						>
							{__('Try Again', 'fluxwave')}
						</button>
					</div>
				</div>
			)}
		</div>
	);
};

export default AudioPlayer;
