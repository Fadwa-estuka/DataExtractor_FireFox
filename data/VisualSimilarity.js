/**
 * Useful CSS properties ONLY for visual similarity
 */
var cssVS = [
  // Background
  'background-color',           'background-image',
  // Border
  'border-bottom-color',        'border-bottom-style',         'border-bottom-width',
  'border-left-color',          'border-left-style',           'border-left-width',
  'border-right-color',         'border-right-style',          'border-right-width',
  'border-top-color',           'border-top-style',            'border-top-width',
  'outline-color',              'outline-style',               'outline-width',
  'border-bottom-left-radius',  'border-bottom-right-radius',
  'border-top-left-radius',     'border-top-right-radius',     'box-shadow',
  // Text - paragraph
  'direction',                  'letter-spacing',              'line-height',
  'text-align',                 'text-decoration',             'text-indent',
  'text-transform',             'vertical-align',              'white-space',
  'word-spacing',               'text-overflow',               'text-shadow',
  'word-break',                 'word-wrap',
  // Text - column
  /*'column-count',             '-webkit-column-count',*/      '-moz-column-count',
  /*'column-gap',               '-webkit-column-gap',*/        '-moz-column-gap',
  /*'column-rule-color',        '-webkit-column-rule-color',*/ '-moz-column-rule-color',
  /*'column-rule-style',        '-webkit-column-rule-style',*/ '-moz-column-rule-style',
  /*'column-rule-width',        '-webkit-column-rule-width',*/ '-moz-column-rule-width',
  /*'column-width',             '-webkit-column-width',*/      '-moz-column-width',
  // Text - list
  'list-style-image',           'list-style-position',         'list-style-type',
  // Text - font
  'font-family',                'font-size',                   'font-weight',
  'font-size-adjust',// Only Firefox supports this property
  'font-style',                 'font-variant',                'color'
]; // var cssVS = [ ... ];

/**
 * Find out if a DOM element is visible or not
 * @param domElement            The DOM element to be checked
 * @returns {@code Boolean}     {@code true} for visible while {@code false} for invisible
 */
function isElementVisible(domElement) {
  // undefined element is invisible
  if (!domElement)
    return false;

  /*
  // If any child is visible, then visible
  var child = domElement.firstElementChild;
  while (child) {
    if (isElementVisible(child))
      return true;
    child = child.nextElementSibling;
  } // while (child)
  */

  // size of 0 is invisible. Invisible tags included; CSS "display" of "none" included
  if (domElement.offsetWidth <= 0 || domElement.offsetHeight <= 0)
    return false;

  // CSS "visibility" of "hidden" is invisible. In this condition, size is not 0
  if (getComputedStyle(domElement).getPropertyValue('visibility') == 'hidden')
    return false;

  // Multi-media is visible
  var multiMedia = ['IMG', 'VIDEO', 'AUDIO', 'EMBED'];
  for (i in multiMedia) 
    if (domElement.tagName == multiMedia[i])
      return true;

  // Element with background is visible
  var style = getComputedStyle(domElement);
  var bgColor = style.getPropertyValue('background-color').toLowerCase().trim();
  if (bgColor && bgColor != '' && bgColor != 'transparent' && chroma(bgColor).alpha() > 0.0)
    return true;
  var bgImage = style.getPropertyValue('background-image').toLowerCase().trim();
  if (bgImage && bgImage != '' && bgImage != 'none')
    return true;

  // Element with text is visible
  var child = domElement.firstChild;
  while (child) {
    if (child.nodeType == 3 && child.nodeValue.trim() != null)
      return true;
    child = child.nextSibling;
  } // while (child)

  return false;
} // function isElementVisible(domElement)

/**
 * Get the BASE64 data of an image from the URL
 * @param url                   {@code String} URL of the image
 * @param callback              {@code function} Call back function that handle the BASE64 data
 */
