<?php
// This file is generated. Do not modify it manually.
return array(
	'fluxwave' => array(
		'$schema' => 'https://schemas.wp.org/trunk/block.json',
		'apiVersion' => 3,
		'name' => 'fluxwave/fluxwave',
		'version' => '0.1.0',
		'title' => 'Fluxwave',
		'category' => 'media',
		'icon' => 'format-audio',
		'description' => 'A modern audio player with playlist management and playback controls.',
		'keywords' => array(
			'audio',
			'music',
			'player',
			'playlist'
		),
		'example' => array(
			
		),
		'attributes' => array(
			'tracks' => array(
				'type' => 'array',
				'default' => array(
					
				),
				'items' => array(
					'type' => 'object'
				)
			),
			'currentTrackIndex' => array(
				'type' => 'number',
				'default' => 0
			),
			'accentColor' => array(
				'type' => 'string',
				'default' => '#06b6d4'
			),
			'autoplay' => array(
				'type' => 'boolean',
				'default' => false
			),
			'loop' => array(
				'type' => 'boolean',
				'default' => false
			)
		),
		'supports' => array(
			'html' => false,
			'align' => false,
			'color' => false,
			'typography' => false,
			'customClassName' => false
		),
		'textdomain' => 'fluxwave',
		'editorScript' => 'file:./index.js',
		'editorStyle' => 'file:./index.css',
		'style' => 'file:./style-index.css',
		'render' => 'file:./render.php',
		'viewScript' => 'file:./view.js'
	)
);
