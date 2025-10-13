=== Fluxwave ===
Contributors:      iconick
Tags:              audio, music, player, playlist, block
Requires at least: 6.7
Tested up to:      6.8
Stable tag:        1.0.0
Requires PHP:      7.4
License:           GPL-2.0-or-later
License URI:       https://www.gnu.org/licenses/gpl-2.0.html

A modern, accessible WordPress audio player block with playlist management, customizable design, and advanced playback controls.

== Description ==

Fluxwave is a cutting-edge audio player block for WordPress that brings professional music streaming capabilities to your website. Built with modern web technologies and designed with accessibility in mind, Fluxwave offers a beautiful, performant, and user-friendly audio experience.

= Key Features =

* 🎵 **Playlist Management** - Create and manage playlists with drag-and-drop reordering
* 🎨 **Customizable Design** - Choose from 13 accent colors or use custom hex values
* 🖼️ **Album Artwork** - Upload custom artwork for each track via WordPress Media Library
* ✏️ **Inline Metadata Editing** - Edit track titles and artists directly in the editor
* ⚡ **Playback Controls** - Play, pause, skip forward/back 10 seconds, speed control (0.5x-2x)
* 🔄 **Repeat & Shuffle** - Multiple repeat modes and playlist navigation
* 📱 **Fully Responsive** - Beautiful on desktop, tablet, and mobile
* ♿ **100% Accessible** - WCAG 2.1 AA compliant with full keyboard navigation
* 🚀 **Lightning Fast** - Only 17KB gzipped on the frontend
* 🔒 **Secure** - All inputs sanitized, outputs escaped, no vulnerabilities

= Technical Highlights =

* Built with React 18 and WordPress 6.7+ APIs
* Powered by Howler.js for reliable audio playback
* Modern Tailwind CSS 4 design system
* Zustand for efficient state management
* Zero security vulnerabilities
* Production-ready performance

= Keyboard Shortcuts =

* **Space** - Play/Pause
* **Shift + Left/Right Arrow** - Previous/Next track
* **Arrow Keys** - Seek when progress bar focused (±5 seconds)
* **Home/End** - Jump to start/end of track

= Perfect For =

* Podcasters sharing episodes
* Musicians showcasing albums
* Audio blogs and storytelling
* Educational content with audio
* Music streaming websites
* Audio portfolios

== Installation ==

1. Upload the plugin files to `/wp-content/plugins/fluxwave`, or install through the WordPress plugins screen
2. Activate the plugin through the 'Plugins' screen in WordPress
3. Add the Fluxwave block to any post or page
4. Upload audio files from your WordPress Media Library
5. Customize the player appearance and behavior
6. Publish and enjoy!

== Frequently Asked Questions ==

= What audio formats are supported? =

Fluxwave supports all audio formats that your browser can play, including MP3, AAC, OGG, WAV, FLAC, OPUS, and WEBM.

= Can I customize the player colors? =

Yes! You can choose from 13 preset colors or enter any custom hex color value. The accent color affects progress bars, buttons, and highlights.

= Is the player accessible? =

Absolutely! Fluxwave is WCAG 2.1 AA compliant with full keyboard navigation, ARIA labels, screen reader support, and respects user preferences for reduced motion.

= How do I add album artwork? =

In the editor, click the square image placeholder next to each track. This opens the WordPress Media Library where you can upload or select an image.

= Can I edit track information? =

Yes! Click the pencil icon next to any track to edit its title and artist name inline.

= Does it work on mobile devices? =

Yes! Fluxwave is fully responsive and optimized for touch devices with proper touch targets and mobile layouts.

= How many tracks can I add? =

There's no hard limit, but performance is optimized for playlists up to 100 tracks. Larger playlists will work but may load slower.

= Does it auto-play audio? =

Only if you enable the Autoplay option in the block settings. By default, users must click play (respecting WCAG guidelines).

= Is it compatible with my theme? =

Yes! Fluxwave works with both block themes and classic themes. It uses WordPress core styling and doesn't conflict with theme CSS.

== Screenshots ==

1. Beautiful audio player with album artwork and playback controls
2. Playlist editor with drag-and-drop track reordering
3. Color customization with 13 preset options
4. Inline metadata editing for track information
5. Responsive mobile view

== Changelog ==

= 1.0.0 - 2025-01-15 =
* Initial release
* Audio player with playlist management
* Customizable accent colors
* Album artwork upload
* Inline metadata editing
* Keyboard navigation support
* WCAG 2.1 AA accessibility compliance
* Responsive design
* Skip forward/backward 10 seconds
* Playback speed control (0.5x-2x)
* Share button (copy link to clipboard)
* Performance optimized (17KB frontend bundle)
* Zero security vulnerabilities

== Upgrade Notice ==

= 1.0.0 =
Initial release of Fluxwave. A modern, accessible audio player block for WordPress.

== Credits ==

* Built with [Howler.js](https://howlerjs.com/) for reliable audio playback
* Drag-and-drop powered by [@dnd-kit](https://dndkit.com/)
* Design inspired by modern audio player UX patterns
* Icons from Heroicons

== Support ==

For support, feature requests, or bug reports, please visit the [GitHub repository](https://github.com/fluxwave/fluxwave) or the WordPress support forums.