function getBase64FromImageUrl(url, callback) {
  var img = new Image();
  img.crossOrigin = 'Anonymous';
  img.src = url;
  img.onload = function () {
    var canvas = document.createElement('canvas');
    // Deal with the size as follows
    canvas.width = this.width;
    canvas.height = this.height;
    var ctx = canvas.getContext('2d');
    // Deal with the position as follows
    ctx.drawImage(this, 0, 0);
    var dataURL = canvas.toDataURL();
    callback(dataURL.replace(/^data:image\/(png|jpg);base64,/, ''));
  }; // img.onload = function () {...};
} // function getBase64FromImageUrl(url, callback)

/**
 * Get the image object from the URL
 * @param url                   {@code String} URL of the image
 * @param callback              {@code function} Call back function that handle the image data
 */
function getImageFromUrl(url, callback) {
  var img = new Image();
  img.crossOrigin = 'Anonymous';
  img.src = url;
  img.onload = function () {
    var canvas = document.createElement('canvas');
    // Deal with the size as follows
    canvas.width = this.width;
    canvas.height = this.height;
    var ctx = canvas.getContext('2d');
    // Deal with the position as follows
    ctx.drawImage(this, 0, 0);
    var dataURL = canvas.toDataURL();
    callback(this);
  }; // img.onload = function () {...};
} // function getImageFromUrl(url, callback)

/**
 * Merge the two nodes into the merging result list
 * @param mergingResults        {@code Array} the result array
 * @param node1                 the first node to be merged
 * @param node2                 the second node to be merged
 */
function mergeResults(mergingResults, node1, node2) {
  if (!node2) {
    mergingResults.push([node1]);
    return ;
  } // if (!node2)

  for (i in mergingResults) {
    var list = mergingResults[i];
    if (node1 == list[list.length - 1]) {
      list.push(node2);
      return ;
    } // for - if
  } // for (i in mergingResults)
  mergingResults.push([node1, node2]);
} // function mergeResults(mergingResults, node1, node2)

/**
 * Display the merging result using CSS: {@code background-color} and {@code box-shadow}
 * @param mergingResults        {@code Array} the merging result array
 */
function updatePage(mergingResults) {
  for (index in mergingResults) {
    var color = chroma.random().name();
    for (mr in mergingResults[index]) {
      var domElement = mergingResults[index][mr].domElement;
      domElement.style.boxShadow = '0px 0px 3px 5px #666';
      domElement.style.backgroundColor = color;
    } // for (mr in mergingResults[index])
  } // for (index in mergingResults)
} // function updatePage(mergingResults)

/**
 * Get the XPath of a node
 * @param node                  The node to be checked
 * @returns {@code String}      The XPath string of the node
 */
function getXPath(node) {
  if (!node.parentElement)
    return '/' + node.tagName;
  var index = 0;
  var child = node.parentElement.firstElementChild;
  while (child !== node) {
    child = child.nextElementSibling;
    index ++;
  } // while (child !== node)
  return getXPath(node.parentElement) + '/' + node.tagName + '[' + index + ']';
} // function getXPath(node)

/**
 * Create a tree
 * @param originRoot            the origin tree's root
 * @param treeType              {@code String} the tree type string
 * @returns                     root node of the new tree
 */
function createTree(originRoot, treeType) {
  var root =  (treeType == 'DT' || treeType == 'VT') ? createSubtreeFromDOM(originRoot, null, treeType) :
                                                       createSubBlockTree([originRoot], null)[0];
  if(root){											
	root.setAttribute('tree_name', document.URL);
	root.setAttribute('tree_type', treeType);
  }
  return root;
} // function createTree(originRoot, treeType)

/**
 * Create a sub tree from DOM
 * @param domElement            the DOM element
 * @param parentNode            the parent node of the new node
 * @param treeType              {@code String} the tree type string
 * @returns                     the root of the sub tree
 */
