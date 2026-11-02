/**
 * The draft as a block editor sidebar. It sits with Post and Block settings
 * and saves with the post, so nothing about the editor itself changes.
 */
( function( wp, render ) {
	var el = wp.element.createElement,
		useState = wp.element.useState,
		useEffect = wp.element.useEffect,
		useRef = wp.element.useRef,
		Fragment = wp.element.Fragment,
		Button = wp.components.Button,
		ConfirmDialog = wp.components.__experimentalConfirmDialog,
		useSelect = wp.data.useSelect,
		useEntityProp = wp.coreData.useEntityProp,
		__ = wp.i18n.__,
		_n = wp.i18n._n,
		sprintf = wp.i18n.sprintf,
		slots = wp.editor && wp.editor.PluginSidebar ? wp.editor : wp.editPost,
		NAME = 'sidedraft';

	function stored( key ) {
		try {
			return window.localStorage.getItem( 'sidedraft.' + key );
		} catch ( e ) {
			return null;
		}
	}

	function store( key, value ) {
		try {
			window.localStorage.setItem( 'sidedraft.' + key, value );
		} catch ( e ) {}
	}

	// The writing canvas: an iframe in most editors, a plain div in older ones.
	function canvas() {
		var frame = document.querySelector( 'iframe[name="editor-canvas"]' ),
			doc = frame && frame.contentDocument;
		if ( doc && doc.body && doc.body.classList.contains( 'editor-styles-wrapper' ) ) {
			return doc.body;
		}
		return document.querySelector( '.editor-styles-wrapper' );
	}

	// Read type once the canvas has its styles, retrying while it loads, and
	// again when its width changes, since fluid type scales with the canvas.
	function useEditorType() {
		var state = useState( {} ),
			vars = state[0],
			setVars = state[1];

		useEffect( function() {
			var tries = 0,
				width = 0,
				timer, observer;

			function read( container ) {
				if ( container.clientWidth !== width ) {
					width = container.clientWidth;
					setVars( render.type( container ) );
				}
			}

			function find() {
				var container = canvas(),
					win = container && container.ownerDocument.defaultView;

				if ( ! container || 'complete' !== container.ownerDocument.readyState ) {
					if ( tries++ < 40 ) {
						timer = setTimeout( find, 250 );
					}
					return;
				}

				read( container );
				if ( win.ResizeObserver ) {
					observer = new win.ResizeObserver( function() {
						read( container );
					} );
					observer.observe( container );
				}
			}

			find();
			return function() {
				clearTimeout( timer );
				if ( observer ) {
					observer.disconnect();
				}
			};
		}, [] );

		return vars;
	}

	function Formatted( props ) {
		var ref = useRef();

		useEffect( function() {
			var node = ref.current;
			while ( node.firstChild ) {
				node.removeChild( node.firstChild );
			}
			node.appendChild( render.fragment( props.source ) );
		}, [ props.source ] );

		return el( 'div', {
			ref: ref,
			className: 'sidedraft-formatted',
			tabIndex: 0
		} );
	}

	function Tab( props ) {
		return el( 'button', {
			type: 'button',
			className: 'sidedraft-tab',
			'aria-pressed': props.active,
			onClick: props.onClick
		}, props.label );
	}

	function DraftSidebar() {
		var postType = useSelect( function( select ) {
				return select( 'core/editor' ).getCurrentPostType();
			}, [] ),
			entity = useEntityProp( 'postType', postType, 'sidedraft' ),
			draft = entity[0] || '',
			setDraft = entity[1],
			viewState = useState( draft.trim() ? 'formatted' : 'source' ),
			view = draft.trim() ? viewState[0] : 'source',
			setView = viewState[1],
			wideState = useState( '0' !== stored( 'wide' ) ),
			wide = wideState[0],
			setWide = wideState[1],
			confirmState = useState( false ),
			confirming = confirmState[0],
			setConfirming = confirmState[1],
			type = useEditorType(),
			sourceRef = useRef(),
			words = render.words( draft );

		// Wide by default for reading, only while this sidebar is open.
		useEffect( function() {
			document.body.classList.toggle( 'sidedraft-wide', wide );
			store( 'wide', wide ? '1' : '0' );
			return function() {
				document.body.classList.remove( 'sidedraft-wide' );
			};
		}, [ wide ] );

		function edit() {
			setView( 'source' );
			setTimeout( function() {
				if ( sourceRef.current ) {
					sourceRef.current.focus();
				}
			} );
		}

		function clear() {
			setDraft( '' );
			setConfirming( false );
			edit();
		}

		return el( 'div', { className: 'sidedraft-panel', style: type },
			el( 'div', { className: 'sidedraft-toolbar' },
				el( 'div', { className: 'sidedraft-tabs', role: 'group', 'aria-label': __( 'Draft view', 'sidedraft' ) },
					el( Tab, { label: __( 'Formatted', 'sidedraft' ), active: 'formatted' === view, onClick: function() {
						if ( draft.trim() ) {
							setView( 'formatted' );
						}
					} } ),
					el( Tab, { label: __( 'Source', 'sidedraft' ), active: 'source' === view, onClick: edit } )
				),
				el( Button, {
					icon: wide ? 'editor-contract' : 'editor-expand',
					label: wide ? __( 'Narrow sidebar', 'sidedraft' ) : __( 'Widen sidebar', 'sidedraft' ),
					size: 'compact',
					className: 'sidedraft-widen',
					onClick: function() {
						setWide( ! wide );
					}
				} ),
				el( Button, {
					icon: el( 'svg', { viewBox: '0 0 20 20', width: 18, height: 18, fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true, focusable: false },
						el( 'path', { d: 'M3.5 5.5h13M8 5.5v-2h4v2M5.5 5.5l.8 11h7.4l.8-11M8.5 8.5v5M11.5 8.5v5' } )
					),
					label: __( 'Clear draft', 'sidedraft' ),
					size: 'compact',
					className: 'sidedraft-clear',
					disabled: ! draft.trim(),
					onClick: function() {
						setConfirming( true );
					}
				} )
			),
			el( 'div', { className: 'sidedraft-count' },
				words ? sprintf( _n( '%s word', '%s words', words, 'sidedraft' ), words.toLocaleString() ) : ' '
			),
			'formatted' === view ?
				el( Formatted, { source: draft } ) :
				el( 'textarea', {
					ref: sourceRef,
					className: 'sidedraft-source',
					value: draft,
					'aria-label': __( 'Draft source', 'sidedraft' ),
					placeholder: __( 'Paste a draft in Markdown or HTML. It saves with the post and is never shown on your site.', 'sidedraft' ),
					onChange: function( e ) {
						setDraft( e.target.value );
					},
					// Pasting into an empty box switches straight to the formatted view.
					onPaste: function( e ) {
						var empty = ! e.target.value.trim(),
							formatted = render.paste( e.clipboardData );

						if ( null !== formatted ) {
							e.preventDefault();
							render.insert( e.target, formatted );
						}

						if ( empty ) {
							setTimeout( function() {
								setView( 'formatted' );
							} );
						}
					}
				} ),
			el( ConfirmDialog, {
				isOpen: confirming,
				confirmButtonText: __( 'Clear draft', 'sidedraft' ),
				onConfirm: clear,
				onCancel: function() {
					setConfirming( false );
				}
			}, __( 'Clear this draft? It’s removed for good when you save the post.', 'sidedraft' ) )
		);
	}

	wp.plugins.registerPlugin( NAME, {
		icon: 'text-page',
		render: function() {
			return el( Fragment, null,
				el( slots.PluginSidebarMoreMenuItem, { target: NAME }, __( 'Draft', 'sidedraft' ) ),
				el( slots.PluginSidebar, { name: NAME, title: __( 'Draft', 'sidedraft' ), className: 'sidedraft-sidebar' },
					el( DraftSidebar )
				)
			);
		}
	} );
}( window.wp, window.sidedraftRender ) );
