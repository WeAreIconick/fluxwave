/**
 * Track Info Component
 * Displays current track information
 * 
 * @package Fluxwave
 */

import { __ } from '@wordpress/i18n';
import { memo } from '@wordpress/element';

const TrackInfo = memo(({ track, currentTrackIndex, totalTracks, accentColor = '#06b6d4' }) => {
	if (!track) {
		return (
			<div className="text-center py-8">
				<p className="text-gray-500 text-sm">
					{__('No track selected', 'fluxwave')}
				</p>
			</div>
		);
	}

	return (
		<div className="flex items-center space-x-4">
			{/* Album Art */}
			<img 
				src={track.artwork || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="88" height="88" fill="none"%3E%3Crect width="88" height="88" fill="%23e2e8f0" rx="8"/%3E%3Cpath fill="%2394a3b8" d="M44 28c-8.837 0-16 7.163-16 16s7.163 16 16 16 16-7.163 16-16-7.163-16-16-16zm0 4a6 6 0 100 12 6 6 0 000-12z"/%3E%3C/svg%3E'} 
				alt={track.title || __('Album artwork', 'fluxwave')} 
				width="88" 
				height="88" 
				className="flex-none rounded-lg bg-slate-100" 
				loading="lazy" 
			/>
			<div className="min-w-0 flex-auto space-y-1 font-semibold">
				<p className="text-sm leading-6" style={{ color: accentColor }}>
					<abbr title="Track">Track:</abbr> {String((currentTrackIndex || 0) + 1).padStart(2, '0')}
				</p>
				<h2 className="text-slate-500 text-sm leading-6 truncate">
					{track.artist ? track.artist : (track.album ? `Album: ${track.album}` : __('Unknown Artist', 'fluxwave'))}
				</h2>
				<p className="text-slate-900 text-lg">
					{track.title || __('Untitled Track', 'fluxwave')}
				</p>
			</div>
		</div>
	);
});

TrackInfo.displayName = 'TrackInfo';

export default TrackInfo;
