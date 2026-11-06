<?php
/**
 * The draft pane beside the Classic editor. Opens the split; the editor
 * prints into .sidedraft-main, which sidedraft_close() ends.
 *
 * @package Draft_Beside
 *
 * @var string $draft The post's saved draft.
 */

defined( 'ABSPATH' ) || exit;
?>
<div id="sidedraft" class="<?php echo esc_attr( '' !== $draft ? 'sidedraft has-draft' : 'sidedraft' ); ?>">
	<div class="sidedraft-pane">
		<div class="sidedraft-head">
			<label for="sidedraft-text"><?php esc_html_e( 'Draft', 'sidedraft' ); ?></label>
			<span class="sidedraft-views" role="group" aria-label="<?php esc_attr_e( 'Draft view', 'sidedraft' ); ?>">
				<button type="button" class="sidedraft-view-button" data-view="formatted" aria-pressed="false"><?php esc_html_e( 'Formatted', 'sidedraft' ); ?></button>
				<button type="button" class="sidedraft-view-button" data-view="source" aria-pressed="false"><?php esc_html_e( 'Source', 'sidedraft' ); ?></button>
			</span>
		</div>
		<div class="sidedraft-box">
			<div class="sidedraft-bar">
				<span class="sidedraft-count"></span>
				<button type="button" class="sidedraft-icon sidedraft-focus-mini" aria-pressed="false" aria-label="<?php esc_attr_e( 'Focus mode', 'sidedraft' ); ?>" title="<?php esc_attr_e( 'Focus mode (Esc to leave)', 'sidedraft' ); ?>">
					<span class="dashicons dashicons-editor-expand" aria-hidden="true"></span>
				</button>
				<button type="button" class="sidedraft-icon sidedraft-close" aria-label="<?php esc_attr_e( 'Hide draft', 'sidedraft' ); ?>" title="<?php esc_attr_e( 'Hide draft', 'sidedraft' ); ?>">
					<svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="2.75" y="3.75" width="14.5" height="12.5" rx="1.5"/><path d="M7.5 3.75v12.5M13 8l-2 2 2 2"/></svg>
				</button>
				<button type="button" class="sidedraft-icon sidedraft-clear" aria-label="<?php esc_attr_e( 'Clear draft', 'sidedraft' ); ?>" title="<?php esc_attr_e( 'Clear draft', 'sidedraft' ); ?>">
					<svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M3.5 5.5h13M8 5.5v-2h4v2M5.5 5.5l.8 11h7.4l.8-11M8.5 8.5v5M11.5 8.5v5"/></svg>
				</button>
			</div>
			<?php wp_nonce_field( 'sidedraft_save', 'sidedraft_nonce' ); ?>
			<textarea id="sidedraft-text" name="sidedraft" placeholder="<?php esc_attr_e( 'Paste a draft in Markdown or HTML. It saves with the post and is never shown on your site.', 'sidedraft' ); ?>"><?php echo esc_textarea( $draft ); ?></textarea>
			<div class="sidedraft-formatted" tabindex="0"></div>
		</div>
		<div class="sidedraft-resize" title="<?php esc_attr_e( 'Drag to resize', 'sidedraft' ); ?>"></div>
	</div>
	<div class="sidedraft-main">
