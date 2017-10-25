define(["css!./devtool.css"],

	/**
	 * @owner Erik Wetterberg (ewg)
	 */
	function () {
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
								$(el).find('.devtool-timing').html('calc:' + timing.cnt + ' ms:' + timing.tot + ' max:' + timing.max);
							}
						});
						model.Invalidated.bind(function () {
							timing.start = Date.now();
						});
						$(el).find('.devtool-btn').on('click', function () {
							model.getProperties().then(function (reply) {
								alert(JSON.stringify(reply, null, 2));
							});
						});
					} else {
						console.log("No ID found");
					}
				});
			}
		}

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
