define( ["css!./devtool.css"],
	/**
	 * @owner Erik Wetterberg (ewg)
	 */
	function () {

		function toggleId () {
			var cnt = $(".devtool-tooltip").remove();
			if(cnt.length ===0) {
				$( '.qv-object' ).each( function ( i, el ) {
					var s = angular.element( el ).scope();
					if ( s.$$childHead && s.$$childHead.layout ) {
						var layout = s.$$childHead.layout;
						$( el ).append( "<div class='devtool-tooltip'><div>" + layout.qInfo.qId + "</div><div>" +
						layout.visualization + "</div></div>" );
					} else {
						console.log( "No ID found" );
					}
				} );
			}
		}

		return {
			initialProperties: {
				version: 1.0,
				showTitles: false
			},paint: function ( $element ) {
				$element.html( "<button class='devtool-btn'>Toggle Id</button>" );
				$element.find( "button" ).on( "click", toggleId);
			}
		};

	} );
