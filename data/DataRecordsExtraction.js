/**
 * Extract data records and their data items from the main data region of a webpage
 * @param treeRoot              root node of the tree
 * @param treeType              {@code String} the tree type string: 'BT' or 'VT'
 * @returns 				    {@code Array} array of size 3 contains: data table, data table as string for the txt file, and data table for the csv file
 */
function extractFromMainRegion(treeRoot, treeType){
	var mainRegionCandidates=[], candidatesCenterXdiff=[];
	
	// Traverse the tree and collect its nodes
	var traverse = new Traversal(treeRoot);
	traverse.preorder(treeRoot);
    var nodeList = traverse.nodeQueue;
	
	// Calculate the document's size and document's centerX
	var body = document.body, 
	    html = document.documentElement,
        docHeight = Math.max( body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight ),
	    docWidth = Math.max( body.scrollWidth, body.offsetWidth, html.clientWidth, html.scrollWidth, html.offsetWidth ),
	    docArea=docWidth*docHeight, 
		docCenterX = docWidth / 2;
	
	// Get the candidates of the webpage main region
	for(var i=0; i<nodeList.length; i++){
		var node=nodeList[i], 
		    nodeLeft=parseInt(node.getAttribute('left')), nodeRight=parseInt(node.getAttribute('right')),
		    nodeTop=parseInt(node.getAttribute('top')), nodeBottom=parseInt(node.getAttribute('bottom')),
		    nodeWidth = Math.abs(nodeRight-nodeLeft), nodeHeight = Math.abs(nodeBottom - nodeTop),
		    nodeArea=nodeWidth*nodeHeight, nodeCenterX = nodeLeft + nodeWidth / 2;

		if(nodeArea<docArea && nodeBottom<docHeight && nodeTop>0 && nodeArea>=docArea*(20/100)){
			mainRegionCandidates.push(node);
			candidatesCenterXdiff.push(Math.abs(docCenterX-nodeCenterX));
		}
	}

	var extractionResults=[];
	if(mainRegionCandidates.length>0){
		// Select closest region to the centerX of the page as the main data region
		var minCenterXdiff=Math.min.apply(null,candidatesCenterXdiff), mainDataRegion=mainRegionCandidates[candidatesCenterXdiff.indexOf(minCenterXdiff)];
		// Get the data records from the main data region
	    var dataRecords=extractRecords(mainDataRegion, treeType, 'dataRegion');
		// Get the aligned data items of the extracted data records
		if(dataRecords)
			extractionResults=alignDataItems(dataRecords, treeType);
	}else{
		console.log("No main data region found!");
		//return extractFromWholePage(treeRoot, treeType);
	}
	return extractionResults;
}

/**
 * Extract data records and their data items from an entire webpage
 * @param treeRoot              root node of the tree
 * @param treeType              {@code String} the tree type string: 'BT' or 'VT'
 * @returns 				    {@code Array} array of size 2 contains: aligned data table, and aligned data string
 */
function extractFromWholePage(treeRoot, treeType){
	// Get the data records from the entire webpage
    var dataRecords=extractRecords(treeRoot, treeType, 'wholePage'), extractionResults=[];
	// Get the aligned data items of the extracted data records
	if(dataRecords)
		extractionResults=alignDataItems(dataRecords, treeType);
	return extractionResults;
}

/**
 * Extract data records from a specific data region or from an entire webpage
 * @param regionRoot            root node of the webpage tree or the data region subtree
 * @param treeType              {@code String} the tree type string: 'BT' or 'VT'
 * @param regionType            {@code String} the region type string: 'dataRegion' or 'wholePage'
 * @returns                     {@code Array} the data records array
 */
