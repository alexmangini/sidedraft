<?php
/**
 * Plugin Name:       Draft Beside – Split-Screen Writing
 * Description:       Keep a draft open beside the editor while you write the post in your own words. Works in the Classic and block editors.
 * Version:           1.0.0
 * Requires at least: 6.2
 * Requires PHP:      7.4
 * Requires CP:       2.0
 * Author:            Alex Mangini
 * Author URI:        https://alexmangini.com/
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       sidedraft
 *
 * @package Draft_Beside
 */

defined( 'ABSPATH' ) || exit;
define( 'SIDEDRAFT_VERSION', '1.0.0' );
define( 'SIDEDRAFT_META', '_sidedraft' );

/**
 * Only show the draft pane on post types that use the content editor.
 *
 * @param WP_Post|null $post Post being edited.
 * @return bool
 */

function sidedraft_enabled( $post ) {
	return $post instanceof WP_Post
		&& post_type_supports( $post->post_type, 'editor' )
		&& ! ( function_exists( 'use_block_editor_for_post' ) && use_block_editor_for_post( $post ) );
}

/**
 * Cleans a draft the way WordPress cleans post content: kept as typed for
 * users allowed to post unfiltered HTML, limited to post HTML for everyone
 * else. Markdown passes through untouched either way.
 *
 * @param string $draft Draft as submitted.
 * @return string
 */

function sidedraft_sanitize( $draft ) {
	$draft = (string) $draft;

	if ( current_user_can( 'unfiltered_html' ) ) {
		return $draft;
	}

	return str_replace( '&amp;', '&', wp_kses_post( $draft ) );
}

/**
 * Saves or removes a post's draft.
 *
 * @param int    $post_id Post ID.
 * @param string $draft   Draft, already sanitized.
 */

function sidedraft_store( $post_id, $draft ) {
	if ( '' === trim( $draft ) ) {
		delete_post_meta( $post_id, SIDEDRAFT_META );
	} else {
		update_post_meta( $post_id, SIDEDRAFT_META, wp_slash( $draft ) );
	}
}

/**
 * Open the split: the draft pane, then a column the editor prints into.
 *
 * @param WP_Post $post Post being edited.
 */

function sidedraft_open( $post ) {
	if ( ! sidedraft_enabled( $post ) ) {
		return;
	}

	$draft = (string) get_post_meta( $post->ID, SIDEDRAFT_META, true );

	require __DIR__ . '/templates/pane.php';
}

add_action( 'edit_form_after_title', 'sidedraft_open' );

/**
 * Close the split after the editor.
 *
 * @param WP_Post $post Post being edited.
 */

function sidedraft_close( $post ) {
	if ( ! sidedraft_enabled( $post ) ) {
		return;
	}

	echo '</div></div>';
}

add_action( 'edit_form_after_editor', 'sidedraft_close' );

/**
 * Draft and Focus buttons next to Add Media.
 *
 * @param string $editor_id Editor the buttons are for.
 */

function sidedraft_buttons( $editor_id ) {
	if ( 'content' !== $editor_id || ! sidedraft_enabled( get_post() ) ) {
		return;
	}

	require __DIR__ . '/templates/buttons.php';
}

add_action( 'media_buttons', 'sidedraft_buttons', 20 );

/**
 * Asset version: the plugin version plus the file's last change, so browsers
 * never keep an old copy after an update.
 *
 * @param string $file File in the assets folder.
 * @return string
 */

function sidedraft_version( $file ) {
	return SIDEDRAFT_VERSION . '.' . filemtime( __DIR__ . '/assets/' . $file );
}

/**
 * Rendering and formatted-draft styles used by both editors.
 *
 * @return string URL of the assets folder.
 */

function sidedraft_register_shared() {
	$url = plugin_dir_url( __FILE__ ) . 'assets/';

	wp_register_style( 'sidedraft-formatted', $url . 'sidedraft-formatted.css', array(), sidedraft_version( 'sidedraft-formatted.css' ) );

	wp_register_script( 'sidedraft-marked', $url . 'vendor/marked.js', array(), '15.0.12', true );

	wp_register_script( 'sidedraft-render', $url . 'sidedraft-render.js', array( 'sidedraft-marked' ), sidedraft_version( 'sidedraft-render.js' ), true );

	return $url;
}

