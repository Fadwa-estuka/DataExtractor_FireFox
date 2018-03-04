/**
 * Calculate the Hausdorff distance of 2 layer tree nodes
 * @param node1                 The first layer tree node
 * @param node2                 The second layer tree node
 * @returns {@code number}      Distance from node 1 to node 2, or {@code null} if any node is {@code null}
 */
function normalizedHausdorffDistance(node1, node2) {
  if (!node1 || !node2)
    return null;
  var hd1 = normailizedDistance_AtoB(node1, node2);
  var hd2 = normailizedDistance_AtoB(node2, node1);
  if (hd1===null || hd2===null)
    return null;
  return (hd1 > hd2) ? hd1 : hd2;
} // function normalizedHausdorffDistance(node1, node2)

/**
 * Calculate the Hausdorff distance from node A to node B
 * @param nodeA                 The first layer tree node
 * @param nodeB                 The second layer tree node
 * @returns {@code number}      Distance from node 1 to node 2, or {@code null} if any node is {@code null}
 */
function normailizedDistance_AtoB(nodeA, nodeB) {
  var leftA = parseInt(nodeA.getAttribute('left')), leftB = parseInt(nodeB.getAttribute('left'));
  var topA = parseInt(nodeA.getAttribute('top')), topB = parseInt(nodeB.getAttribute('top'));
  var rightA = parseInt(nodeA.getAttribute('right')), rightB = parseInt(nodeB.getAttribute('right'));
  var bottomA = parseInt(nodeA.getAttribute('bottom')), bottomB = parseInt(nodeB.getAttribute('bottom'));
  if (!leftA || !leftB)
    return null;

  var widthA = Math.abs(rightA - leftA), widthB = Math.abs(rightB - leftB);
  var heightA = Math.abs(bottomA - topA), heightB = Math.abs(bottomB - topB);
  var centerXA = leftA + widthA / 2, centerYA = topA + heightA / 2;
  var centerXB = leftB + widthB / 2, centerYB = topB + heightB / 2;

  if (leftA >= leftB && rightA <= rightB && topA >= topB && bottomA <= bottomB)
    return 0.0;                                                    // A is inside of B

  if (leftA >= leftB && rightA <= rightB)
    if (centerYA  < centerYB)
      return Math.abs(topB - topA) / heightA;
    else
      return Math.abs(bottomA - bottomB) / heightA;
  if (topA >= topB && bottomA <= bottomB)
    if (centerXA < centerXB)
      return Math.abs(leftB - leftA) / widthA;
    else
      return Math.abs(rightA - rightB) / widthA;

  var deltaX, deltaY;
  if (centerXA < centerXB)                                        // B is to the east of A
    deltaX = leftB - leftA;
  else                                                            // B is to the west of A
    deltaX = rightA - rightB;
  if (centerYA < centerYB)                                        // B is to the south of A
    deltaY = topB - topA;
  else                                                            // B is to the north of A
    deltaY = bottomA - bottomB;
  return Math.sqrt(deltaX * deltaX + deltaY * deltaY) / Math.sqrt(widthA * widthA + heightA * heightA);
} // function normailizedDistance_AtoB(nodeA, nodeB)

/**
 * Check if two images are the same
 * @param imgURL1               {@code String} The first image's URL
 * @param imgURL2               {@code String} The second image's URL
 * @param callback              {@code function} Call back function that handle the BASE64 data
 * @returns {@code Boolean}     {@code true} for same image while {@code false} for different
 */
function sameImage(imgURL1, imgURL2, callback) {
  if (imgURL1 == imgURL2) {
    if (callback)
      callback(true);
    return true;
  } // if (imgURL1 == imgURL2)

  getImageFromUrl(imgURL1, function(img) {
    var img1 = img;
    getImageFromUrl(imgURL2, function(img) {
      var img2 = img;
    }); // getImageFromUrl(imgURL2, function(img) {...};
  }); // getImageFromUrl(imgURL1, function(img) {...};
  return false;
} // function sameImage(imgURL1, imgURL2, callback)

/**
 * Compare two colors to see if they are the same
 * @param color1                {@code String} the string representation of the first color
 * @param color2                {@code String} the string representation of the second color
 * @returns {@code Boolean}     {@code true} for same color while {@code false} for different
 */
function sameColor(color1, color2) {
  if (color1 == color2)
    return true;
  if (color1 == 'transparent' || color2 == 'transparent')
    return false;
  var lab1 = chroma(color1).lab(), lab2 = chroma(color2).lab();
  return DeltaE.getDeltaE00({L: lab1[0], A: lab1[1], B: lab1[2]}, {L: lab2[0], A: lab2[1], B: lab2[2]}) < 5.0;
} // function sameColor(color1, color2, scheme)

/**
 * Apply All Gestalt laws to split a list of nodes
 * @param nodes                 the node list (visual tree node)
 * @returns                     {@code Array} 2D array, each element being a list of nodes belonging to the same group
 */