function createSubtreeFromDOM(domElement, parentNode, treeType) {
  if (treeType != 'VT' || isElementVisible(domElement)) {
    // Create a new node
    var node = document.createElement('div');
    node.setAttribute('node_name', domElement.tagName.toLowerCase());
    node.domElement = domElement;
    if (parentNode)
      parentNode.appendChild(node);

    // Set the attributes
    var nodeParent = domElement.offsetParent, nodeLeft = domElement.offsetLeft, nodeTop = domElement.offsetTop;
    while (nodeParent) {
      nodeTop += nodeParent.offsetTop;
      nodeLeft += nodeParent.offsetLeft;
      nodeParent = nodeParent.offsetParent;
    } // while (nodeParent)
    node.setAttribute('left', nodeLeft + '');
    node.setAttribute('top', nodeTop + '');
    node.setAttribute('right', (nodeLeft + domElement.offsetWidth) + '');
    node.setAttribute('bottom', (nodeTop + domElement.offsetHeight) + '');
    node.setAttribute('xpath', getXPath(domElement));
    for (var i = 0; i < cssVS.length; i++)
      node.setAttribute('css_' + cssVS[i], getComputedStyle(domElement).getPropertyValue(cssVS[i]));
    node.setAttribute('css_position', getComputedStyle(domElement).getPropertyValue('position'));

    // Update the parentNode
    parentNode = node;
  } // if (treeType != 'VT' || isElementVisible(domElement))

  // Create sub tree
  for (var i = 0; i < domElement.childElementCount; i++)
    createSubtreeFromDOM(domElement.children[i], parentNode, treeType);
  /*for (var i = 0; i < domElement.childNodes.length; i++)
    createSubtreeFromDOM(domElement.childNodes[i], parentNode, treeType);*/

  return node;
} // function createSubtreeFromDOM(domElement, parentNode, treeType)

/**
 * Create a sub block tree from a visual tree node list
 * @param originNodes           {@code Array} the visual node array
 * @param parentNode            parent node to be set
 * @returns                     root node of the sub block tree
 */
function createSubBlockTree(originNodes, parentNode) {
  //var nodeGroups = splitByAllLaws(originNodes);
  var nodeGroups = [];
  for(var i=0; i<originNodes.length; i++)
	  nodeGroups.push([originNodes[i]]);

  var nodes = [];
  for (var i = 0; i < nodeGroups.length; i++) {
    var nodeGroup = nodeGroups[i];

    // Create the node
    var node = document.createElement('div');
    nodes.push(node);
    var names = [], lefts = [], tops = [], rights = [], bottoms = [];
    for (var j = 0; j < nodeGroup.length; j++) {
       var originNode = nodeGroup[j];
       names.push(originNode.getAttribute('node_name').toLowerCase());
	   if(!isNaN(parseFloat(originNode.getAttribute('left'))))
          lefts.push(Math.round(parseFloat(originNode.getAttribute('left'))));
	   if(!isNaN(parseFloat(originNode.getAttribute('top'))))
          tops.push(Math.round(parseFloat(originNode.getAttribute('top'))));
	   if(!isNaN(parseFloat(originNode.getAttribute('right'))))
          rights.push(Math.round(parseFloat(originNode.getAttribute('right'))));
       if(!isNaN(parseFloat(originNode.getAttribute('bottom'))))
          bottoms.push(Math.round(parseFloat(originNode.getAttribute('bottom'))));

    } // for (var j = 0; j < nodeGroup.length; j++)
    node.setAttribute('node_name', '[' + names.join(',') + ']');
    node.vtNodes = nodeGroup;
    if (parentNode)
       parentNode.appendChild(node);

    // Set the attributes
    node.setAttribute('left', Math.min.apply(null, lefts) + '');
    node.setAttribute('top', Math.min.apply(null, tops) + '');
    node.setAttribute('right', Math.max.apply(null, rights) + '');
    node.setAttribute('bottom', Math.max.apply(null, bottoms) + '');
    node.setAttribute('xpath', getXPath(nodeGroup[0]));
    for (var j = 0; j < cssVS.length; j++)
        node.setAttribute('css_' + cssVS[j], nodeGroup[0].getAttribute('css_' + cssVS[j]));
    node.setAttribute('css_position', getComputedStyle(nodeGroup[0]).getPropertyValue('position'));

    // Create sub tree
    for (var j = 0; j < nodeGroup.length; j++) {
      if (nodeGroup[j].childElementCount > 0)
        createSubBlockTree(nodeGroup[j].children, node);
    } // for (var j = 0; j < nodeGroup.length; j++)
  } // for (var i = 0; i < nodeGroups.length; i++)
  return nodes;
} // function createSubBlockTree(originNodes, parentNode)

