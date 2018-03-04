/**
 * Register event handlers to the menu items
 */
self.port.on('load', function(menuItems) {
  // Setup menu items
  while (document.body.firstElementChild)
    document.body.removeChild(document.body.firstElementChild);
  menuItems.map(function(mi) {
    var li = document.createElement('li');
    li.id = 'li-' + mi.id.toLowerCase();
    document.body.appendChild(li);

    // Menu item interface
    var img = document.createElement('img');
    img.id = 'img-' + mi.id.toLowerCase();
    img.src = mi.img;
    li.appendChild(img);
    var span = document.createElement('span');
    span.id = 'span-' + mi.id.toLowerCase();
    span.innerHTML = mi.text;
    li.appendChild(span);
    var code = document.createElement('code');
    code.innerHTML = mi.keyText;
    li.appendChild(code);
    var hr = document.createElement('hr');
    hr.className = mi.separator ? 'mi-sept' : ''
    document.body.appendChild(hr);

    // Menu item event handler
    li.onclick = function() {
      self.port.emit(mi.id);
    }; // li.onclick = function() { ... };
  }); // menuItems.map(function(mi) {});
}); // self.port.on('load', function(menuItems) {});

var debug = false;

/**
 * Register event handlers of the menu item - "MainContentExtractionBT"
 */
self.port.on('request-MainContentExtractionBT', function(startTime) {
  var visualTree = createTree(document.body, 'VT'), blockTree=null, extractionResults=[];
  if(visualTree){
	blockTree = createTree(visualTree, 'BT');
	extractionResults = extractFromMainRegion(blockTree, 'BT');
  }else{
	  console.log("Visual Tree is undefined ..");
	  console.log("Unable to find any data record");
  }
  self.port.emit('response-MainContentExtractionBT', new Date().getTime() - startTime,
                 ['Data Items', extractionResults]);
});

/**
 * Register event handlers of the menu item - "WholePageExtractionBT"
 */
self.port.on('request-WholePageExtractionBT', function(startTime) {
  var visualTree = createTree(document.body, 'VT'), blockTree=null, extractionResults=[];
  if(visualTree){
	blockTree = createTree(visualTree, 'BT');
	extractionResults = extractFromWholePage(blockTree, 'BT');
  }else{
	  console.log("Visual Tree is undefined ..");
	  console.log("Unable to find any data record");
  }
  self.port.emit('response-WholePageExtractionBT', new Date().getTime() - startTime,
                 ['Data Items', extractionResults]);
}); 

/**
 * Register event handlers of the menu item - "MainContentExtractionVT"
 */
self.port.on('request-MainContentExtractionVT', function(startTime) {
  var visualTree = createTree(document.body, 'VT'), extractionResults=[];
  if(visualTree)
	extractionResults = extractFromMainRegion(visualTree, 'VT');
  else{
	  console.log("Visual Tree is undefined ..");
	  console.log("Unable to find any data record");
  }
  self.port.emit('response-MainContentExtractionVT', new Date().getTime() - startTime,
                 ['Data Items', extractionResults]);
});

/**
 * Register event handlers of the menu item - "WholePageExtractionVT"
 */
self.port.on('request-WholePageExtractionVT', function(startTime) {
  var visualTree = createTree(document.body, 'VT'), extractionResults=[];
  if(visualTree)
	extractionResults = extractFromWholePage(visualTree, 'VT');
  else{
	  console.log("Visual Tree is undefined ..");
	  console.log("Unable to find any data record");
  }
  self.port.emit('response-WholePageExtractionVT', new Date().getTime() - startTime,
                 ['Data Items', extractionResults]);
}); 
 
