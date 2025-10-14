/**
 * Transport Controls Component
 * Play, pause, skip, and playback controls
 * 
 * @package Fluxwave
 */

import { __ } from '@wordpress/i18n';
import { useState, memo } from '@wordpress/element';

const TransportControls = memo(({
	isPlaying,
	onPlayPause,
	onPrevious,
	onNext,
	hasPrevious,
	hasNext,
	playbackRate = 1,
	onPlaybackRateChange,
	onSkipForward,
	onSkipBackward,
	accentColor = '#06b6d4',
	theme = 'light'
}) => {
	const [showCopiedMessage, setShowCopiedMessage] = useState(false);
	const speedOptions = [0.5, 0.75, 1, 1.25, 1.5, 2];
	
	const cycleSpeed = () => {
		const currentIndex = speedOptions.indexOf(playbackRate);
		const nextIndex = (currentIndex + 1) % speedOptions.length;
		onPlaybackRateChange(speedOptions[nextIndex]);
	};

	// Handle share - copy current page URL to clipboard
	const handleShare = async () => {
		try {
			const url = window.location.href;
			await navigator.clipboard.writeText(url);
			
			// Show copied message
			setShowCopiedMessage(true);
			setTimeout(() => {
				setShowCopiedMessage(false);
			}, 2000);
		} catch (error) {
			console.error('Failed to copy:', error);
			// Fallback for older browsers
			const textArea = document.createElement('textarea');
			textArea.value = window.location.href;
			textArea.style.position = 'fixed';
			textArea.style.left = '-999999px';
			document.body.appendChild(textArea);
			textArea.select();
			try {
				document.execCommand('copy');
				setShowCopiedMessage(true);
				setTimeout(() => {
					setShowCopiedMessage(false);
				}, 2000);
			} catch (err) {
				console.error('Fallback copy failed:', err);
			}
			document.body.removeChild(textArea);
		}
	};

	return (
		<div className={`flex items-center relative px-8 py-6 rounded-b-xl ${theme === 'dark' ? 'bg-black text-white' : 'bg-white text-gray-600'}`} role="group" aria-label="Player controls">
			<div className="flex-auto flex items-center justify-evenly">
				{/* Share Button */}
				<div className="relative">
					<button 
						type="button" 
						aria-label={__('Share', 'fluxwave')}
						className={`transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-600'}`}
						onClick={handleShare}
						onMouseEnter={(e) => e.currentTarget.style.color = accentColor}
						onMouseLeave={(e) => e.currentTarget.style.color = ''}
						title={__('Share this page', 'fluxwave')}
					>
						<svg width="24" height="24" fill="none" viewBox="0 0 24 24">
							<circle cx="18" cy="5" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
							<circle cx="6" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
							<circle cx="18" cy="19" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
							<line x1="8.59" y1="13.51" x2="15.42" y2="17.49" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
							<line x1="15.41" y1="6.51" x2="8.59" y2="10.49" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
						</svg>
					</button>
					
					{/* Copied notification */}
					{showCopiedMessage && (
						<div 
							className="absolute -top-10 left-1/2 transform -translate-x-1/2 px-3 py-1.5 rounded-md shadow-lg text-xs font-medium text-white whitespace-nowrap z-50"
							style={{ backgroundColor: accentColor }}
						>
							{__('Link copied!', 'fluxwave')}
							<div 
								className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2"
								style={{ backgroundColor: accentColor }}
							></div>
						</div>
					)}
				</div>
				
				{/* Previous Track */}
				<button 
					type="button" 
					className={`hidden sm:block lg:hidden xl:block transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${theme === 'dark' ? 'text-white' : 'text-gray-600'}`}
					aria-label={__('Previous track', 'fluxwave')}
					onClick={onPrevious}
					disabled={!hasPrevious}
					onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.color = accentColor)}
					onMouseLeave={(e) => e.currentTarget.style.color = ''}
				>
					<svg width="24" height="24" fill="none">
						<path d="m10 12 8-6v12l-8-6Z" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
						<path d="M6 6v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
					</svg>
				</button>
				
				{/* Skip Backward 10 seconds */}
				<button 
					type="button" 
					aria-label={__('Rewind 10 seconds', 'fluxwave')}
					className={`transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-600'}`}
					onClick={onSkipBackward}
					onMouseEnter={(e) => e.currentTarget.style.color = accentColor}
					onMouseLeave={(e) => e.currentTarget.style.color = ''}
				>
					<svg width="24" height="24" fill="none">
						<path d="M6.492 16.95c2.861 2.733 7.5 2.733 10.362 0 2.861-2.734 2.861-7.166 0-9.9-2.862-2.733-7.501-2.733-10.362 0A7.096 7.096 0 0 0 5.5 8.226" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
						<path d="M5 5v3.111c0 .491.398.889.889.889H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
					</svg>
				</button>
			</div>
			
			{/* Play/Pause Button */}
			<button 
				type="button" 
				className={`flex-none -my-2 mx-auto w-20 h-20 rounded-full border-2 flex items-center justify-center transition-colors ${theme === 'dark' ? 'bg-white text-black border-white hover:bg-gray-100' : 'bg-white text-gray-900 border-gray-300 hover:bg-gray-100'}`} 
				aria-label={isPlaying ? __('Pause', 'fluxwave') : __('Play', 'fluxwave')}
				onClick={onPlayPause}
				onMouseEnter={(e) => {
					e.currentTarget.style.backgroundColor = accentColor;
					e.currentTarget.style.color = 'white';
				}}
				onMouseLeave={(e) => {
					e.currentTarget.style.backgroundColor = '';
					e.currentTarget.style.color = '';
				}}
			>
				{isPlaying ? (
					<svg width="30" height="32" fill="currentColor">
						<rect x="6" y="4" width="4" height="24" rx="2" />
						<rect x="20" y="4" width="4" height="24" rx="2" />
					</svg>
				) : (
					<svg width="30" height="32" fill="currentColor" viewBox="0 0 30 32">
						<path d="M8 4l20 12L8 28V4z" />
					</svg>
				)}
			</button>
			
			<div className="flex-auto flex items-center justify-evenly">
				{/* Skip Forward 10 seconds */}
				<button 
					type="button" 
					aria-label={__('Skip 10 seconds', 'fluxwave')}
					className={`transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-600'}`}
					onClick={onSkipForward}
					onMouseEnter={(e) => e.currentTarget.style.color = accentColor}
					onMouseLeave={(e) => e.currentTarget.style.color = ''}
				>
					<svg width="24" height="24" fill="none">
						<path d="M17.509 16.95c-2.862 2.733-7.501 2.733-10.363 0-2.861-2.734-2.861-7.166 0-9.9 2.862-2.733 7.501-2.733 10.363 0 .38.365.711.759.991 1.176" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
						<path d="M19 5v3.111c0 .491-.398.889-.889.889H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
					</svg>
				</button>
				
				{/* Next Track */}
				<button 
					type="button" 
					className={`hidden sm:block lg:hidden xl:block transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${theme === 'dark' ? 'text-white' : 'text-gray-600'}`} 
					aria-label={__('Next track', 'fluxwave')}
					onClick={onNext}
					disabled={!hasNext}
					onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.color = accentColor)}
					onMouseLeave={(e) => e.currentTarget.style.color = ''}
				>
					<svg width="24" height="24" fill="none">
						<path d="M14 12 6 6v12l8-6Z" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
						<path d="M18 6v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
					</svg>
				</button>
				
				{/* Speed Control */}
				<button 
					type="button" 
					className={`rounded-lg text-xs leading-6 font-semibold px-3 py-2 border-2 transition-colors min-h-[44px] min-w-[44px] ${theme === 'dark' ? 'border-white text-white hover:bg-gray-800' : 'border-gray-300 text-gray-600 hover:bg-gray-200'}`}
					onClick={cycleSpeed}
					aria-label={__('Change playback speed. Current speed:', 'fluxwave') + ' ' + playbackRate + 'x'}
					aria-describedby="speed-description"
					onMouseEnter={(e) => {
						e.currentTarget.style.backgroundColor = accentColor;
						e.currentTarget.style.color = 'white';
						e.currentTarget.style.borderColor = accentColor;
					}}
					onMouseLeave={(e) => {
						e.currentTarget.style.backgroundColor = '';
						e.currentTarget.style.color = '';
						e.currentTarget.style.borderColor = '';
					}}
				>
					{playbackRate}x
				</button>
				
				{/* Hidden description for screen readers */}
				<div id="speed-description" className="sr-only">
					{__('Click to cycle through playback speeds: 0.5x, 0.75x, 1x, 1.25x, 1.5x, 2x', 'fluxwave')}
				</div>
			</div>
		</div>
	);
});

TransportControls.displayName = 'TransportControls';

export default TransportControls;
