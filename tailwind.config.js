/** @type {import('tailwindcss').Config} */
module.exports = {
	content: [
		'./src/**/*.{js,jsx,ts,tsx}',
	],
	darkMode: 'class', // Enable class-based dark mode
	theme: {
		extend: {
			colors: {
				fluxwave: {
					primary: '#6366f1',
					secondary: '#8b5cf6',
					accent: '#ec4899',
				},
			},
		},
	},
	plugins: [],
};