function extractRecords(regionRoot, treeType, regionType){
	
	var similarNodesList=[];
	
	// Traverse the target tree and collect its nodes
	var traverse = new Traversal(regionRoot);
	traverse.preorder(regionRoot);
    var nodeList = traverse.nodeQueue;
	
	// Find the horizontal (regionCenterX) and vertical (regionCenterY) centers of the region
	var regionCenterX, regionCenterY;
	if(regionType==='dataRegion'){
		var regionLeft = parseInt(regionRoot.getAttribute('left')), regionTop = parseInt(regionRoot.getAttribute('top')),
			regionRight = parseInt(regionRoot.getAttribute('right')), regionBottom = parseInt(regionRoot.getAttribute('bottom')),
			regionWidth = Math.abs(regionRight - regionLeft), regionHeight = Math.abs(regionBottom - regionTop);
		regionCenterX = regionLeft + regionWidth/2;
		regionCenterY = regionTop + regionHeight/2;
	}else{
		var body = document.body, html = document.documentElement,
		    docHeight = Math.max( body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight ),
		    docWidth = Math.max( body.scrollWidth, body.offsetWidth, html.clientWidth, html.scrollWidth, html.offsetWidth );
		regionCenterX = docWidth/2;
		regionCenterY = docHeight/2;
	}
	
	// Sort the node list ascendingly by their top and left attributes
	listSorting(nodeList,'top', 'left', 'Ascending');
	
	// Set the width and height attributes of each node
	for(var i=0; i<nodeList.length ; i++){
		setAttsOfNode(nodeList[i], ['width'], [Math.abs(parseInt(nodeList[i].getAttribute('right')) - parseInt(nodeList[i].getAttribute('left')))]);
		setAttsOfNode(nodeList[i], ['height'], [Math.abs(parseInt(nodeList[i].getAttribute('bottom')) - parseInt(nodeList[i].getAttribute('top')))]);
	}
	
	// Copy the original node list into another temporary check node list
	var checkNodeList=[];
	for(var i=0; i<nodeList.length; i++)
		checkNodeList.push(nodeList[i]);
	
	// Find the vertically aligned similar nodes, store them, and set their attributes
	findVerticalSimilarNodes(checkNodeList, nodeList, similarNodesList);
	//updateNodes(similarNodesList, treeType);
	
	// Find the horizontally aligned similar nodes, store them, and set their attributes
	// horizontalAlignedNodes list contains the horizontally aligned similar nodes that couldn't be matched vertically with any of their siblings
	var horizontalAlignedNodes=[];
	findHorizontalSimilarNodes(checkNodeList, nodeList, similarNodesList, horizontalAlignedNodes);
	
	// Set the parent/child attributes of the stored similar nodes
	setParentChildAttr(similarNodesList);
	
	/*for(var i=0; i<similarNodesList.length; i++)
		updateNode(similarNodesList[i],"BT");*/
	
	// Get the removable nodes from the stored similar nodes
	var removableNodes=getRemovableNodes(similarNodesList);
	//console.log("removableNodes size="+removableNodes.length);
	
	// Remove nodes from the stored similar nodes
    for(var i=0; i<removableNodes.length; i++){
		var removableItem=removableNodes[i], prevSimilarItem=nodeList[parseInt(removableItem.getAttribute('previousSimilar'))];
		//updateNode(removableItem, treeType);
		//alert("removable: "+(i+1));
		// Remove prev/next similarity attributes
		if(prevSimilarItem){
			removeAttsOfNode(prevSimilarItem, ['nextSimilar', 'nextSimilarDirection']);
			removeAttsOfNode(removableItem, ['previousSimilar', 'previousSimilarDirection']);
		}
		var index=similarNodesList.indexOf(removableItem);
		if(index>-1)
			similarNodesList.splice(index,1);
    }
	
	// Sort the stored similar nodes ascendingly by their top and left attributes
	listSorting(similarNodesList,'top', 'left', 'Ascending');
	
	/*for(var i=0; i<similarNodesList.length; i++)
		updateNode(similarNodesList[i],"BT");*/
	
	// Check if the nodes stored in horizontalAlignedNodes list can be matched vertically with any of the stored nodes and link them
	// This is the case when every nodes' horizontal line of the grid is one group with its own parent
	linkGridRows(horizontalAlignedNodes, similarNodesList, nodeList);
	
	// Remove the left previous and the right next similarity attributes of all the stored similar nodes
	for(var i=0; i<similarNodesList.length; i++){
		removeLeftLink(similarNodesList[i], nodeList);
		removeRightLink(similarNodesList[i], nodeList);
	}
	
	// Get the root nodes of each linked list from the similar stored nodes
	var roots=getRoots(similarNodesList);
	
	/*for(var i=0; i<roots.length; i++)
		updateNode(roots[i],"BT");*/
	
	/*// Check if the roots can be matched vertically with any of the stored nodes and link them
	// Add the root to the removable nodes list if it can be linked with another node
	removableNodes=[];
	linkRootsWithOtherNodes(roots, similarNodesList, nodeList, removableNodes);
	removeNodesFromList(removableNodes, roots);*/
	
	// Check if roots can be matched. If so, link them together as one linked list and store them as removable roots
	removableNodes=[];
	linkRoots(roots, nodeList, removableNodes);
	
	// Remove the removable roots from the roots list
	removeNodesFromList(removableNodes, roots);
	
	/*for(var i=0; i<roots.length; i++)
		updateNode(roots[i],"BT");*/
	
	// Store the nodes of each linked list in an array
	var linkedLists=[], distances=[];
	for(var i=0; i<roots.length; i++){
		var linkedList=getNodesOfLinkedList(roots[i], nodeList);
		// Add the linkedList array to the linkedLists array
		linkedLists.push(linkedList);
		// Create a new node from the nodes in the linkedList
		var newNode=groupNodesToOneNewNode(linkedList);
		// Get the attributes of the newNode
		var newNodeCenterX = parseInt(newNode.getAttribute('left')) + parseInt(newNode.getAttribute('width'))/2.0,
		    newNodeCenterY = parseInt(newNode.getAttribute('top')) + parseInt(newNode.getAttribute('height'))/2.0;
		// Calculate the distance between the center of the new node and the center of the region
		distances.push(calculate2PointsDistance(newNodeCenterX,newNodeCenterY,regionCenterX,regionCenterY));
	}
	
	// Check if one of the linked lists represents a filter block
	removableNodes=[];
	for(var i=0; i<linkedLists.length; i++){
		var linkedList=linkedLists[i];
		//updateNodes(linkedList,"BT");
		if(isFilterBlock(linkedList)){
			removableNodes.push(linkedList);
		}
	}
	
	// Remove the detected filter blocks from the linkedLists, and remove its distance from distances array
	for(var i=0; i<removableNodes.length; i++){
		var index=linkedLists.indexOf(removableNodes[i]);
		if(index>-1){
			linkedLists.splice(index,1);
			distances.splice(index,1);
		}
	}
	
	// Get the minimum distance from the stored distances
	var minDistance=Math.min.apply(null, distances), minDistanceIndex=distances.indexOf(minDistance);
	// The data records linked list is the list whose center is the closest to the region's center
	var dataRecords=linkedLists[minDistanceIndex];
	if(dataRecords){
		// Printing how many data records found
		console.log(dataRecords.length+" data records found");
		// Set an id for every data record and update the background color of every record
		for(var i=0; i<dataRecords.length; i++){
			setAttsOfNode(dataRecords[i], ['id'], [i+1]);
			//updateNode(dataRecords[i], treeType);
		}
	}else
		console.log("0 data records found");
	/*if(dataRecords.length>2){
		var nodeA=dataRecords[0], nodeB=dataRecords[dataRecords.length-1], nodeC=dataRecords[1], nodeD=dataRecords[dataRecords.length-2];
		//updateNode(nodeA, treeType); alert("A"); updateNode(nodeB, treeType); alert("B"); updateNode(nodeC, treeType);	alert("C"); updateNode(nodeD, treeType);
		console.log(getSimilarityNormalized(nodeA, nodeB)+" - "+getSimilarityNormalized(nodeA, nodeC)+" - "+getSimilarityNormalized(nodeD, nodeB));
	}*/
	/*for(var i=0; i<linkedLists.length; i++){
		var linkedList=linkedLists[i];
		updateNodes(linkedList, treeType);
	    alert(linkedList.length+"    "+distances[i]);
		console.log(i+1+':  '+linkedList.length);
	}*/
	/*console.log('\nlinkedLists length:');
	for(var i=0; i<linkedLists.length; i++){
		var linkedList=linkedLists[i];
	    console.log(i+1+':  '+linkedList.length);
	}*/
	return dataRecords;
}


/**
 * Find the vertically aligned similar nodes, store them, and set their attributes
 * @param checkNodeList         {@code Array} an array of nodes to be checked
 * @param nodeList              {@code Array} an array of nodes
 * @param similarNodesList      {@code Array} an array to save the detected similar nodes
 */
