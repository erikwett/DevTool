var engineApp;
var modalsInitialized = false;

define(["qlik",
	"./lib/download",				// download.js module
	"text!./devtool-context-menu.html",
	"./lib/jquery.modal.min",
	"css!./lib/jquery.modal.min.css",
	"./lib/contextMenu.min",
	"css!./lib/contextMenu.css",
	"css!./devtool.css"
	],

	/**
	 * @owner Erik Wetterberg (ewg)
	 */
	function (qlik, download, devtoolContextMenu) {
		$('<link href="https://fonts.googleapis.com/icon?family=Material+Icons"rel="stylesheet">').appendTo("head");
		$.modal.defaults = {
			clickClose: false,
			showClose: false,
			blockerClass: "devtool-modal-blocker"
		};
		engineApp = qlik.currApp(this).model.engineApp;	

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
								$(".devtool-properties-content").html(JSON.stringify(reply, null, 2));
								$('.devtool-properties').modal();								
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
				$(".devtool-btn.fab").remove();
				$(document.body).append("<button class='devtool-btn fab'><i class='material-icons'>settings</i></button>");
				$(".devtool-btn.fab").on("click", toggleId);
//				$(".devtool-btn").on("contextmenu", showContextMenu);
				if (!modalsInitialized) {
					initModals(qlik, download, devtoolContextMenu)
				}
				$(".devtool-btn.fab").contextMenu('menu', $('#devtool-context-menu'), {
					'triggerOn' : "contextmenu",
					'displayAround' : 'trigger'
				});
			}
		};
});

//===== Show Context Menu =====
function showContextMenu() {
	//===== Show the context menu ====
	if ($.modal.isActive()) {	// Guard against multiple opens
		$.modal.close();
	}
	$(".devtool-context-msg").html("");	// Clear existing message
	$('.devtool-context-menu').modal();	
}

// Initialize the modal windows
function initModals(qlik, download, devtoolContextMenu) {
	// Remove existing elements
	$(".devtool-context-menu").remove();
	$(".devtool-properties").remove();
	// Add modals to the DOM
	$('body').append(devtoolContextMenu);
	
	// Command router
	$("[data-devtool-command]").click(function(event) {
		var command = $(event.currentTarget).data("devtool-command");
		switch (command) {
			case "Copy":
				copyToClipboard($('.devtool-properties-content')[0]);
				break;
			case "ExportScript":
				exportScript(qlik, download);
				break;	
			case "ImportScript":
				importScript(qlik);
				break;	
			case "ExportVariables":	
				exportVariables(qlik, download, $(event.target).data("devtool-filetype"));
				break;	
			default:
			console.log("unknown option " + command );
		}
	});	
	modalsInitialized = true;
}

//==== Copy-to-Clipboard function ====	
function copyToClipboard(elem) {
	if (! window.getSelection().toString()) {	// If no user selection, then select everything
		var range = document.createRange();
		range.selectNodeContents(elem);
		window.getSelection().removeAllRanges();
		window.getSelection().addRange(range);	
	}
	document.execCommand("Copy");
	window.getSelection().removeAllRanges();
}

//==== Script Export function ====			
function exportScript(qlik, download) {
	var filename = qlik.currApp(this).model.layout.qTitle + "-script.txt";
	engineApp.getScript().then(function (reply) {
		var data = 'data:text/plain;charset=utf-8,' + encodeURIComponent(reply.qScript);
		download(data, filename, "text/plain");	// Download in the browser
		$(".devtool-context-msg").html("Script exported to " + filename);
	});
}	

//==== Script Import function ====	
function importScript(qlik) {
	$("#devtool-input-file").remove();
	$('body').append('<input type="file" id="devtool-input-file" style="display:none;">');
	$("#devtool-input-file").change(function(){
		var input = $("#devtool-input-file")[0];
		if (input.files.length > 0) {
			var file = input.files[0];
			var reader = new FileReader();
			reader.onload = function(){	// Callback for read complete
			// Ask user to confirm script replace
				var r = confirm("Confirm replace of application script with " + file.name + "? The *entire* script will be replaced.");
				if (r == true) {
				 engineApp.setScript(reader.result);	// Replace the script in the app
				 $(".devtool-context-msg").html("Script replaced from " + file.name);
				} else {
				 $(".devtool-context-msg").html("Script replace cancelled");
				}
			};
			reader.readAsText(file);	// Read the file contents, onload() will fire when done	
		 } else {
			 $(".devtool-context-msg").html("No file selected");
		 }
		 $("#devtool-input-file").remove();
	});
	$(".devtool-context-msg").html("No file selected");
	$("#devtool-input-file").click();
	
}

//==== Variables Export function ====
function exportVariables(qlik, download, filetype) {
	if(filetype == "script") {
		var str="";
		getVariables(engineApp).then(function(vars){
			for (var index = 0; index < vars.length; index++) {
				var v = vars[index];
				str += "SET " + v.qName + " = "  + v.qDefinition + ";\r\n";
			}
			var filename = qlik.currApp(this).model.layout.qTitle + "-variables.txt";
			var data = 'data:text/plain;charset=utf-8,' + encodeURIComponent(str);
			download(data, filename, "text/plain");	// Download in the browser
			$(".devtool-context-msg").html("Variables exported to " + filename);
		});
	}
	else {
		var str="";
		getVariables(engineApp).then(function(vars){
			var filename = qlik.currApp(this).model.layout.qTitle + "-variables.json";
			var data = 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(vars, null, 2));
			download(data, filename, "application/json");	// Download in the browser
			$(".devtool-context-msg").html("Variables exported to " + filename);
		});
	}
}

//===== Get all variables in app ====
function getVariables(app) {	
	return app.createSessionObject({
		qVariableListDef: {
			qType: 'variable',
			qShowReserved: true,
			qShowConfig: true,
			qData: {
				info: '/qDimInfos'
			},
			qMeta: {}
		},
		qInfo: { qId: "VariableList", qType: "VariableList" }
	}).then(function (list) {
		return list.getLayout().then(function (layout) {
			return Promise.all(layout.qVariableList.qItems.map(function (d) {
				return app.getVariableById(d.qInfo.qId).then(function (variable) {
					return variable.getProperties().then(function(properties) {
						if (d.qIsScriptCreated) properties.qIsScriptCreated = d.qIsScriptCreated;
						if (d.qIsReserved) properties.qIsReserved = d.qIsReserved;
						if (d.qIsConfig) properties.qIsConfig = d.qIsConfig;
						return properties; 
					});
				});
			}));
		});
	});
}