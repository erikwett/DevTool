define( ["css!./devtool.css"],

	/**
	 * @owner Erik Wetterberg (ewg)
	 */
	function () {
		$( '<link href="https://fonts.googleapis.com/icon?family=Material+Icons"rel="stylesheet">' ).appendTo( "head" );
		function toggleId () {
			var cnt = $( ".devtool-tooltip" ).remove();
			if ( cnt.length === 0 ) {
				$( '.qv-object' ).each( function ( i, el ) {
					var s = angular.element( el ).scope();
					if ( s.$$childHead && s.$$childHead.layout ) {
						var layout = s.$$childHead.layout, model = s.$$childHead.model;
						$( el ).append( '<div class="devtool-tooltip">' +
						'<a class="devtool-btn" title="properties"><i class="small material-icons">view_list</i></a>' +
						'<div>' + layout.qInfo.qId + ' ('+model.handle+')</div>' +
						'<div>' + layout.visualization + '</div>' +
						"</div>" );
						$(el ).find('.devtool-btn' ).on('click',function(){
							model.getProperties().then(function(reply){
								alert(JSON.stringify(reply,null,2));
							});
						});
					} else {
						console.log( "No ID found" );
					}
				} );
			}
		}

		return {
			initialProperties: {
				version: 2.0,
				showTitles: false
			}, paint: function ( $element ) {
				$( ".devtool-btn" ).remove();
				$( document.body ).append( "<button class='devtool-btn fab'><i class='material-icons'>settings</i></button>" );
				$( ".devtool-btn" ).on( "click", toggleId );
			}
		};

	} );