function findVerticalSimilarNodes(checkNodeList, nodeList, similarNodesList){
	for(var i=0; i<checkNodeList.length-1; i++){
		var nodeA=checkNodeList[i];
		for(var j=i+1; j<checkNodeList.length; j++){
			var nodeB=checkNodeList[j];
			// Check if the two nodes are siblings and are vertically aligned
		    if(nodeA.parentElement===nodeB.parentElement && areVerticallyAligned(nodeA,nodeB) && getSimilarityNormalized(nodeA, nodeB)>=0.4){	
				// Store the similar aligned nodes in the similarNodesList array
				if(similarNodesList.indexOf(nodeA)==-1)
					similarNodesList.push(nodeA);
				if(similarNodesList.indexOf(nodeB)==-1)
					similarNodesList.push(nodeB);
				// Link the similar nodes with each other by setting their 'nextSimilar' and 'previousSimilar' attributes
				setAttsOfNode(nodeA, ['nextSimilar','nextSimilarDirection'],[nodeList.indexOf(nodeB),'down']);
				if(nodeB.getAttribute('previousSimilar')===null)
					setAttsOfNode(nodeB, ['previousSimilar','previousSimilarDirection'],[nodeList.indexOf(nodeA),'up']);
				else{
					// If nodeB is already linked with a previousSimilar node, then link nodeA also with that previousSimilar node
					var previousSimilarItem=nodeList[parseInt(nodeB.getAttribute('previousSimilar'))];
					if(nodeA.getAttribute('previousSimilar')!==null)
						removeAttsOfNode(nodeList[parseInt(nodeA.getAttribute('previousSimilar'))], ['nextSimilar', 'nextSimilarDirection']);
					setAttsOfNode(previousSimilarItem, ['nextSimilar','nextSimilarDirection'],[nodeList.indexOf(nodeA),'down']);
					setAttsOfNode(nodeA, ['previousSimilar','previousSimilarDirection'],[nodeList.indexOf(previousSimilarItem),'up']);
					setAttsOfNode(nodeB, ['previousSimilar','previousSimilarDirection'],[nodeList.indexOf(nodeA),'up']);
				}
				break;
			}	
	    }
	}
	//updateRegions(similarNodesList,'BT'); 
	//alert('similarNodesList size: '+similarNodesList.length);
	// Remove the stored similar nodes from the check node list
	//alert('size before='+checkNodeList.length);
	removeNodesFromList(similarNodesList, checkNodeList);
	//alert('size after='+checkNodeList.length);
}

/**
 * Find the Horizontally aligned similar nodes, store them, and set their attributes
 * @param checkNodeList          {@code Array} an array of nodes to be checked
 * @param nodeList               {@code Array} an array of nodes
 * @param similarNodesList       {@code Array} an array to save the detected similar nodes
 * @param horizontalAlignedNodes {@code Array} an array to save the horizontally aligned nodes
 */
function findHorizontalSimilarNodes(checkNodeList, nodeList, similarNodesList, horizontalAlignedNodes){
	for(var i=0; i<checkNodeList.length-1 ; i++){
		var nodeA=checkNodeList[i];
		for(var j=i+1; j<checkNodeList.length ; j++){
			var nodeB=checkNodeList[j];
			// Check if the two nodes are siblings and are horizontally aligned
			if(nodeA.parentElement===nodeB.parentElement && areHorizontallyAligned(nodeA,nodeB) && getSimilarityNormalized(nodeA, nodeB)>=0.4){
				// Store the similar aligned nodes in the horizontalAlignedNodes array
				if(horizontalAlignedNodes.indexOf(nodeA)==-1)
					horizontalAlignedNodes.push(nodeA);
				if(horizontalAlignedNodes.indexOf(nodeB)==-1)
					horizontalAlignedNodes.push(nodeB);
				// Store the similar aligned nodes in the similarNodesList array
				if(similarNodesList.indexOf(nodeA)==-1)
					similarNodesList.push(nodeA);
				if(similarNodesList.indexOf(nodeB)==-1)
					similarNodesList.push(nodeB);
				// Link the similar nodes with each other by setting their 'nextSimilar' and 'previousSimilar' attributes
				setAttsOfNode(nodeA, ['nextSimilar','nextSimilarDirection'],[nodeList.indexOf(nodeB),'right']);					
				if(nodeB.getAttribute('previousSimilar')===null)
					setAttsOfNode(nodeB, ['previousSimilar','previousSimilarDirection'],[nodeList.indexOf(nodeA),'left']);
				else{
					// If nodeB is already linked with a previousSimilar node, then link nodeA also with that previousSimilar node
					var previousSimilarItem=nodeList[parseInt(nodeB.getAttribute('previousSimilar'))];
					if(nodeA.getAttribute('previousSimilar')!==null)
						removeAttsOfNode(nodeList[parseInt(nodeA.getAttribute('previousSimilar'))], ['nextSimilar', 'nextSimilarDirection']);
					setAttsOfNode(previousSimilarItem, ['nextSimilar','nextSimilarDirection'],[nodeList.indexOf(nodeA),'right']);
					setAttsOfNode(nodeA, ['previousSimilar','previousSimilarDirection'],[nodeList.indexOf(previousSimilarItem),'left']);
					setAttsOfNode(nodeB, ['previousSimilar','previousSimilarDirection'],[nodeList.indexOf(nodeA),'left']);
				}
				break;
			}	
	    }
	}
	// Remove the stored similar nodes from the check node list
	removeNodesFromList(similarNodesList, checkNodeList);
	// Sort the horizontalAlignedNodes list ascendingly by their top and left attributes
	listSorting(horizontalAlignedNodes,'top', 'left', 'Ascending');
	/*for(var i=0; i<horizontalAlignedNodes.length; i++)
		updateNode(horizontalAlignedNodes[i],"BT");*/
}

/**
 * Update the similar nodes list
 * @param nodesList      {@code Array} an array of nodes
 */
