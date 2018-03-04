// jpm run -b /usr/bin/firefox --binary-args http://resizemybrowser.com/
// Import useful built-in libraries
const {Cc, Ci, Cu} = require('chrome');
const l10nString = require('sdk/l10n').get;
const data = require('sdk/self').data;
const {ToggleButton} = require('sdk/ui/button/toggle');
const panels = require('sdk/panel');
const tabs = require('sdk/tabs');
const {Hotkey} = require('sdk/hotkeys');
const {open} = require('sdk/window/utils');

// Import static configurations
const Functions = [
  {id:'MainContentExtractionBT',       key:'control-alt-m',   keyText:'Ctrl + Alt + M',   separator:false}, 
  {id:'WholePageExtractionBT',       key:'control-alt-w',   keyText:'Ctrl + Alt + W',   separator:false}, 
  {id:'MainContentExtractionVT',       key:'control-alt-c',   keyText:'Ctrl + Alt + C',   separator:false}, 
  {id:'WholePageExtractionVT',       key:'control-alt-p',   keyText:'Ctrl + Alt + P',   separator:false},
  {id:'BatchCrawling',    key:'control-alt-r',   keyText:'Ctrl + Alt + R',   separator:false}
]; // const Functions = [ ... ];
const contentScripts = [
  data.url('libs/chroma.min.js'),
  data.url('libs/deltae.global.min.js'),
  data.url('GestaltLaws.js'),
  data.url('VisualSimilarity.js'),
  data.url('ExtendedSubtree.js'),
  data.url('TreeTraversal.js'),
  data.url('NodeCompare.js'),
  data.url('DataRecordsExtraction.js'),
  data.url('DataItemsAlignment.js'),
  data.url('main-panel.js')
]; // const contentScripts = [ ... ];

// Global variables
const {URLS, GROUP_SIZE} = require('./urls.js');
var current, finished;

// Extension function unit 1: tool-bar button
const button = ToggleButton({
  id: 'Btn-DataExtraction',
  label: l10nString('addon_label'),
  icon: { '16': l10nString('icon_16'), '32': l10nString('icon_32'), '64': l10nString('icon_64') },
  onChange: function(state) { if (state.checked)  panel.show({position: button}); }
}); // const button = ToggleButton({ ... });

// Extension function unit 2: menu panel
const panel = require('sdk/panel').Panel({
  contentURL: data.url('main-panel.html'),
  contentScriptFile: data.url('main-panel.js'),
  onHide: function() { button.state('window', {checked: false}); },
  onShow: function() {
    var menuItems = [];
    for (i in Functions) {
      Functions[i].text = l10nString(Functions[i].id + '_mi');
      Functions[i].img = l10nString(Functions[i].id + '_img');
      menuItems.push(Functions[i]);
    } // for (i in Functions)
    panel.port.emit('load', menuItems);
  } // onShow: function() { ... }
}); // const panel = require('sdk/panel').Panel({ ... });

/**
 * Event Handler Registration
 */
(function register() {
  Functions.map(function(mi) {
    var handler = function() {
      panel.hide();
	  if (mi.id == 'BatchCrawling')
        BatchCrawl();
	  else
        EventHandler(mi.id, tabs.activeTab);
    }; // var handler = function() { ... };
    panel.port.on(mi.id, handler);
    Hotkey({combo:mi.key, onPress:handler});
  }); // Functions.map(function(mi) {});
})();

/**
 * Event handler of each menu item clicking
 * @param event     {@code string} The event of the caller (menu item id)
 */