function splitByAllLaws(nodes) {
  var nhds = [], sames = [];
  for (var i = 0; i < nodes.length - 1; i++) {
    var node1 = nodes[i], node2 = nodes[i + 1];
	var same = false;
    same = (node1.getAttribute('css_position') == node2.getAttribute('css_position'));      // Common Fate
    if (!same)
      same = (node1.getAttribute('left') == node2.getAttribute('left') ||                       // Continuity
              node1.getAttribute('top') == node2.getAttribute('top') ||
              node1.getAttribute('right') == node2.getAttribute('right') ||
              node1.getAttribute('bottom') == node2.getAttribute('bottom'));
    if (!same) {
      var index = 0;                                                                            // Similarity
      for (; index < cssVS.length; index++) {
        var css1 = node1.getAttribute('css_' + cssVS[index]), css2 = node2.getAttribute('css_' + cssVS[index]);
        if (cssVS[index].includes('color') && !sameColor(css1, css2))
          break ;
        else if (cssVS[index].includes('image') && !((css1 == 'none' && css2 == 'none') || (css1 == '' && css2 == '') || sameImage(css1, css2)))
          break ;
        else if (css1 != css2)
          break ;
      } // for (; index < cssVS.length; index++)
      same = (index >= cssVS.length);
    } // if (!same)
    sames.push(same);
    nhds.push(normalizedHausdorffDistance(node1, node2));                                       // Proximity
  } // for (var i = 0; i < nodes.length - 1; i++)

  // Check all laws
  if(nhds.length != nodes.length - 1 || sames.length != nodes.length - 1)
    console.log('ERR: NHDs and SAMES size!!!', nodes[0].getAttribute('xpath'));
  var avg = 1.0 * nhds.reduce(function(x, y){return x + y;}, 0) / nhds.length;
  var nodeGroups = [], group = [nodes[0]];
  for (var i = 0; i < nodes.length - 1; i++) {
    if (sames[i] || avg - nhds[i] > -1e-4) {
      group.push(nodes[i + 1]);
    } else {
      nodeGroups.push(group);
      group = [nodes[i + 1]];
    } // else - if (sames[i] || avg - nhds[i] > -1e-4)
  } // for (var i = 0; i < nodes.length - 1; i++)
  if (group.length > 0)
    nodeGroups.push(group);

  return nodeGroups;
} // function splitByAllLaws(nodes)

/**
 * Apply Gestalt Law of Proximity and save result
 * @param node                  the current node
 * @param mergingResults        {@code Array} the result array
 */
function getProximity(node, mergingResults) {
  if (node.childElementCount == 0)
    return ;

  var nhds = [], avg = 0.0;
  for (var i = 0; i < node.childElementCount; i++) {
    getProximity(node.children[i], mergingResults);
    if (i == node.childElementCount - 1)
      continue ;
    var nhd = normalizedHausdorffDistance(node.children[i], node.children[i+1]);
    avg += nhd;
    nhds.push(nhd);
  } // for (var i = 0; i < node.childElementCount; i++)
  if (nhds.length > 0) {
    avg /= nhds.length;
    for (var i = 0; i < nhds.length; i++)
      if (nhds[i] <= avg)
        mergeResults(node.children[i], node.children[i+1], mergingResults);
  } // if (nhds.length > 0)
} // function getProximity(node, mergingResults)

/**
 * Apply Gestalt Law of Similarity and save result
 * @param node                  the current node
 * @param mergingResults        {@code Array} the result array
 */
function getSimilarity(node, mergingResults) {
  if (node.childElementCount == 0)
    return ;

  for (var i = 0; i < node.childElementCount; i++) {
    getSimilarity(node.children[i], mergingResults);
    if (i == node.childElementCount - 1)
      continue ;
    var child1 = node.children[i], child2 = node.children[i + 1];
    var index = 0;                                                                            // Similarity
    for (; index < cssVS.length; index++) {
      var css1 = child1.getAttribute('css_' + cssVS[index]), css2 = child2.getAttribute('css_' + cssVS[index]);
      if (cssVS[index].includes('color') && !sameColor(css1, css2))
        break ;
      else if (cssVS[index].includes('image') &&
               !((css1 == 'none' && css2 == 'none') || (css1 == '' && css2 == '') || sameImage(css1, css2)))
        break ;
      else if (css1 != css2)
        break ;
    } // for (; index < cssVS.length; index++)
    if (index >= cssVS.length)
      mergeResults(child1, child2, mergingResults);
  } // for (var i = 0; i < node.childElementCount; i++)
} // function getSimilarity(node, mergingResults)

/**
 * Apply Gestalt Law of Common Fate and save result
 * @param node                  the current node
 * @param mergingResults        {@code Array} the result array
 */
function getCommonFate(node, mergingResults) {
  if (node.childElementCount == 0)
    return ;

  for (var i = 0; i < node.childElementCount; i++) {
    getCommonFate(node.children[i], mergingResults);
    if (i == node.childElementCount - 1)
      continue ;
    var child1 = node.children[i], child2 = node.children[i + 1];
    if (child1.getAttribute('css_position') == child2.getAttribute('css_position'))
      mergeResults(child1, child2, mergingResults);
  } // for (var i = 0; i < node.childElementCount; i++)
} // function getCommonFate(node, mergingResults)

/**
 * Apply Gestalt Law of Continuity and save result
 * @param node                  the current node
 * @param mergingResults        {@code Array} the result array
 */
function getContinuity(node, mergingResults) {
  if (node.childElementCount == 0)
    return ;

  for (var i = 0; i < node.childElementCount; i++) {
    getContinuity(node.children[i], mergingResults);
    if (i == node.childElementCount - 1)
      continue ;
    var child1 = node.children[i], child2 = node.children[i + 1];
    if (child1.getAttribute('left') == child2.getAttribute('left') ||
        child1.getAttribute('top') == child2.getAttribute('top') ||
        child1.getAttribute('right') == child2.getAttribute('right') ||
        child1.getAttribute('bottom') == child2.getAttribute('bottom'))
      mergeResults(child1, child2, mergingResults);
  } // for (var i = 0; i < node.childElementCount; i++)
} // function getContinuity(node, mergingResults)