function setParentChildAttr(nodesList){
	for(var i=0; i<nodesList.length; i++){
		var nodeA=nodesList[i], ancestorsList=[];
		// Get all the ancestors of nodeA from nodesList 
		for(var j=0; j<nodesList.length ; j++){
			var nodeB=nodesList[j];
			if(i===j) continue;
			// Save nodeB if it is one of the ancestors of nodeA
			if(isOneOfAncestorsOfNodeA(nodeA,nodeB))
				ancestorsList.push(nodeB);
		}
		// Get the first visual parent of nodeA from the stored ancestors list
		if(ancestorsList.length>0){
			// Sort the ancestors list descendingly by their top and left attributes
			listSorting(ancestorsList,'top', 'left', 'Descending');
			// Choose the nearest node as visual parent of nodeA
			var visualParent=ancestorsList[0], childList=[];
			// Set the parent and childList attributes of nodeA and its parent
			setAttsOfNode(nodeA, ['visualParentIndex'], [nodesList.indexOf(visualParent)]);
			if(visualParent.getAttribute('visualChildIndexList')===null){
				childList=[i];
			}else{
				childList = (visualParent.getAttribute('visualChildIndexList')).split(',');
				childList.push(i);
			}
			setAttsOfNode(visualParent, ['visualChildIndexList'], [childList]);
		}
	}
}

/**
 * Get the removable nodes from the stored similar nodes
 * @param nodeList     	    	{@code Array} an array of nodes
 * @returns removableList       {@code Array} an array of nodes to be removed
 */
function getRemovableNodes(nodeList){
	var removableList=[];
	for(var i=0; i<nodeList.length; i++){
		var node=nodeList[i];
		if(node.getAttribute('visualChildIndexList')){
			var childIndexList = (node.getAttribute('visualChildIndexList')).split(',');
			if(childIndexList.length>0){ 
			    // Get the stored children list of the node
				var childList=[];
				for(var j=0; j<childIndexList.length; j++)
					childList.push(nodeList[parseInt(childIndexList[j])]);
				//var newNode=groupNodesToOneNewNode(childList);
				// Create new node from the children nodes list
				// Remove the node if its children are aligned and their areas are consistently distributed
				// Otherwise remove its children
				/*updateNode(node, "BT");
				alert("node");
				for(var j=0; j<childList.length; j++){
					updateNode(childList[j], "BT");
				}
				alert("areNodesAligned: "+areNodesAligned(childList));
				alert("areAreasConsistent: "+areAreasConsistent(node, childList));*/
				if(areNodesAligned(childList) && areAreasConsistent(node, childList) && childList.length>3){
					removableList.push(node);
					//updateNode(node, "BT");
					//alert("dddd");
				}
				else
					for(var j=0; j<childList.length; j++)
                        removableList.push(childList[j]);
			}
		}
	}
	return removableList;
}

/**
 * Create a new node from list of nodes
 * @param nodeList      	    {@code Array} an array of nodes
 * @returns newNode       		the new created node
 */
function groupNodesToOneNewNode(nodeList){
	var newNode = document.createElement('div');
	var lefts = [], tops = [], rights = [], bottoms = [];
	// Get the left, right, top, bottom attributes of all nodes in the list
	for (var j=0; j<nodeList.length; j++) {
		var originNode = nodeList[j];
		if(!isNaN(parseFloat(originNode.getAttribute('left'))))
			lefts.push(Math.round(parseFloat(originNode.getAttribute('left'))));
		if(!isNaN(parseFloat(originNode.getAttribute('top'))))
			tops.push(Math.round(parseFloat(originNode.getAttribute('top'))));
		if(!isNaN(parseFloat(originNode.getAttribute('right'))))
			rights.push(Math.round(parseFloat(originNode.getAttribute('right'))));
		if(!isNaN(parseFloat(originNode.getAttribute('bottom'))))
			bottoms.push(Math.round(parseFloat(originNode.getAttribute('bottom'))));
	}
	// Set the left, right, top, bottom attributes of the new node
	setAttsOfNode(newNode, ['left'], [Math.min.apply(null, lefts) + '']);
	setAttsOfNode(newNode, ['top'], [Math.min.apply(null, tops) + '']);
	setAttsOfNode(newNode, ['right'], [Math.max.apply(null, rights) + '']);
	setAttsOfNode(newNode, ['bottom'], [Math.max.apply(null, bottoms) + '']);
	setAttsOfNode(newNode, ['width'], [Math.abs(parseInt(newNode.getAttribute('right')) - parseInt(newNode.getAttribute('left')))]);
	setAttsOfNode(newNode, ['height'], [Math.abs(parseInt(newNode.getAttribute('bottom')) - parseInt(newNode.getAttribute('top')))]);	
	return newNode;
}

/**
 * Check if the nodes are aligned consistently as list or grid
 * @param nodeList     	        {@code Array} an array of nodes
 * @returns {@code Boolean}     {@code true} for aligned nodes, {@code false} for unaligned nodes
 */
function areNodesAligned(nodeList){
	// Cluster nodes by left attribute
	var groups=clusterNodesByAttr(nodeList, 'left');
	for(var i=0; i<groups.length; i++)
		groups[i].sort(function(a,b){return parseInt(a.getAttribute('top'))-parseInt(b.getAttribute('top'))});
	if(groups.length>0){
		// Check if the nodes from different clusters are top aligned
		var firstGroup=groups[0];
	    for(var i=0; i<firstGroup.length; i++)
			for(var j=1; j<groups.length; j++){
				var nextGroup=groups[j];
				if(nextGroup[i]!=null && parseInt(firstGroup[i].getAttribute('top'))!=parseInt(nextGroup[i].getAttribute('top')))
					return false;
			}
	}
	return true;
}

/**
 * Check if the nodes areas are equally distributed and their total area occupies 60% or more of the parent node area
 * @param parentNode     	    a parent node
 * @param childList     	    {@code Array} an array of nodes
 * @returns {@code Boolean}     {@code true} for consistent nodes, {@code false} for inconsistent nodes
 */
