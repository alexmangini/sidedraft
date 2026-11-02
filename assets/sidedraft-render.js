/**
 * Turns a draft into safe HTML and reads type from an editor, for both the
 * Classic and block editor panes.
 */
window.sidedraftRender = ( function() {
	// Anyone who can edit the post sees this draft rendered, so it is cleaned
	// to plain formatting: no scripts, styles, embeds, forms or event handlers.
	var DROP = /^(script|style|iframe|frame|frameset|object|embed|applet|noscript|template|form|input|textarea|select|option|button|svg|math|link|meta|base|title|head)$/,
		KEEP = /^(h[1-6]|p|br|hr|strong|b|em|i|u|s|del|ins|mark|sub|sup|small|a|ul|ol|li|dl|dt|dd|blockquote|q|cite|code|pre|kbd|table|thead|tbody|tfoot|tr|th|td|caption|figure|figcaption|img|span|div|abbr|details|summary)$/,
		ATTRS = { href: 1, src: 1, alt: 1, title: 1, colspan: 1, rowspan: 1, start: 1, open: 1 };

	function safeUrl( url ) {
		// Browsers ignore whitespace and control characters inside a scheme.
		url = String( url || '' ).replace( /[\u0000- \u007f-\u009f]/g, '' );
		return /^(https?:|mailto:)/i.test( url ) || ! /^[a-z][a-z0-9+.-]*:/i.test( url );
	}

	function clean( node ) {
		Array.prototype.slice.call( node.childNodes ).forEach( function( child ) {
			var tag;

			if ( 8 === child.nodeType ) {
				node.removeChild( child );
				return;
			}
			if ( 1 !== child.nodeType ) {
				return;
			}

			tag = child.nodeName.toLowerCase();
			if ( DROP.test( tag ) ) {
				node.removeChild( child );
				return;
			}

			clean( child );

			// Unknown tags give up their contents and disappear.
			if ( ! KEEP.test( tag ) ) {
				while ( child.firstChild ) {
					node.insertBefore( child.firstChild, child );
				}
				node.removeChild( child );
				return;
			}

			Array.prototype.slice.call( child.attributes ).forEach( function( a ) {
				var name = a.name.toLowerCase();
				if ( ! ATTRS[ name ] || ( ( 'href' === name || 'src' === name ) && ! safeUrl( a.value ) ) ) {
					child.removeAttribute( a.name );
				}
			} );

			if ( 'a' === tag && child.hasAttribute( 'href' ) ) {
				child.setAttribute( 'target', '_blank' );
				child.setAttribute( 'rel', 'noopener noreferrer' );
			}
		} );
	}

	// A draft that opens with a block of HTML, comments aside, is HTML; anything
	// else is Markdown, which can still contain HTML. Skipping Markdown for HTML
	// drafts keeps indented tags from turning into code blocks.
	function isHtml( source ) {
		var start = source.replace( /<!--[\s\S]*?-->/g, '' ).trim();
		return /^<(p|h[1-6]|div|ul|ol|table|blockquote|figure|section|article|pre|hr|img)[\s>\/]/i.test( start ) &&
			! /^(#{1,6}\s|\|.*\||```)/m.test( start );
	}

	function toHtml( source ) {
		return isHtml( source ) ? source : window.marked.parse( source, { gfm: true } );
	}

	function fragment( source ) {
		// A template parses without running anything or loading images.
		var tpl = document.createElement( 'template' );
		tpl.innerHTML = toHtml( source || '' );
		clean( tpl.content );
		return tpl.content;
	}

	// Count what reads as words once formatted, not Markdown marks or tags.
	function words( source ) {
		return ( fragment( source ).textContent || '' ).trim().split( /\s+/ ).filter( Boolean ).length;
	}

	/**
	 * Reads body and heading type from whatever stylesheet an editor loads,
	 * using a throwaway paragraph and headings that are added and removed
	 * before anything redraws. Only type is copied; colors stay the pane's own.
	 */
	function type( container ) {
		var doc = container.ownerDocument,
			win = doc.defaultView,
			probe = doc.createElement( 'div' ),
			vars = {};

		probe.setAttribute( 'data-mce-bogus', 'all' );
		probe.style.cssText = 'position:absolute;left:-9999px;top:0;visibility:hidden';
		probe.innerHTML = '<p class="wp-block-paragraph">x</p><h1 class="wp-block-heading">x</h1><h2 class="wp-block-heading">x</h2><h3 class="wp-block-heading">x</h3><h4 class="wp-block-heading">x</h4>';
		container.appendChild( probe );

		Array.prototype.forEach.call( probe.children, function( el ) {
			var style = win.getComputedStyle( el ),
				name = 'P' === el.nodeName ? '--sidedraft' : '--sidedraft-' + el.nodeName.toLowerCase();
			vars[ name + '-font' ] = style.fontFamily;
			vars[ name + '-size' ] = style.fontSize;
			vars[ name + '-weight' ] = style.fontWeight;
			vars[ name + '-line' ] = style.lineHeight;
		} );

		container.removeChild( probe );
		return vars;
	}

	/**
	 * What to put in the draft for a paste. A formatted copy, from a web page
	 * or the block editor, keeps its headings, paragraphs, lists, tables and
	 * links as tidy HTML. Plain text, Markdown or code comes through as is.
	 *
	 * Returns null to let the paste happen normally.
	 */
	function paste( data ) {
		var html = data.getData( 'text/html' ),
			tpl, out;

		if ( ! html || ! /<(p|h[1-6]|li|table|a|strong|b|em|i|blockquote)[\s>]/i.test( html ) ) {
			return null;
		}

		tpl = document.createElement( 'template' );
		tpl.innerHTML = html;
		clean( tpl.content );

		Array.prototype.forEach.call( tpl.content.querySelectorAll( 'span' ), function( span ) {
			while ( span.firstChild ) {
				span.parentNode.insertBefore( span.firstChild, span );
			}
			span.parentNode.removeChild( span );
		} );

		// Display-only link attributes from clean() don't belong in the source.
		Array.prototype.forEach.call( tpl.content.querySelectorAll( 'a' ), function( a ) {
			a.removeAttribute( 'target' );
			a.removeAttribute( 'rel' );
		} );

		out = document.createElement( 'div' );
		out.appendChild( tpl.content );

		return out.innerHTML
			.replace( />\s+</g, '><' )
			.replace( /<\/(p|h[1-6]|ul|ol|table|blockquote|pre|figure|div)>/g, '</$1>\n\n' )
			.replace( /<\/(li|tr|thead|tbody|figcaption)>/g, '</$1>\n' )
			.replace( /<(ul|ol|table|thead|tbody)>/g, '<$1>\n' )
			.replace( /\n{3,}/g, '\n\n' )
			.trim();
	}

	// Inserts at the cursor the way typing would, so undo still works.
	function insert( field, text ) {
		field.focus();
		if ( ! document.execCommand || ! document.execCommand( 'insertText', false, text ) ) {
			field.setRangeText( text, field.selectionStart, field.selectionEnd, 'end' );
			field.dispatchEvent( new Event( 'input', { bubbles: true } ) );
		}
	}

	return {
		paste: paste,
		insert: insert,
		fragment: fragment,
		words: words,
		type: type
	};
}() );
