( function( $ ) {
	var $split = $( '#sidedraft' ),
		$text = $( '#sidedraft-text' ),
		$formatted = $( '.sidedraft-formatted' ),
		$views = $( '.sidedraft-view-button' ),
		$toggle = $( '.sidedraft-toggle' ),
		$focus = $( '.sidedraft-focus, .sidedraft-focus-mini' ),
		$body = $( document.body ),
		initial = $text.val(),
		submitting = false;

	if ( ! $split.length ) {
		return;
	}

	function store( key, value ) {
		try {
			window.localStorage.setItem( 'sidedraft.' + key, value );
		} catch ( e ) {}
	}

	function stored( key ) {
		try {
			return window.localStorage.getItem( 'sidedraft.' + key );
		} catch ( e ) {
			return null;
		}
	}

	// The full-height editor sizes its sticky toolbar on window resize.
	function relayout() {
		$( window ).trigger( 'resize' );
	}

	// Editor styles often center a fixed-width body with no padding, which
	// leaves text against the edge once the editor is narrower than that.
	function padEditor() {
		var editor = window.tinymce && window.tinymce.get( 'content' );
		if ( editor && editor.getBody() ) {
			editor.dom.toggleClass( editor.getBody(), 'sidedraft-open', $split.hasClass( 'is-open' ) );
		}
	}

	// Line the pane up with the editor: its title row with the Add Media row,
	// its bar with the toolbar, and its first line of text with the editor's,
	// in the editor's text size, so the eye can move straight across.
	//
	// Rows are matched by their own heights, not by where they sit on the page,
	// so a layout that is still settling (fonts, styles or the full-height
	// editor arriving late) can't throw them off.
	function align() {
		var $tools = $( '#wp-content-editor-tools' ),
			visual = $( '#wp-content-wrap' ).hasClass( 'tmce-active' ),
			editor = visual && window.tinymce && window.tinymce.get( 'content' ),
			$bar = visual ? $( '#wp-content-wrap .mce-toolbar-grp' ) : $( '#ed_toolbar' ),
			area = document.getElementById( visual ? 'content_ifr' : 'content' ),
			vars = {},
			head, bar, first;

		if ( ! $split.hasClass( 'is-open' ) ) {
			return;
		}

		// Type is copied at any width; rows only line up side by side.
		if ( editor && editor.getBody() ) {
			$split.css( window.sidedraftRender.type( editor.getBody() ) );
		}

		if ( window.innerWidth <= 900 || ! $tools.length || ! $bar.length || ! area || ! area.offsetHeight ) {
			return;
		}

		// The editor box tucks up under the tools row by its negative margin.
		head = $tools.outerHeight( true ) + ( parseFloat( $( '#wp-content-editor-container' ).css( 'margin-top' ) ) || 0 );
		bar = $bar.outerHeight() + ( visual ? $( '#wp-content-wrap .mce-menubar:visible' ).outerHeight() || 0 : 0 );

		// Keep the last good values over anything that can't be a toolbar.
		if ( head < 20 || head > 160 || bar < 20 || bar > 160 ) {
			return;
		}

		vars[ '--sidedraft-head' ] = head + 'px';
		vars[ '--sidedraft-head-pad' ] = $tools.css( 'padding-top' );
		vars[ '--sidedraft-bar' ] = bar + 'px';

		if ( editor && editor.getBody() ) {
			first = editor.getBody().firstElementChild || editor.getBody();
			vars[ '--sidedraft-text-top' ] = ( first.getBoundingClientRect().top + editor.getWin().pageYOffset ) + 'px';
		} else if ( ! visual ) {
			vars[ '--sidedraft-text-top' ] = $( area ).css( 'padding-top' );
		}

		$split.css( vars );
	}

	function alignSoon() {
		window.requestAnimationFrame( align );
	}

	// Re-measure whenever the editor's rows change size, and once web fonts
	// have loaded, since both can happen after everything else.
	function watch( element ) {
		if ( element && window.ResizeObserver ) {
			new window.ResizeObserver( alignSoon ).observe( element );
		}
	}

	$( window ).on( 'resize load', alignSoon );
	watch( document.getElementById( 'wp-content-editor-tools' ) );

	if ( document.fonts && document.fonts.ready ) {
		document.fonts.ready.then( alignSoon );
	}

	// Visual and Text tabs have different toolbars.
	$( '#wp-content-wrap' ).on( 'click', '.wp-switch-editor', function() {
		setTimeout( align, 100 );
	} );

	function setOpen( open ) {
		$split.toggleClass( 'is-open', open );
		padEditor();
		$toggle.attr( 'aria-pressed', open ? 'true' : 'false' );
		store( 'open', open ? '1' : '0' );
		relayout();
	}

	function setFocus( on ) {
		$body.toggleClass( 'sidedraft-focus-on', on );
		$focus.attr( 'aria-pressed', on ? 'true' : 'false' );
		$split.find( '.sidedraft-focus-mini .dashicons' ).toggleClass( 'dashicons-editor-expand', ! on ).toggleClass( 'dashicons-editor-contract', on );
		store( 'focus', on ? '1' : '0' );
		if ( on && ! $split.hasClass( 'is-open' ) ) {
			setOpen( true );
		} else {
			relayout();
		}
	}

	function render() {
		$formatted.empty().append( window.sidedraftRender.fragment( $text.val() ) );
	}

	function setView( view ) {
		$split.attr( 'data-view', view );
		$views.each( function() {
			$( this ).attr( 'aria-pressed', $( this ).data( 'view' ) === view ? 'true' : 'false' );
		} );
		if ( 'formatted' === view ) {
			render();
		}
	}

	function count() {
		var words = window.sidedraftRender.words( $text.val() );
		$split.find( '.sidedraft-clear' ).prop( 'disabled', '' === $text.val().trim() );
		$split.find( '.sidedraft-count' ).text( words ? sidedraft[ 1 === words ? 'word' : 'words' ].replace( '%s', words.toLocaleString() ) : '' );
	}

	// Open when this post has a draft, otherwise remember the last choice.
	setOpen( $split.hasClass( 'has-draft' ) || '1' === stored( 'open' ) );

	if ( stored( 'width' ) ) {
		$split.css( '--sidedraft-width', stored( 'width' ) );
	}

	// Stay in focus mode across saves, which reload the page.
	if ( '1' === stored( 'focus' ) ) {
		setFocus( true );
	}

	// Show the draft formatted when there is one, otherwise ready for a paste.
	setView( '' === $text.val().trim() ? 'source' : 'formatted' );

	count();
	$text.on( 'input', count );

	// Pasting into an empty box switches straight to the formatted view.
	$text.on( 'paste', function( e ) {
		var empty = '' === $text.val().trim(),
			formatted = window.sidedraftRender.paste( e.originalEvent.clipboardData );

		if ( null !== formatted ) {
			e.preventDefault();
			window.sidedraftRender.insert( this, formatted );
		}

		if ( empty ) {
			setTimeout( function() {
				if ( '' !== $text.val().trim() ) {
					setView( 'formatted' );
				}
			} );
		}
	} );

	$views.on( 'click', function() {
		setView( $( this ).data( 'view' ) );
		if ( 'source' === $( this ).data( 'view' ) ) {
			$text.trigger( 'focus' );
		}
	} );

	$toggle.on( 'click', function() {
		setOpen( ! $split.hasClass( 'is-open' ) );
		if ( $split.hasClass( 'is-open' ) && 'source' === $split.attr( 'data-view' ) ) {
			$text.trigger( 'focus' );
		}
	} );

	// Empties the box, ready for the next paste; saving the post makes it stick.
	$split.find( '.sidedraft-clear' ).on( 'click', function() {
		if ( window.confirm( sidedraft.clear ) ) {
			$text.val( '' );
			count();
			setView( 'source' );
			$text.trigger( 'focus' );
		}
	} );

	$split.find( '.sidedraft-close' ).on( 'click', function() {
		setOpen( false );
	} );

	$focus.on( 'click', function() {
		setFocus( ! $body.hasClass( 'sidedraft-focus-on' ) );
	} );

	function leaveFocus( e ) {
		if ( 'Escape' === e.key && $body.hasClass( 'sidedraft-focus-on' ) && ! $( '.media-modal:visible' ).length ) {
			setFocus( false );
		}
	}

	$( document ).on( 'keydown', leaveFocus );

	$( document ).on( 'tinymce-editor-init', function( e, editor ) {
		if ( 'content' !== editor.id ) {
			return;
		}
		editor.dom.addStyle( 'html body.sidedraft-open { padding-left: 20px !important; padding-right: 20px !important; }' );
		padEditor();
		watch( $( '#wp-content-wrap .mce-toolbar-grp' )[0] );
		// Keys typed in the visual editor stay inside its iframe.
		editor.on( 'keydown', leaveFocus );
		setTimeout( align, 100 );
	} );

	$split.find( '.sidedraft-resize' ).on( 'mousedown', function( e ) {
		var left = $split.offset().left,
			full = $split.width();

		e.preventDefault();
		$split.addClass( 'is-resizing' );

		$( document ).on( 'mousemove.sidedraft', function( e ) {
			var percent = Math.min( 70, Math.max( 20, ( e.pageX - left ) / full * 100 ) );
			$split.css( '--sidedraft-width', percent.toFixed( 1 ) + '%' );
		} ).on( 'mouseup.sidedraft', function() {
			$( document ).off( '.sidedraft' );
			$split.removeClass( 'is-resizing' );
			store( 'width', $split.css( '--sidedraft-width' ).trim() );
			relayout();
		} );
	} );

	// The draft only saves with the post, so warn before leaving with changes.
	$( '#post' ).on( 'submit', function() {
		submitting = true;
	} );

	$( window ).on( 'beforeunload', function() {
		if ( ! submitting && $text.val() !== initial ) {
			return true;
		}
	} );
}( jQuery ) );