function areAreasConsistent(parentNode, childList){
	var parentNodeSize=parseInt(parentNode.getAttribute('width'))*parseInt(parentNode.getAttribute('height'));
	var dividedParentSize=parentNodeSize/childList.length;
	// Check if each child size is not larger than the equally divided parent size
	for(var i=0; i<childList.length; i++){
		var childNodeSize=parseInt(childList[i].getAttribute('width'))*parseInt(childList[i].getAttribute('height'));
		if(childNodeSize>dividedParentSize)
			return false;
	}
	// Check if the children total area size is less than 60% of the parent size
	// If so, try to fill the gaps in the last line of the grid, else return true
	var totalChildrenAreaSize=getTotalAreaSize(childList);
	if(totalChildrenAreaSize<(60/100)*parentNodeSize){
		// Cluster child nodes by top attribute
		var groups=clusterNodesByAttr(childList, 'top'), firstGroup=groups[0], lastGroup=groups[groups.length-1], sameNoOfNodes=true;
		// If there is one cluster, then it is not a grid, and there are no gaps to be filled
		if(groups.length==1 || firstGroup.length==1 || lastGroup.length==firstGroup.length)
			return false;
		// Check if the clusters, except the last one, have the same number of nodes
		for(var i=1; i<groups.length-1; i++)
			if(groups[i].length!=firstGroup.length)
				sameNoOfNodes=false;
		// Check if there are gaps in the last line of the grid
		if(groups.length>1 && lastGroup.length<firstGroup.length && sameNoOfNodes==true && firstGroup.length>1){
			var lengthDiff=firstGroup.length-lastGroup.length;
			// Fill the gaps of the last line of the grid
			for(var i=1; i<=lengthDiff; i++)
				childList.push(groups[groups.length-1][0]);
			totalChildrenAreaSize=getTotalAreaSize(childList);
			// Check again if the children total area size is less than 60% of the parent size
			if(totalChildrenAreaSize<(60/100)*parentNodeSize)
				return false;
		}
	}
	return true;
}

/**
 * Cluster nodes into groups by specific attribute
 * @param nodeList     	        {@code Array} an array of nodes
 * @returns groups       		{@code Array} an array of arrays of clustered nodes
 */
function clusterNodesByAttr(nodeList, attr){
	var attrValues=[], groups=[];
	// Calculate the attribute values of all the nodes
	for(var i=0; i<nodeList.length ; i++)
		attrValues.push(parseInt(nodeList[i].getAttribute(attr)));
	// Remove the duplicates from the calculated values
	var distinctValues=removeDuplicatesFromArray(attrValues, '1D');
	// Cluster the nodes by the attribute values
	for(var i=0; i<distinctValues.length; i++){
		var group=[], distinctValue=distinctValues[i];
		for(var j=0; j<nodeList.length; j++){
			var node=nodeList[j];
			if(parseInt(node.getAttribute(attr))==distinctValue)
				group.push(node);
		}
		groups.push(group);
	}
	return groups;
}

/**
 * Check if the nodes stored in horizontalAlignedNodes list can be matched vertically with any of the stored nodes and link them together
 * @param horizontalAlignedNodes {@code Array} an array of horizontally aligned nodes
 * @param similarNodesList       {@code Array} an array of all similar nodes
 * @param nodeList               {@code Array} an array of nodes
 */
function linkGridRows(horizontalAlignedNodes, similarNodesList, nodeList){
	for(var i=0; i<horizontalAlignedNodes.length; i++){
		var nodeA=horizontalAlignedNodes[i], matched=false;
		if(nodeA.getAttribute('previousSimilarDirection')==='left' || nodeA.getAttribute('nextSimilarDirection')==='right'){
			// Start searching from the nodes below nodeA
			for(var j=(similarNodesList.indexOf(nodeA))+1; j<similarNodesList.length; j++){ 
				var nodeB=similarNodesList[j];
				// Check if nodeA and nodeB are vertically aligned and nodeA is above nodeB
				if(areVerticallyAligned(nodeA,nodeB) && getSimilarityNormalized(nodeA, nodeB)>=0.4){
					//updateNode(nodeA,"BT");  updateNode(nodeB,"BT");
					removeLeftLink(nodeA, nodeList);
					removeRightLink(nodeA, nodeList);
					// Link nodeA and nodeB together by setting their previous/next similarity attributes
					if(nodeB.getAttribute('previousSimilar')===null || nodeB.getAttribute('previousSimilarDirection')==='left'){
						removeLeftLink(nodeB, nodeList); 
						removeRightLink(nodeB, nodeList);
						setAttsOfNode(nodeA, ['nextSimilar','nextSimilarDirection'],[nodeList.indexOf(nodeB),'down']);
						setAttsOfNode(nodeB, ['previousSimilar','previousSimilarDirection'], [nodeList.indexOf(nodeA),'up']);
					}else{	
						var previousSimilarItem=nodeList[parseInt(nodeB.getAttribute('previousSimilar'))];
						if(parseInt(previousSimilarItem.getAttribute('top')) < parseInt(nodeA.getAttribute('top'))){
							setAttsOfNode(previousSimilarItem, ['nextSimilar','nextSimilarDirection'],[nodeList.indexOf(nodeA),'down']);
							setAttsOfNode(nodeA, ['previousSimilar','previousSimilarDirection'], [nodeList.indexOf(previousSimilarItem),'up']);
							setAttsOfNode(nodeA, ['nextSimilar','nextSimilarDirection'],[nodeList.indexOf(nodeB),'down']);
							setAttsOfNode(nodeB, ['previousSimilar','previousSimilarDirection'], [nodeList.indexOf(nodeA),'up']);
						}else{
							setAttsOfNode(nodeA, ['nextSimilar','nextSimilarDirection'],[nodeList.indexOf(previousSimilarItem),'down']);
							setAttsOfNode(previousSimilarItem, ['previousSimilar','previousSimilarDirection'], [nodeList.indexOf(nodeA),'up']);
						}
					}
					matched=true;
					break;
				}
			}
			// If not matched, start searching from the nodes above nodeA 
			if(!matched){
				for(var j=parseInt(similarNodesList.indexOf(nodeA)); j>=0; j--){
					var nodeB=similarNodesList[j];
					// Check if nodeA and nodeB are vertically aligned and nodeB is above nodeA
					if(areVerticallyAligned(nodeB,nodeA) && getSimilarityNormalized(nodeA, nodeB)>=0.4){
						//updateNode(nodeA,"BT");  updateNode(nodeB,"BT");
						removeLeftLink(nodeA, nodeList);
						removeRightLink(nodeA, nodeList);
						// Link nodeA and nodeB together by setting their previous/next similarity attributes
						if(nodeB.getAttribute('nextSimilar')===null || nodeB.getAttribute('nextSimilarDirection')==='right'){
							removeLeftLink(nodeB, nodeList); removeRightLink(nodeB, nodeList);
							setAttsOfNode(nodeA, ['previousSimilar','previousSimilarDirection'], [nodeList.indexOf(nodeB),'up']);
							setAttsOfNode(nodeB, ['nextSimilar','nextSimilarDirection'], [nodeList.indexOf(nodeA),'down']);
						}else{
							var leafNode=getLeafNode(nodeB,nodeList);
							setAttsOfNode(leafNode, ['nextSimilar','nextSimilarDirection'],[nodeList.indexOf(nodeA),'down']);
							setAttsOfNode(nodeA, ['previousSimilar','previousSimilarDirection'], [nodeList.indexOf(leafNode),'up']);
						}
						break;
					}
				}
			}
		}
	}
}

