/**
 * Progress Bar Component
 * Displays and controls playback progress
 * 
 * @package Fluxwave
 */

import { useState, useRef, memo } from '@wordpress/element';

const ProgressBar = memo(({ currentTime = 0, duration = 0, onSeek, accentColor = '#06b6d4', theme = 'light' }) => {
	const [isDragging, setIsDragging] = useState(false);
	const [dragTime, setDragTime] = useState(0);
	const progressBarRef = useRef(null);

	const formatTime = (seconds) => {
		if (!isFinite(seconds) || isNaN(seconds) || seconds < 0) {
			return '0:00';
		}
		
		const mins = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	};

	const handleMouseDown = (e) => {
		setIsDragging(true);
		handleSeek(e);
	};

	const handleMouseMove = (e) => {
		if (isDragging) {
			handleSeek(e);
		}
	};

	const handleMouseUp = () => {
		if (isDragging) {
			setIsDragging(false);
			if (onSeek) {
				onSeek(dragTime);
			}
		}
	};

	const handleSeek = (e) => {
		if (!progressBarRef.current || !duration) return;

		const rect = progressBarRef.current.getBoundingClientRect();
		const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
		const percentage = x / rect.width;
		const time = percentage * duration;

		setDragTime(time);

		// Update immediately if not dragging
		if (!isDragging && onSeek) {
			onSeek(time);
		}
	};

	const displayTime = isDragging ? dragTime : currentTime;
	const progress = duration > 0 ? (displayTime / duration) * 100 : 0;

	return (
		<div className="space-y-2">
			{/* Progress Bar */}
			<div className="relative">
				<div 
					ref={progressBarRef}
					className="bg-slate-100 rounded-full overflow-hidden cursor-pointer"
					role="slider"
					aria-label="Seek position"
					aria-valuemin="0"
					aria-valuemax={Math.round(duration)}
					aria-valuenow={Math.round(displayTime)}
					aria-valuetext={`${formatTime(displayTime)} of ${formatTime(duration)}`}
					tabIndex="0"
					onMouseDown={handleMouseDown}
					onMouseMove={handleMouseMove}
					onMouseUp={handleMouseUp}
					onMouseLeave={handleMouseUp}
					onKeyDown={(e) => {
						if (e.key === 'ArrowLeft') {
							e.preventDefault();
							const newTime = Math.max(0, currentTime - 5);
							handleSeek(newTime);
						} else if (e.key === 'ArrowRight') {
							e.preventDefault();
							const newTime = Math.min(duration, currentTime + 5);
							handleSeek(newTime);
						} else if (e.key === 'Home') {
							e.preventDefault();
							handleSeek(0);
						} else if (e.key === 'End') {
							e.preventDefault();
							handleSeek(duration);
						} else if (e.key === 'PageUp') {
							e.preventDefault();
							const newTime = Math.min(duration, currentTime + 30);
							handleSeek(newTime);
						} else if (e.key === 'PageDown') {
							e.preventDefault();
							const newTime = Math.max(0, currentTime - 30);
							handleSeek(newTime);
						}
					}}
				>
					<div 
						className="h-2" 
						role="progressbar" 
						aria-label="music progress" 
						aria-valuenow={Math.round(displayTime)} 
						aria-valuemin="0" 
						aria-valuemax={Math.round(duration)}
						style={{ 
							width: `${Math.min(100, Math.max(0, progress))}%`,
							backgroundColor: accentColor
						}}
					></div>
				</div>
				<div 
					className="ring-2 absolute top-1/2 w-4 h-4 -mt-2 -ml-2 flex items-center justify-center bg-white rounded-full shadow cursor-pointer"
					style={{ 
						left: `${Math.min(100, Math.max(0, progress))}%`,
						borderColor: accentColor
					}}
				>
					<div 
						className="w-1.5 h-1.5 rounded-full ring-1 ring-inset ring-slate-900/5"
						style={{ backgroundColor: accentColor }}
					></div>
				</div>
			</div>

			{/* Time Display */}
			<div className="flex justify-between text-sm leading-6 font-medium tabular-nums">
				<div style={{ color: accentColor }}>{formatTime(displayTime)}</div>
				<div className={`text-sm leading-6 font-medium tabular-nums ${theme === 'dark' ? 'text-white' : 'text-gray-600'}`}>{formatTime(duration)}</div>
			</div>
		</div>
	);
});

ProgressBar.displayName = 'ProgressBar';

export default ProgressBar;