/**
 * Classic editor assets.
 *
 * @param string $hook Current admin page.
 */

function sidedraft_assets( $hook ) {
	if ( ! in_array( $hook, array( 'post.php', 'post-new.php' ), true ) || ! sidedraft_enabled( get_post() ) ) {
		return;
	}

	$url = sidedraft_register_shared();

	wp_enqueue_style( 'sidedraft', $url . 'sidedraft.css', array( 'dashicons', 'sidedraft-formatted' ), sidedraft_version( 'sidedraft.css' ) );

	wp_enqueue_script( 'sidedraft', $url . 'sidedraft.js', array( 'jquery', 'sidedraft-render' ), sidedraft_version( 'sidedraft.js' ), true );

	wp_localize_script(
		'sidedraft',
		'sidedraft',
		array(
			/* translators: %s: Number of words. */
			'word'  => __( '%s word', 'sidedraft' ),
			/* translators: %s: Number of words. */
			'words' => __( '%s words', 'sidedraft' ),
			'clear' => __( "Clear this draft?\n\nIt's removed for good when you save the post.", 'sidedraft' ),
		)
	);
}

add_action( 'admin_enqueue_scripts', 'sidedraft_assets' );

/**
 * The block editor gets the draft as a sidebar, next to Post and Block
 * settings, so nothing in the editor itself changes.
 */

function sidedraft_block_assets() {
	$screen = get_current_screen();

	if ( ! $screen || 'post' !== $screen->base || ! post_type_supports( $screen->post_type, 'editor' ) ) {
		return;
	}

	$url = sidedraft_register_shared();

	wp_enqueue_style( 'sidedraft-block', $url . 'sidedraft-block.css', array( 'sidedraft-formatted' ), sidedraft_version( 'sidedraft-block.css' ) );

	wp_enqueue_script(
		'sidedraft-block',
		$url . 'sidedraft-block.js',
		array( 'sidedraft-render', 'wp-plugins', 'wp-editor', 'wp-edit-post', 'wp-element', 'wp-components', 'wp-data', 'wp-core-data', 'wp-i18n' ),
		sidedraft_version( 'sidedraft-block.js' ),
		true
	);

	wp_set_script_translations( 'sidedraft-block', 'sidedraft' );
}

add_action( 'enqueue_block_editor_assets', 'sidedraft_block_assets' );

/**
 * The block editor saves the draft through the REST API with the rest of the
 * post. The field only exists in the edit context, so it is never public.
 */

function sidedraft_rest_field() {
	register_rest_field(
		get_post_types_by_support( 'editor' ),
		'sidedraft',
		array(
			'get_callback'    => function ( $post ) {
				return (string) get_post_meta( $post['id'], SIDEDRAFT_META, true );
			},
			'update_callback' => function ( $draft, $post ) {
				if ( ! current_user_can( 'edit_post', $post->ID ) ) {
					return new WP_Error( 'sidedraft_forbidden', __( 'Sorry, you are not allowed to edit this draft.', 'sidedraft' ), array( 'status' => 403 ) );
				}
				sidedraft_store( $post->ID, sidedraft_sanitize( $draft ) );
				return true;
			},
			'schema'          => array(
				'description' => __( 'A draft kept beside the editor for reference. Never shown on the site.', 'sidedraft' ),
				'type'        => 'string',
				'context'     => array( 'edit' ),
			),
		)
	);
}

add_action( 'rest_api_init', 'sidedraft_rest_field' );

/**
 * Classic editor save.
 *
 * @param int $post_id Post ID.
 */

function sidedraft_save( $post_id ) {
	if ( ! isset( $_POST['sidedraft'], $_POST['sidedraft_nonce'] )
		|| ! wp_verify_nonce( sanitize_key( wp_unslash( $_POST['sidedraft_nonce'] ) ), 'sidedraft_save' )
		|| wp_is_post_revision( $post_id )
		|| wp_is_post_autosave( $post_id )
		|| ! current_user_can( 'edit_post', $post_id )
	) {
		return;
	}

	sidedraft_store( $post_id, sidedraft_sanitize( wp_unslash( $_POST['sidedraft'] ) ) ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- Sanitized by sidedraft_sanitize().
}

add_action( 'save_post', 'sidedraft_save' );