/**
 * Check if the roots can be matched vertically with any of the stored nodes and link them
 * Add the root to the removable nodes list if it can be linked with another node
 * @param roots 				 {@code Array} an array of root nodes
 * @param similarNodesList       {@code Array} an array of all similar nodes
 * @param nodeList               {@code Array} an array of nodes
 * @param removableNodes         {@code Array} an array to store nodes to be removed
 */
 /*function linkRootsWithOtherNodes(roots, similarNodesList, nodeList, removableNodes){
	for(var i=0; i<roots.length; i++){
		var root=roots[i];
		// Start searching from the stored nodes that are above the selected root
		for(var j=parseInt(similarNodesList.indexOf(root)); j>=0; j--){
			var node=similarNodesList[j];
			// Check if the root and the node are vertically aligned and node is above root
			if(areVerticallyAligned(node,root) && getSimilarityNormalized(root, node)>=0.4){
				if(node.getAttribute('nextSimilar')===null){
					setAttsOfNode(root, ['previousSimilar','previousSimilarDirection'], [nodeList.indexOf(node),'up']);
					setAttsOfNode(node, ['nextSimilar','nextSimilarDirection'], [nodeList.indexOf(root),'down']);
				}else{
					var leafNode=getLeafNode(node,nodeList);
					setAttsOfNode(leafNode, ['nextSimilar','nextSimilarDirection'],[nodeList.indexOf(root),'down']);
					setAttsOfNode(root, ['previousSimilar','previousSimilarDirection'], [nodeList.indexOf(leafNode),'up']);	
				}
				removableNodes.push(root);
				break;
			}
		}
	} 
 }*/
 
 /**
 * Check if roots can be matched. If so, link them together as one linked list and store them as removable roots
 * @param roots 				 {@code Array} an array of root nodes
 * @param nodeList               {@code Array} an array of nodes
 * @param removableNodes         {@code Array} an array to store nodes to be removed
 */
function linkRoots(roots, nodeList, removableNodes){
	for(var i=0; i<roots.length; i++){
		var rootA=roots[i];
		for(var j=0; j<roots.length; j++){
			var rootB=roots[j];
			// Check if rootA is not already linked, and rootA and rootB are similar
			//if(i!==j && rootA.getAttribute('previousSimilar')===null && getSimilarityNormalized(rootA,rootB)>=0.6)
			if(i!==j && rootA.getAttribute('previousSimilar')===null && getSimilarityNormalized(rootA,rootB)>=0.4
			         && (parseInt(rootA.getAttribute('width'))===parseInt(rootB.getAttribute('width')) 
					 || parseInt(rootA.getAttribute('left'))===parseInt(rootB.getAttribute('left'))
					 /*|| parseInt(rootA.getAttribute('right'))===parseInt(rootB.getAttribute('right'))*/))
			/*if(i!==j && rootA.getAttribute('previousSimilar')===null && getSimilarityNormalized(rootA,rootB)>=0.4
			         && rootA.getAttribute('width')===rootB.getAttribute('width'))	*/	 
				// Check if rootB is not already linked
				if(rootB.getAttribute('previousSimilar')===null){
					// Get leaf node of the list that starts from rootA
					var leafNode=getLeafNode(rootA,nodeList);
					// Link the leaf node of rootA with rootB to form one linked list
					setAttsOfNode(leafNode, ['nextSimilar','nextSimilarDirection'],[nodeList.indexOf(rootB),'right']);
					setAttsOfNode(rootB, ['previousSimilar','previousSimilarDirection'],[nodeList.indexOf(leafNode),'left']);	
					// Remove rootB from roots list
					removableNodes.push(rootB);
					break;
				}else{
					// Get leaf node of the list that starts from rootB
					var leafNode=getLeafNode(rootB,nodeList);
					// Link the leaf node of rootB with rootA to form one linked list
					setAttsOfNode(leafNode, ['nextSimilar','nextSimilarDirection'],[nodeList.indexOf(rootA),'right']);
					setAttsOfNode(rootA, ['previousSimilar','previousSimilarDirection'],[nodeList.indexOf(leafNode),'left']);	
					// Remove rootA from roots list
					removableNodes.push(rootA);
					break;
				}	
		}
	}
}
 
/**
 * Get the root nodes of each linked list from a list of nodes
 * @param nodeList              {@code Array} an array of nodes to be checked
 * @returns roots               {@code Array} array of roots
 */
function getRoots(nodeList){
	var roots=[];
	for(var i=0; i<nodeList.length; i++){
		if(nodeList[i].getAttribute('previousSimilar')===null){
            roots.push(nodeList[i]);
		}
    }
	listSorting(roots,'top', 'left', 'Ascending');
	return roots;
}

/**
 * Check if two nodes are vertically aligned 
 * @param nodeA                 first tree node
 * @param nodeB                 second tree node
 * @returns {@code Boolean}     {@code true} for vertically aligned, {@code false} for not vertically aligned
 */
function areVerticallyAligned(nodeA,nodeB){
	var leftA = parseInt(nodeA.getAttribute('left')), leftB = parseInt(nodeB.getAttribute('left')),
        topA = parseInt(nodeA.getAttribute('top')), topB = parseInt(nodeB.getAttribute('top')),
        rightA = parseInt(nodeA.getAttribute('right')), rightB = parseInt(nodeB.getAttribute('right')),
        bottomA = parseInt(nodeA.getAttribute('bottom')), bottomB = parseInt(nodeB.getAttribute('bottom'));
	// nodeA and nodeB are vertically aligned if they have the same left and right attributes, and nodeA is above nodeB
	return (leftA===leftB /*&& rightA===rightB*/ && bottomA<bottomB && topA<topB) ? true : false;
}

