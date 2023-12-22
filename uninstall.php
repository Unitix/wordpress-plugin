<?php declare(strict_types = 1);
/**
 * Triggered on plugin uninstall
 */

if (!defined( 'WP_UNINSTALL_PLUGIN' )) {
	exit;
}

// Clear data stored in database.
$books = get_posts(
	[
		'post_type'   => 'book',
		'numberposts' => -1,
	]
);

global $wpdb;
$wpdb->query( "DELETE FROM wp_posts WHERE post_type = 'book'" );
$wpdb->query( 'DELETE FROM wp_postmeta WHERE post_id NOT IN (SELECT id FROM wp_posts)' );
$wpdb->query( 'DELETE FROM wp_term_relationships WHERE object_id NOT IN  (SELECT id FROM wp_posts)' );