const EventHandler = (event, tab) => {
  const worker = tab.attach({ contentScriptFile:contentScripts });
  //var filename = tab.url.replace(/\\/g, '%5C').replace(/\//g, '%2F').replace(/\:/g, '%3A')
                        //.replace(/\*/g, '%2A').replace(/\?/g, '%3F').replace(/\"/g, '%22')
                        //.replace(/\</g, '%3C').replace(/\>/g, '%3E').replace(/\|/g, '%7C');
  //var filename = "data records-MainContentMatching";
  var filename = "data records-WholePageMatching";
  Cu.import('resource://gre/modules/Services.jsm');
  var fileNoExt = Services.dirsvc.get('DfltDwnld', Ci.nsIFile);
  fileNoExt.append(filename);

  // Send the corresponding event to the active tab
  worker.port.emit('request-' + event, new Date().getTime());

  // Receive the response
  worker.port.on('response-' + event,  function(time, msg){
	var dataTable=[], dataTableStr="", dataTableCSV=[], htmlTable='<table style="width:100%;">', fileExt=""; 
	if(msg[1].length>0){
		dataTable=msg[1][0]; 
		dataTableStr=msg[1][1];
		dataTableCSV=msg[1][2];
	}
	console.log(event + ' - ' + time + ' ms;   '+time/1000+' s     ');
	for(var i=0; i<dataTable.length; i++){
		htmlTable+='<tr>';
		for(var j=0; j<dataTable[i].length; j++)
			htmlTable+='<td>'+dataTable[i][j]+'</td>';
		htmlTable+='</tr>';
	}
	/*open('data:text/html, <html><head><title>' + msg[0] + '</title><style>table,td{border:1px solid black;border-collapse:collapse;font-size:13px;}</style></head>'+
		'<body>'+ htmlTable+'</table></body></html>',
		{ features: {width: 1000, height: 650, centerscreen: true, resizable: 1} }
	);*/
	open('data:text/html, <html><head><title>' + msg[0] + '</title><style>table,td{border:1px solid black;border-collapse:collapse;font-size:13px;}</style></head>'+
		'<body>'+ time+' ms'+'</body></html>',
		{ features: {width: 100, height: 100, centerscreen: true, resizable: 1} }
	);
	
	const {TextDecoder, TextEncoder, OS} = Cu.import('resource://gre/modules/osfile.jsm', {});
	// txt file
	/*fileExt = '.txt';
	var array = new TextEncoder().encode(dataTableStr);
	var promise = OS.File.writeAtomic(fileNoExt.path + fileExt, array, 
                    {tmpPath:fileNoExt.path + fileExt +  '.tmp'},{ encoding: "utf-8"});*/
	
	// csv file		
	var csv="";
	dataTableCSV.forEach(function(row){
        csv += row.join(',');
        csv += "\n";
	});
	fileExt = '.csv';
	var array = new TextEncoder().encode(csv);
	var promise = OS.File.writeAtomic(fileNoExt.path + fileExt, array, 
                    {tmpPath:fileNoExt.path + fileExt +  '.tmp'},{ encoding: "utf-8"});
   });
}; 

/**
 * Event handler of each menu item clicking: BatchCrawling
 */
const BatchCrawl = () => {
  var thisWindow = require('sdk/window/utils').getMostRecentBrowserWindow();
  var idx = 0, finished = 0;
  for (; idx < GROUP_SIZE && idx < URLS.length; idx++) {
    tabs.open({ url: URLS[idx], inBackground: true, onLoad: function(tab) {
      thisWindow.setTimeout(function(){
        AnalyzePage(tab, function(time) {
          console.log((++finished) + '/' + URLS.length + ' - ' + (time < 0? tab.url : time + 'ms'));
          tab.close();
        }); // AnalyzePage( ... );
      }, 2000); // thisWindow.setTimeout(function(){...}, 2000);
    }}); // tabs.open({ ... });
  } // for (; idx < GROUP_SIZE && idx < URLS.length; idx++)
  tabs.on('close', function() {
    if (idx >= URLS.length)
      return ;
    tabs.open({ url: URLS[idx], inBackground: true, onLoad: function(tab) {
      thisWindow.setTimeout(function(){
        AnalyzePage(tab, function(time) {
          console.log((++finished) + '/' + URLS.length + ' - ' + (time < 0 ? tab.url : time + 'ms'));
          tab.close();
        }); // AnalyzePage( ... );
      }, 2000); // thisWindow.setTimeout(function(){...}, 2000);
    }}); // tabs.open({ ... });
    idx++;
  }); // tabs.on('close', function() { ... });
}; // function BatchCrawl()

/**
 * Analyze the web page: extract data records, and save the results
 * @param tab       {@code Tab} The tab to be analyzed
 * @param callback  {@code function} The callback function
 */
const AnalyzePage = (tab, callback) => {
   EventHandler('MainContentExtractionBT', tab);
   // invoke the call back function, if any
   //if (callback)
     callback(time);
}; // function AnalyzePage(tab, callback)
