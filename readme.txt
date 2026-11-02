=== Sidedraft – Split-Screen Drafts ===
Contributors: alexmangini
Tags: writing, draft, markdown, classic editor, split screen
Requires at least: 6.2
Tested up to: 7.1
Requires PHP: 7.4
Stable tag: 1.0.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Keep a draft open beside the editor while you write the post in your own words.

== Description ==

Sidedraft puts a draft next to your post while you write. Paste in an outline, an old version, notes, or a draft from anywhere else, then write the real post beside it without switching windows.

The draft saves with the post. It is never shown on your site, in feeds, or in the public REST API.

= Classic editor =

* The draft sits to the left of the editor, at the same height, with its first line level with yours.
* It uses your editor's fonts and sizes, so you can read straight across. It keeps its own background so you always know which side is which.
* Switch between the formatted draft and its source.
* Focus mode hides the admin menu and gives both sides the full width. Press Esc to leave.
* Drag the edge of the draft to resize it.
* Works with ClassicPress and with the Classic Editor plugin.

= Block editor =

* The draft opens as a sidebar next to Post and Block settings, so nothing in the editor changes.
* It opens wide for reading and can switch back to the normal sidebar width.
* Pin it to the toolbar with the star in the sidebar header.

= Markdown or HTML =

Paste either one. A draft that opens with HTML is shown as HTML. Anything else is read as Markdown, which can include HTML too.

Copy from a web page or the block editor and the draft keeps the headings, paragraphs, lists, tables, and links, as clean HTML without styles or block markup. Text copied from a code or text editor comes through as typed.

Either way, scripts, styles, embeds, forms, and event handlers are removed before the draft is shown.

== Installation ==

1. Install and activate the plugin from the Plugins screen.
2. Open a post.
3. Classic editor: click **Draft** next to Add Media. Block editor: open the ⋮ menu and choose **Draft**.
4. Paste your draft and start writing.

== Frequently Asked Questions ==

= Is the draft ever published? =

No. It is stored as hidden post meta and only shown on the edit screen to people who can edit the post.

= Does publishing remove the draft? =

No. It stays with the post so you can refer back to it. To remove it, click the trash button and save the post.

= Does autosave save the draft? =

No. The draft saves when you save the post. If you change the draft and try to leave without saving, you'll get a warning.

= Which post types does it work on? =

Any post type that uses the content editor.

= Does it load anything from outside my site? =

No. Markdown is handled by the bundled [marked](https://github.com/markedjs/marked) library (MIT license).

== Screenshots ==

1. The draft beside the Classic editor, lined up row for row.
2. Focus mode.
3. The draft sidebar in the block editor.

== Changelog ==

= 1.0.0 =
* First release.

== Upgrade Notice ==

= 1.0.0 =
First release.