/**
 * Check if two nodes are horizontally aligned 
 * @param nodeA                 first tree node
 * @param nodeB                 second tree node
 * @returns {@code Boolean}     {@code true} for horizontally aligned, {@code false} for not horizontally aligned
 */
function areHorizontallyAligned(nodeA,nodeB){
	var leftA = parseInt(nodeA.getAttribute('left')), leftB = parseInt(nodeB.getAttribute('left')),
        topA = parseInt(nodeA.getAttribute('top')), topB = parseInt(nodeB.getAttribute('top')),
        rightA = parseInt(nodeA.getAttribute('right')), rightB = parseInt(nodeB.getAttribute('right')),
	    widthA = parseInt(nodeA.getAttribute('width')), widthB = parseInt(nodeB.getAttribute('width'));
	// nodeA and nodeB are horizontally aligned if they have the same top and width attributes, and nodeA is to the left of nodeB
	return (topA==topB && widthA==widthB && leftA<leftB && rightA<rightB) ? true : false;
}

/**
 * Sort nodes in an array by two attributes
 * @param nodeList              {@code Array} an array of nodes
 * @param firstAttr             {@code String} an attribute string
 * @param secondAttr            {@code String} another attribute string
 * @param sortingType           {@code String} the sorting type string: 'ASCENDING' or 'DESCENDING'
 * @returns                     {@code Array} the sorted nodes' array 
 */
function listSorting(nodeList, firstAttr, secondAttr, sortingType){  
	if(sortingType.toUpperCase()==='ASCENDING'){
		nodeList.sort(function(nodeA,nodeB){
			var firstAttrSorting = parseInt(nodeA.getAttribute(firstAttr)) - parseInt(nodeB.getAttribute(firstAttr));
			// if the first attribute values of the two nodes are equal, compare the nodes by the second attribute
			return firstAttrSorting == 0 ? parseInt(nodeA.getAttribute(secondAttr)) - parseInt(nodeB.getAttribute(secondAttr)) : firstAttrSorting;
		});
	}else
		if(sortingType.toUpperCase()==='DESCENDING'){
			nodeList.sort(function(nodeA,nodeB){
				var firstAttrSorting = parseInt(nodeB.getAttribute(firstAttr)) - parseInt(nodeA.getAttribute(firstAttr));
				// if the first attribute values of the two nodes are equal, compare the nodes by the second attribute
				return firstAttrSorting == 0 ? parseInt(nodeB.getAttribute(secondAttr)) - parseInt(nodeA.getAttribute(secondAttr)) : firstAttrSorting;
			});
		}
}

/**
 * Set the values of a list of attributes of a node
 * @param node                  tree node
 * @param attsList              {@code Array} array of attributes to set their values
 * @param attsValuesList        {@code Array} array of values to be set for each attribute
 */
function setAttsOfNode(node, attsList, attsValuesList){
	for(var i=0; i<attsList.length; i++)
		node.setAttribute(attsList[i], attsValuesList[i]);
}

/**
 * Remove a list of attributes of a node
 * @param node                  tree node
 * @param attsList              {@code Array} array of attributes to be removed
 */
function removeAttsOfNode(node, attsList){
	for(var i=0; i<attsList.length; i++)
		node.removeAttribute(attsList[i]);
}

/**
 * Remove stored nodes in a list from another list of nodes
 * @param removableNodes        {@code Array} array of nodes to be removed
 * @param nodeList              {@code Array} array of nodes to remove nodes from
 */
function removeNodesFromList(removableNodes, nodeList){
	for(var i=0; i<removableNodes.length; i++){
		var index=nodeList.indexOf(removableNodes[i]);
		if(index>-1)
			nodeList.splice(index,1);
	}
}

/**
 * Get nodes of a linked list starting from its root, and store them in an array
 * @param root                  root node
 * @param nodeList              {@code Array} array of nodes 
 * @returns linkedList      	{@code Array} array to store the nodes
 */
function getNodesOfLinkedList(root, nodeList){
	var linkedList=[root], nextSimilar;
	nextSimilar=nodeList[parseInt(root.getAttribute('nextSimilar'))];
	while(nextSimilar){
		linkedList.push(nextSimilar);
		nextSimilar=nodeList[parseInt(nextSimilar.getAttribute('nextSimilar'))];
	}
	listSorting(linkedList,'top', 'left', 'Ascending');
	return linkedList;
}

/**
 * Check if nodeB is one of the ancestors of nodeA
 * @param nodeA                 a tree node
 * @param nodeB                 a tree node
 * @returns {@code Boolean}     {@code true} if nodeB is ancestor of nodeA, while {@code false} if it is not ancestor
 */
function isOneOfAncestorsOfNodeA(nodeA, nodeB){
	var nodeParent=nodeA.parentElement, isAncestor=false;
	while(nodeParent && !isAncestor){
		if(nodeParent===nodeB){
			isAncestor=true;
			break;
		}
        nodeParent=nodeParent.parentElement;
    } 
	return isAncestor;
}

/**
 * Calculate the total area size of a list of nodes
 * @param nodeList              {@code Array} array of nodes
 * @returns totalArea    	    {@code number} total area size of the nodes
 */
function getTotalAreaSize(nodeList){
	var totalArea=0;
	for(var i=0; i<nodeList.length; i++){
		totalArea+=parseInt(nodeList[i].getAttribute('width'))*parseInt(nodeList[i].getAttribute('height'));	
	}
	return totalArea;
}

/**
 * Remove duplicates from array 
 * @param array                 {@code Array} array of items to be filtered
 * @param arrayType             {@code String} the array type string: '1D' or '2D'
 * @returns filteredArray       {@code Array} array of distinct items
 */
function removeDuplicatesFromArray(array, arrayType){
	var filteredArray=[];
	// Filter 1D array
	if(arrayType==='1D'){
		array.forEach(function(item){
			if(filteredArray.indexOf(item) < 0)
				filteredArray.push(item);
		});
	// Filter 2D array
	}else{
		for(var i=0; i<array.length; i++){
			var row=array[i];
			if(filteredArray.length==0 || !containRow(row, filteredArray))
				filteredArray.push(row);
		}
	}
	return filteredArray;
}

