<?php
/**
 * Draft and Focus buttons next to Add Media.
 *
 * @package Draft_Beside
 */

defined( 'ABSPATH' ) || exit;
?>
<button type="button" class="button sidedraft-toggle" aria-pressed="false"><span class="dashicons dashicons-text-page" aria-hidden="true"></span> <?php esc_html_e( 'Draft', 'sidedraft' ); ?></button>
<button type="button" class="button sidedraft-focus" aria-pressed="false" title="<?php esc_attr_e( 'Focus mode (Esc to leave)', 'sidedraft' ); ?>"><span class="dashicons dashicons-editor-expand" aria-hidden="true"></span> <?php esc_html_e( 'Focus', 'sidedraft' ); ?></button>
