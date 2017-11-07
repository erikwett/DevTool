define(["./lib/jquery.modal.min", "css!./devtool.css", "css!./lib/jquery.modal.min.css"],

	/**
	 * @owner Erik Wetterberg (ewg)
	 */
	function (modal) {
		$('<link href="https://fonts.googleapis.com/icon?family=Material+Icons"rel="stylesheet">').appendTo("head");
		function toggleId() {
			var cnt = $(".devtool-tooltip").remove();
			if (cnt.length === 0) {
				$('.qv-object, .qv-panel-sheet').each(function (i, el) {
					var s = angular.element(el).scope();
					if (s.layout || (s.$$childHead && s.$$childHead.layout)) {
						var layout = s.layout || s.$$childHead.layout, model = s.model || s.$$childHead.model,
							timing = { max: 0, latest: 0, start: 0, cnt: 0, tot: 0 };
						$(el).append('<div class="devtool-tooltip">' +
							'<a class="devtool-btn" title="properties"><i class="small material-icons">view_list</i></a>' +
							//'<a class="devtool-btn" title="timing"><i class="small material-icons">timer</i></a>' +
							'<div>' + layout.qInfo.qId + ' (' + model.handle + ')</div>' +
							'<div>' + layout.visualization + '</div>' +
							'<div class="devtool-timing"></div>' +
							"</div>");
						model.Validated.bind(function () {
							if (timing.start > 0) {
								timing.latest = Date.now() - timing.start;
								timing.start = 0;
								timing.cnt++;
								timing.tot += timing.latest;
								timing.max = Math.max(timing.max, timing.latest);
								$(el).find('.devtool-timing').html('calc:' + timing.cnt + ' last ms:' + timing.latest + ' max:' + timing.max);
							}
						});
						model.Invalidated.bind(function () {
							timing.start = Date.now();
						});
						$(el).find('.devtool-btn').on('click', function () {
							model.getProperties().then(function (reply) {
								$('body').append(
									'<div class="devtool-properties modal">' +
									'<pre><div class="devtool-properties-content"></div></pre></div>'
								).on($.modal.CLOSE, function(event, modal) {
									$('.devtool-properties').remove();
								});
								$(".devtool-properties-content").html(JSON.stringify(reply, null, 2));
																
								// I'm using a button for copy-to-clipboard, otherwise marked text loses focus if another element type is used.
								$('<button title = "copy to clipboard" class="devtool-btn devtool-properties-copybtn small material-icons">content_copy</button>')
								.click( function(event) {
									if (! window.getSelection().toString()) {	// If no user selection, then select everything
										selectElemText($('.devtool-properties-content')[0]);
									}
									document.execCommand("Copy");
									window.getSelection().removeAllRanges();
								})
								.prependTo(".devtool-properties");
								
								$('.devtool-properties').modal();								
							});
						});
					} else {
						console.log("No ID found");
					}
				});
			}
		}

		// Function to select all text in an element
		function selectElemText(elem) {
			var range = document.createRange();
			range.selectNodeContents(elem);
			console.log(range.toString());
			window.getSelection().removeAllRanges();
			window.getSelection().addRange(range);			
		};

		return {
			initialProperties: {
				version: 2.0,
				showTitles: false
			}, paint: function ($element) {
				$(".devtool-btn").remove();
				$(document.body).append("<button class='devtool-btn fab'><i class='material-icons'>settings</i></button>");
				$(".devtool-btn").on("click", toggleId);
			}
		};

	});