/**
 * Check if an array contains a specific row of items
 * @param row                   {@code Array} array of items to be searched for
 * @param array                 {@code Array} 2D array 
 * @returns {@code Boolean}     {@code true} if the array contains the row, while {@code false} if the row is not existed
 */
function containRow(row, array){
	for(var i=0; i<array.length; i++){
		var arrayRow=array[i], counter=0;
		if(row.length!=arrayRow.length)
			continue;
		for(var j=0; j<arrayRow.length; j++){
			if(arrayRow[j]===row[j])
				counter++;
		}
		if(counter===arrayRow.length)
			return true;
	}
	return false;
}

/**
 * Get leaf of specific node 
 * @param node                  a tree node to start the search from
 * @param nodeList              {@code Array} array of nodes 
 * @returns leafNode       		a node which is last node of list
 */
function getLeafNode(node,nodeList){
	var leafNode=node;
	while(leafNode.getAttribute('nextSimilar')!==null){
		leafNode=nodeList[parseInt(leafNode.getAttribute('nextSimilar'))];
	}
	return leafNode;
}

/**
 * Remove the left link attribute of a node
 * @param node                  a tree node to be modified
 * @param nodeList              {@code Array} array of nodes 
 */
function removeLeftLink(node,nodeList){
	if(node.getAttribute('previousSimilarDirection')==='left'){
		var previousSimilarItem=nodeList[parseInt(node.getAttribute('previousSimilar'))];
		removeAttsOfNode(node, ['previousSimilar', 'previousSimilarDirection']);
		removeAttsOfNode(previousSimilarItem, ['nextSimilar', 'nextSimilarDirection']);
	}
}

/**
 * Remove the right link attribute of a node
 * @param node                  a tree node to be modified
 * @param nodeList              {@code Array} array of nodes 
 */
function removeRightLink(node,nodeList){
	if(node.getAttribute('nextSimilarDirection')==='right'){
		var nextSimilarItem=nodeList[parseInt(node.getAttribute('nextSimilar'))];
		removeAttsOfNode(node, ['nextSimilar', 'nextSimilarDirection']);
		removeAttsOfNode(nextSimilarItem, ['previousSimilar', 'previousSimilarDirection']);
	}
}

/**
 * Calculate the distance between two points
 * @param x1            	    {@code number} x coordinate of the first point
 * @param y1            	    {@code number} y coordinate of the first point
 * @param x2            	    {@code number} x coordinate of the second point
 * @param y2            	    {@code number} y coordinate of the second point
 * @returns {@code number}      The distance value
 */
function calculate2PointsDistance(x1,y1,x2,y2){
	var a = x1 - x2, b = y1 - y2;
    return(Math.sqrt( a*a + b*b ));
}

/**
 * Check if one of the linked lists represents a filter block
 * @param linkedList            {@code Array} array of linked nodes
 * @returns {@code Boolean}     {@code true} if the list represents a filter block, while {@code false} means not a filter block
 */
function isFilterBlock(linkedList){
	//if(linkedList.length<=4){
		var body = document.body, 
			html = document.documentElement,
			docHeight = Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight);
		for(var i=0; i<linkedList.length-1; i++){
			var nodeA=linkedList[i], nodeB=linkedList[i+1];
			var distance=calculate2PointsDistance(0,parseInt(nodeA.getAttribute('top'))+parseInt(nodeA.getAttribute('height')),0,parseInt(nodeB.getAttribute('top')));
			/*updateNode(nodeA, 'BT');
			alert(i);
			updateNode(nodeB, 'BT');
			alert((i+1));
			alert(i+"     "+(i+1)+"\ndistance: "+distance+"       docHeight: "+docHeight+"        "+(distance/docHeight*100)+"\n"+
			      "Top="+nodeA.getAttribute('top')+"     Top="+nodeB.getAttribute('top'));
			if(distance>(docHeight*(25/100))){
				alert("distance is larger");
			}
			if((parseInt(nodeA.getAttribute('top'))+parseInt(nodeA.getAttribute('height')))>parseInt(nodeB.getAttribute('top'))){
				alert("top is greater");
			}*/
			if((parseInt(nodeA.getAttribute('top'))+parseInt(nodeA.getAttribute('height')))<parseInt(nodeB.getAttribute('top')) && distance>(docHeight*(20/100)))
				return true;
		}
	//}
	return false;
}

/**
 * Update the background color and the box shadow of a node
 * @param node           	    a tree node
 * @param treeType              {@code String} the tree type string: 'BT' or 'VT'
 */
function updateNode(node, treeType) {
	var color = chroma.random().css();
	if(treeType==='BT')
		for(var j=0; j<node.vtNodes.length; j++) {
			var element = node.vtNodes[j].domElement;
			//element.style.boxShadow = '0px 0px 3px 3px #666';
			element.style.boxShadow = '0px 0px 3px 3px '+color;
			element.style.backgroundColor = color;
		} 
	else
		if(treeType==='VT'){
			var element = node.domElement;
			//element.style.boxShadow = '0px 0px 3px 3px #666';
			element.style.boxShadow = '0px 0px 3px 3px '+color;
			element.style.backgroundColor = color;
		}
}

/**
 * Update the background color and the box shadow of a list of nodes
 * @param nodes           	    {@code Array} array of nodes
 * @param treeType              {@code String} the tree type string: 'BT' or 'VT'
 */
function updateNodes(nodes, treeType) {
	var color=chroma.random().css();
	if(treeType==='BT')
		for(var i=0; i<nodes.length ; i++){
			var node=nodes[i];
			for(var j=0; j<node.vtNodes.length; j++) {
				var element = node.vtNodes[j].domElement;
				element.style.boxShadow = '0px 0px 3px 3px #666';
				element.style.backgroundColor = color;
			} 
		}
	else
		if(treeType==='VT'){
			for(var i=0; i<nodes.length; i++){
				var node=nodes[i];
				var element = node.domElement;
				element.style.boxShadow = '0px 0px 3px 3px #666';
				element.style.backgroundColor = color;
			}
		}
}
