/**
 * Playlist State Store
 * Zustand store for managing playlist state
 * 
 * @package Fluxwave
 */

import { create } from 'zustand';

const usePlaylistStore = create((set, get) => ({
	// Playlist data
	tracks: [],
	
	// Currently selected track for editing
	selectedTrackId: null,
	
	// Drag state
	isDragging: false,
	
	// Actions
	setTracks: (tracks) => set({ tracks }),
	
	addTrack: (track) => set((state) => ({
		tracks: [...state.tracks, track],
	})),
	
	removeTrack: (trackId) => set((state) => ({
		tracks: state.tracks.filter((t) => t.id !== trackId),
	})),
	
	updateTrack: (trackId, updates) => set((state) => ({
		tracks: state.tracks.map((t) =>
			t.id === trackId ? { ...t, ...updates } : t
		),
	})),
	
	reorderTracks: (startIndex, endIndex) => {
		const { tracks } = get();
		const result = Array.from(tracks);
		const [removed] = result.splice(startIndex, 1);
		result.splice(endIndex, 0, removed);
		
		// Update track numbers
		const updated = result.map((track, index) => ({
			...track,
			trackNumber: index + 1,
		}));
		
		set({ tracks: updated });
		return updated;
	},
	
	setSelectedTrack: (trackId) => set({ selectedTrackId: trackId }),
	
	setIsDragging: (isDragging) => set({ isDragging }),
	
	clearTracks: () => set({ tracks: [], selectedTrackId: null }),
}));

export default usePlaylistStore;