/**
 * Get the merging results from the block tree
 * @param btRoot                root of the block tree
 * @returns {@code Array}       the merging result array
 */
function getMergingResults(btRoot) {
  var mr = [], vtParent = btRoot.vtNodes[0].parentElement;
  mr.push(vtParent && vtParent.childElementCount == btRoot.vtNodes.length ? [vtParent] : btRoot.vtNodes);
  mr.push(btRoot.vtNodes);
  for (var i = 0; i < btRoot.childElementCount; i++) {
    mr = mr.concat(getMergingResults(btRoot.children[i]));
  } // for (var i = 0; i < btRoot.domElements.length; i++)
  return mr;
} // function getMergingResults(btRoot)

/**
 * Update the web page by the merging results
 * @param mergingResults        {@code Array} the merging result array
 */
function updateWebPage(mergingResults) {
  for (var i = 0; i < mergingResults.length; i++) {
    var mr = mergingResults[i], color = chroma.random().css();
    for (var j = 0; j < mr.length; j++) {
      var domElement = mr[j].domElement;
      domElement.style.boxShadow = '0px 0px 3px 5px #666';
      domElement.style.backgroundColor = color;
	  domElement.setAttribute("left", domElement.offsetLeft);
    } // for (var j = 0; j < mr.length; j++)
  } // for (var i = 0; i < mergingResults.length; i++)
} // function updateWebPage(mergingResults)

/**
 * Print the tree into a string
 * @param root                  root of the tree
 * @param treeType              {@code String} the tree type string
 * @param debug                 {@code Boolean} print to console if {@code true}; or not if {@code false}
 * @returns {@code String}      the string
 */
function printTree(root, treeType, debug) {
  var str = '';
  if (!root.parentElement) {
    var line = '==== ' + root.getAttribute('tree_type') + ': "' + root.getAttribute('tree_name') + '" ====';
    if (debug)
      console.log(line);
    str += line + '\n';
  } // if (!root.parentElement)

  // Print root
  str += printTreeNode(root, treeType, debug) + '\n';

  // Print sub tree
  for (var i = 0; i < root.childElementCount; i++) {
    str += printTree(root.children[i], treeType, debug);
  } // for (var i = 0; i < root.childElementCount; i++)

  if (!root.parentElement) {
    var line = '==== ' + root.getAttribute('tree_type') + ': "' + root.getAttribute('tree_name') + '" ====';
    if (debug)
      console.log(line);
    str += line + '\n';
  } // if (!root.parentElement)
  return str;
} // function printTree(root, treeType, debug)

/**
 * Print the tree node into an in-line string
 * @param node                  the node to be printed
 * @param treeType              {@code String} the tree type string
 * @param debug                 {@code Boolean} print to console if {@code true}; or not if {@code false}
 * @returns {@code String}      the string
 */
function printTreeNode(node, treeType, debug) {
  var line = '  ', parent = node.parentElement;
  while (parent) {
    line += '| ';
    parent = parent.parentElement;
  } // while (parent)
  if (node.parentElement)
    line = line.substr(0, line.length - 1) + '- ';
  line += node.getAttribute('node_name').toUpperCase() +
          ': left=' + node.getAttribute('left') + ',top=' + node.getAttribute('top') + 
          ',right=' + node.getAttribute('right') + ',bottom=' + node.getAttribute('bottom');
  if (treeType == 'BT') {
    var tags = [];
    for (var i = 0; i < node.vtNodes.length; i++)
      tags.push(node.vtNodes[i].domElement.tagName);
    line += '; DOMs="[' + tags.join(',') + ']"';
  } else
    line += '; DOM="' + node.domElement + '"';

  if (debug)
    console.log(line);

  return line;
} // function printTreeNode(node, treeType, debug)
