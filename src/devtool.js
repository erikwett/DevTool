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
								$('.devtool-properties').modal({
									clickClose: false,
									showClose: false,
									blockerClass: "devtool-modal-blocker"
								});								
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

function showMsg(msg) {
	$(".devtool-context-msg-content").html(msg);
	$('.devtool-context-msg').modal({
	 	showClose: false
	});
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
		showMsg("Script exported to " + filename);
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
				 showMsg("Script replaced from " + file.name);
				} else {
					showMsg("Script replace cancelled");
				}
			};
			reader.readAsText(file);	// Read the file contents, onload() will fire when done	
		 } else {
			showMsg("No file selected");
		 }
		 $("#devtool-input-file").remove();
	});
	showMsg("No file selected");
	$("#devtool-input-file").click();
	
}

//==== Variables Export function ====
function exportVariables(qlik, download, filetype) {
	if(filetype == "script") {
		var str="";
		var lastSort="";
		getVariables(engineApp).then(function(vars){
			vars.map(function(v){
				v.devtoolSortGroup = (v.qIsReserved ? '11' : v.qIsScriptCreated ? '21' : '22');
				return v;
			}).sort(function(a,b){
				var av = a.devtoolSortGroup + a.qName;
				var bv = b.devtoolSortGroup + b.qName;
				return av == bv ? 0 : av  < bv ? -1 : 1;
			}).forEach(function(v) {
				if(v.devtoolSortGroup != lastSort) {
					switch (v.devtoolSortGroup) {
						case "11":
							str += "// ***** Reserved Variables *****\r\n";
							break;
						case "21":
							str += "// *****  Script Defined Variables ***** \r\n";
							break;
						case "22":
							str += "// *****  Non-script Defined Variables ***** \r\n";
							break;
						default:
							break;
					}
				}
				lastSort = v.devtoolSortGroup;
				var comment = v.qComment != undefined ? "// " + v.qComment : "";
				str += "SET " + v.qName + "='"  + v.qDefinition + "';"  + comment + "\r\n";
			});
			
			var filename = qlik.currApp(this).model.layout.qTitle + "-variables.txt";
			var data = 'data:text/plain;charset=utf-8,' + encodeURIComponent(str);
			download(data, filename, "text/plain");	// Download in the browser
			showMsg("Variables exported to " + filename);
		});
	}
	else {
		var str="";
		getVariables(engineApp).then(function(vars){
			var filename = qlik.currApp(this).model.layout.qTitle + "-variables.json";
			var data = 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(vars, null, 2));
			download(data, filename, "application/json");	// Download in the browser
			showMsg("Variables exported to " + filename);
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