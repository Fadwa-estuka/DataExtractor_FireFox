var nodeCompare=new NodeCompare();

/**
 * Align data items of the data records
 * @param dataRecords           {@code Array} array of the extracted data records
 * @param treeType              {@code String} the tree type string: 'BT' or 'VT'
 * @returns 				    {@code Array} array of size 3 contains: data table, data table as string for the txt file, and data table for the csv file
 */
function alignDataItems(dataRecords, treeType){
	var allDataItemsClusters=[], finalResults=[], leavesList=[];
	
	// Get the leaf nodes of every data record, and store them in leavesList array
	for(var i=0; i<dataRecords.length; i++){
		var dataRecord=dataRecords[i], leaves=getLeafNodesOfRecord(dataRecord, treeType);
		// Set the content attribute of every leaf node in the data records
		setContentsOfLeaves(leaves, dataRecord);
		// Merge the contents of the mergable leaf nodes and remove the merged ones from leaves list
		mergeSiblingLeaves(leaves);
		leavesList.push(leaves);
		dataRecord.setAttribute('leavesIndex', leavesList.length-1);
		dataRecord.setAttribute('noOfLeaves', leaves.length);
	}
	
	// Cluster the data records to groups
	var dataRecordsClusters=clusterDataRecords(dataRecords);
	
	for(var i=0; i<dataRecordsClusters.length; i++){
		// Collect leaf nodes of all records in each data records cluster
		var dataRecordsCluster=dataRecordsClusters[i], leavesOfCluster=getLeafNodesOfCluster(dataRecordsCluster, leavesList);
		// Cluster the leaf nodes to groups
		var dataItemsClusters=clusterDataItems(leavesOfCluster);
		allDataItemsClusters.push(dataItemsClusters);
	}
	
	// Sort the arrays in allDataItemsClusters descendingly by their lengths
	allDataItemsClusters.sort(function(a,b){return parseInt(b.length)-parseInt(a.length)});
	
	// baseDataItemsClusters are the data items clusters with the data records that have the maximum number of data items
	// baseDataItemsClusters is the base that we can merge all the other data items clusters with
	var baseDataItemsClusters=allDataItemsClusters[0];
	
	// Merge all the other data items clusters with the base data items clusters
	for(var i=1; i<allDataItemsClusters.length; i++){
		var nextDataItemsClusters=allDataItemsClusters[i];
		mergeClusters(baseDataItemsClusters,nextDataItemsClusters);
	}
	
	// Check if all data items in one of the base data items clusters have no content. If so, mark that cluster as removable
	var removableClusters=[];
	for(var i=0; i<baseDataItemsClusters.length; i++){
		var dataItemsCluster=baseDataItemsClusters[i];
		if(hasNoContent(dataItemsCluster))
			removableClusters.push(dataItemsCluster);
	}
	
	// Remove the removable clusters from the base data items clusters
	removeNodesFromList(removableClusters, baseDataItemsClusters);

	for(var i=0; i<baseDataItemsClusters.length; i++){
		var dataItemsCluster=baseDataItemsClusters[i];
		// Sort the data items in each cluster ascendingly by their data record id
		dataItemsCluster.sort(function(a,b){return parseInt(a.getAttribute('dataRecordId'))-parseInt(b.getAttribute('dataRecordId'))});
	}
	
	// Initialize the number of table rows and columns 
	var rows=dataRecords.length, cols=baseDataItemsClusters.length;
	// Initialize the data table and the nodes table with empty values 
	var dataTable=initializeTable(rows,cols+1), nodesTable=initializeTable(rows,cols+1);
	// Fill the data table and the nodes table with values from baseDataItemsClusters
	// dataTable contains the contents of the extracted data items, while nodesTable contains the data items' nodes themselves
	fillTables(dataTable, nodesTable, baseDataItemsClusters);
	
	// Update the number of table columns after merging and deleting
	cols=dataTable[0].length;
	
	// Initializing a csv table and copy the contents of the data table into the csv table
	var csvTable=getCsvTable(dataTable, rows, cols);
	
	// Initialize the table cells sizes by specifying the length of each column
	var cellsSizes=initializeCellsSize(dataTable, rows, cols);
	// Print the data table by converting it into one string
	var dataTableStr=printDataTable(dataTable,cellsSizes);
	
	// Push the result tables in one array
	finalResults.push(dataTable);
	finalResults.push(dataTableStr);
	finalResults.push(csvTable);
	for(var i=0; i<dataRecords.length; i++)
		updateNode(dataRecords[i], treeType);
	return finalResults;
}

/**
 * Get leaf nodes of a data record
 * @param dataRecord            root node of the data record tree
 * @param treeType              {@code String} the tree type string: 'BT' or 'VT'
 * @returns leaves				{@code Array} array of leaf nodes
 */
function getLeafNodesOfRecord(dataRecord, treeType){
	var leaves=[], alteredNodes=[], missedTextNodes=[], dataRecordId=parseInt(dataRecord.getAttribute('id'));
	if(treeType==='BT'){
		// Traverse the data record tree and collect its nodes
		var traverse=new Traversal(dataRecord);
		traverse.preorder(dataRecord);
		var nodeList = traverse.nodeQueue;
		for(var i=0; i<nodeList.length; i++){
			var node=nodeList[i];
			for(var j=0; j<node.vtNodes.length; j++){
				var vtNode=node.vtNodes[j];
				if(vtNode.hasChildNodes()===false){
					vtNode.setAttribute('dataRecordId', dataRecordId);
					leaves.push(vtNode);
					checkMissedTextNodes(vtNode, alteredNodes, missedTextNodes);
				}
			}
		}
	}
	else{
		// Traverse the data record tree and collect its nodes
		var traverse=new Traversal(dataRecord);
		traverse.preorder(dataRecord);
		var nodeList = traverse.nodeQueue;
		for(var i=0; i<nodeList.length; i++){
			var vtNode=nodeList[i];
			if(vtNode.hasChildNodes()===false){
				vtNode.setAttribute('dataRecordId', dataRecordId);
				leaves.push(vtNode);
				checkMissedTextNodes(vtNode, alteredNodes, missedTextNodes);
			}
		}
	}
	// Sort the leaves list ascendingly by their top and left attributes
	listSorting(leaves,'top', 'left', 'Ascending');
	// Set the next mergable sibling index attribute of each altered node if is has similar sibling
	for(var i=0; i<alteredNodes.length; i++){
		var alteredNode=alteredNodes[i];
		for(var j=0; j<leaves.length; j++){
			var leafNode=leaves[j];
			if(alteredNode!==leafNode && alteredNode.nextSibling===leafNode && nodeCompare.Compare(alteredNode, leafNode, 'complete')===1)
				alteredNode.setAttribute("nextMergableSiblingIndex", j);
		}
	}
	return leaves;
}

/**
 * Check the missed text nodes, which are sibling of a specific node, and add their textual values to the node if they exist
 * @param node           		a tree node to check its siblings
 * @param alteredNodes         {@code Array} array to store the altered nodes 
 */
function checkMissedTextNodes(node, alteredNodes, missedTextNodes){
	var nodeParent=node.parentElement, nodeIndex=-1;
	// Get the index of the node
	for(var i=0; i<nodeParent.domElement.childNodes.length; i++){
		var child=nodeParent.domElement.childNodes[i];
		if(child===node.domElement)
			nodeIndex=i;
	}
	// Check if the next sibling of the node is a text node
	if(nodeIndex>-1 && nodeIndex!=nodeParent.domElement.childNodes.length-1){
		var child=nodeParent.domElement.childNodes[nodeIndex+1];
		if(child.nodeType==3 && child.nodeValue.trim().length>0){
			node.setAttribute("nextMissedTextNode", child.nodeValue.trim());
			alteredNodes.push(node);
			missedTextNodes.push(child);
			//alert("next   "+node.domElement.childNodes[0].nodeValue+"\n"+child.nodeValue);
		}
	}
	// Check if the previous sibling of the node is a text node
	/*if(nodeIndex==1){
		var child=nodeParent.domElement.childNodes[0];
		if(child.nodeType==3 && child.nodeValue.trim().length>0){
			node.setAttribute("prevMissedTextNode", child.nodeValue.trim());
			if(alteredNodes.indexOf(node)<0)
				alteredNodes.push(node);
		}
	}*/
	// Check if the previous sibling of the node is a text node
	/*if(nodeIndex>0){
		var child=nodeParent.domElement.childNodes[nodeIndex-1];
		if(missedTextNodes.indexOf(child)<0 && child.nodeType==3 && child.nodeValue.trim().length>0){
			node.setAttribute("prevMissedTextNode", child.nodeValue.trim());
			if(alteredNodes.indexOf(node)<0)
				alteredNodes.push(node);
			missedTextNodes.push(child);
		}
	}*/
	// Check if the previous sibling of the node is a text node
	if(nodeIndex>0){
		for(var i=0; i<nodeIndex; i++){
			var child=nodeParent.domElement.childNodes[i];
			if(missedTextNodes.indexOf(child)<0 && child.nodeType==3 && child.nodeValue.trim().length>0){
				if(node.getAttribute('prevMissedTextNode')===null)
					node.setAttribute("prevMissedTextNode", child.nodeValue.trim());
				else
					node.setAttribute("prevMissedTextNode", node.getAttribute('prevMissedTextNode')+" "+child.nodeValue.trim());
				if(alteredNodes.indexOf(node)<0)
					alteredNodes.push(node);
				missedTextNodes.push(child);
			}
		}
	}
}

/**
 * Cluster the data records to groups
 * @param dataRecords           {@code Array} array of root nodes
 * @returns clusters			{@code Array} array of arrays of clustered nodes
 */
function clusterDataRecords(dataRecords){
	var clusters=[], clusteredRecords=[];
	for(var i=0; i<dataRecords.length; i++){
		var dataRecordA=dataRecords[i];
		// Check if dataRecordA is already clustered
		if(clusteredRecords.indexOf(dataRecordA)>-1)
			continue;
		// Put dataRecordA in a new cluster
		var cluster=[dataRecordA];
		// Mark dataRecordA as clustered
		clusteredRecords.push(dataRecordA);
		for(var j=i+1; j<dataRecords.length; j++){ 
			var dataRecordB=dataRecords[j];
			// The two records must have the same number of leaves and their normalized similarity must be 1
			if(getSimilarityNormalized(dataRecordA, dataRecordB)===1 && clusteredRecords.indexOf(dataRecordB)<0 &&
			   parseInt(dataRecordA.getAttribute('noOfLeaves'))===parseInt(dataRecordB.getAttribute('noOfLeaves'))){
				// Put dataRecordB in the same cluster of dataRecordA
				cluster.push(dataRecordB);
				// Mark dataRecordB as clustered
				clusteredRecords.push(dataRecordB);
			}
		}
		clusters.push(cluster);
	}
	return clusters;
}

/**
 * Cluster leaf nodes to groups
 * @param leaves                {@code Array} array of leaf nodes
 * @returns clusters			{@code Array} array of arrays of clustered nodes
 */
function clusterDataItems(leaves){
	var clusters=[], clusteredItems=[];
	for(var i=0; i<leaves.length; i++){
		var leafNodeA=leaves[i];
		// Check if leafNodeA is already clustered
		if(clusteredItems.indexOf(leafNodeA)>-1)
			continue;
		// Put leafNodeA in a new cluster
		var cluster=[leafNodeA], ids=[parseInt(leafNodeA.getAttribute('dataRecordId'))];
		// Mark leafNodeA as clustered
		clusteredItems.push(leafNodeA);
		for(var j=i+1; j<leaves.length; j++){ 
			var leafNodeB=leaves[j];	
			// The two leaves must belong to different data records, and their similarity must be 1
		    if(nodeCompare.Compare(leafNodeA, leafNodeB, 'partial')===1 && clusteredItems.indexOf(leafNodeB)<0 &&
			   ids.indexOf(parseInt(leafNodeB.getAttribute('dataRecordId')))<0){
				// Put leafNodeB in the same cluster of leafNodeA
				cluster.push(leafNodeB);
				// Mark leafNodeB as clustered
				clusteredItems.push(leafNodeB);
				ids.push(parseInt(leafNodeB.getAttribute('dataRecordId')));
			}
		}
		clusters.push(cluster);
	}
	return clusters;
}

/**
 * Collect leaf nodes of all records in each data records cluster
 * @param cluster               {@code Array} array of root nodes of the data records
 * @param leavesList            {@code Array} array of leaf nodes
 * @returns leaves			    {@code Array} array of leaf nodes
 */
function getLeafNodesOfCluster(cluster, leavesList){
	var leaves=[];
	for(var i=0; i<cluster.length; i++){
		var dataRecord=cluster[i], recordLeaves=leavesList[parseInt(dataRecord.getAttribute('leavesIndex'))];
		for(var j=0; j<recordLeaves.length; j++)
			leaves.push(recordLeaves[j]);	
	}
	return leaves;
}

/**
 * Merge all the other data items clusters with the base data items clusters
 * @param baseDataItemsClusters   {@code Array} array of arrays of nodes
 * @param otherDataItemsClusters  {@code Array} array of arrays of nodes
 */
function mergeClusters(baseDataItemsClusters,otherDataItemsClusters){
	var clusteredItems=[], matchedItems=[];
	for(var i=0; i<otherDataItemsClusters.length; i++){
		// DataItemA is the first data item of each cluster of otherDataItemsClusters
		var otherDataItemsCluster=otherDataItemsClusters[i], DataItemA=otherDataItemsCluster[0];	
		// Start searching from the same index of DataItemA
		for(var j=i; j<baseDataItemsClusters.length; j++){
			// DataItemB is the first data item of each cluster of baseDataItemsClusters
			var baseDataItemsCluster=baseDataItemsClusters[j], DataItemB=baseDataItemsCluster[0];
			//  Similarity between DataItemA and DataItemB must be 1
			if(/*DataItemA.getAttribute('dataRecordId')!==DataItemB.getAttribute('dataRecordId') &&*/ matchedItems.indexOf(DataItemB)<0 && 
			   nodeCompare.Compare(DataItemA, DataItemB, 'complete')==1){
				DataItemA.setAttribute('matchedClusterIndex',j);
				// Mark DataItemA as clustered and DataItemB as matched
				clusteredItems.push(DataItemA);
				matchedItems.push(DataItemB);
				// Push all data items of the current otherDataItemsCluster in the matched baseDataItemsCluster
				for(var k=0; k<otherDataItemsCluster.length; k++)
					baseDataItemsCluster.push(otherDataItemsCluster[k]);
				break;
			}
		}
		// Check if DataItemA couldn't be merged with any cluster of baseDataItemsClusters
		if(clusteredItems.indexOf(DataItemA)<0){
			// Check if the current otherDataItemsCluster is the first cluster (index is 0)
			if(i===0){
				// Add the current otherDataItemsCluster at the begining of baseDataItemsClusters array
				baseDataItemsClusters.splice(0, 0, otherDataItemsCluster);
				DataItemA.setAttribute('matchedClusterIndex',0);
			}
			else{
				// Get the index where the previous cluster added, then add the current otherDataItemsCluster at the next index
				var locationIndex=parseInt(otherDataItemsClusters[i-1][0].getAttribute('matchedClusterIndex'));
				baseDataItemsClusters.splice(locationIndex+1, 0, otherDataItemsCluster);
				DataItemA.setAttribute('matchedClusterIndex',locationIndex+1);
			}
			// Mark DataItemA as clustered
			clusteredItems.push(DataItemA);
		}	
	}
}

/**
 * Check if all data items in one of the data items clusters have no content
 * @param dataItemsCluster     	{@code Array} an array of nodes
 * @returns {@code Boolean}     {@code true} for cluster that has content, {@code false} for cluster that hasn't content
 */
function hasNoContent(dataItemsCluster){
	var counter=0;
	for(var i=0; i<dataItemsCluster.length; i++){
		var dataItem=dataItemsCluster[i], content="";
		// Get the node values of all of the data item's children
		for(var j=0; j<dataItem.domElement.childNodes.length; j++){
			var nodeValue=dataItem.domElement.childNodes[j].nodeValue;
			if(nodeValue)
				content+=nodeValue.trim();
		}
		if(!content || content.length==0)
			counter++;
	}
	if(counter===dataItemsCluster.length) 
		return true;
	return false;
}

/**
 * Set the content attribute of every leaf node in the data records
 * @param leaves				{@code Array} array of leaf nodes
 * @param dataRecord            root node of the data record tree
 */
function setContentsOfLeaves(leaves, dataRecord){
	for(var i=0; i<leaves.length; i++){
		var dataItem=leaves[i], content="";
		for(var j=0; j<dataItem.domElement.childNodes.length; j++){
			var nodeValue=dataItem.domElement.childNodes[j].nodeValue;
			if(nodeValue!==null)
				content+=nodeValue.trim().replace(/(\r\n|\n|\r)/gm,"");
		}
		if(dataItem.getAttribute('prevMissedTextNode')!=null)
			content=dataItem.getAttribute('prevMissedTextNode')+" "+content;
		if(dataItem.getAttribute('nextMissedTextNode')!=null)
			content+=" "+dataItem.getAttribute('nextMissedTextNode');
		dataItem.setAttribute('content',content.trim());
	}
}

/**
 * Merge the contents of the mergable leaf nodes and remove the merged ones from leaves list
 * @param leaves				{@code Array} array of leaf nodes
 */
function mergeSiblingLeaves(leaves){
	var merged=[];
	for(var i=0; i<leaves.length; i++){
		var dataItem=leaves[i], nextMergableSiblingIndex=dataItem.getAttribute('nextMergableSiblingIndex');
		while(merged.indexOf(dataItem)<0 && nextMergableSiblingIndex!==null){
			var nextMergableSibling=leaves[parseInt(nextMergableSiblingIndex)];
			dataItem.setAttribute('content', dataItem.getAttribute('content')+" "+nextMergableSibling.getAttribute('content'));
			merged.push(nextMergableSibling);
			nextMergableSiblingIndex=nextMergableSibling.getAttribute("nextMergableSiblingIndex");			
		}
	}
	// Remove the merged nodes from leaves list
	removeNodesFromList(merged, leaves);
}

/**
 * Initialize a table with empty values
 * @param rows                  {@code number} number of table rows
 * @param cols                  {@code number} number of table columns
 * @returns table			    {@code Array} 2D array of empty values
 */
function initializeTable(rows,cols){
	var table=[];
	for(var i=0; i<rows; i++){
		table[i]=[];
		for(var j=0; j<cols; j++){
			table[i][j]="";
		}
	}
	return table;
}

/**
 * Fill the data table and the nodes table with values from baseDataItemsClusters
 * @param dataTable     	     {@code Array} an array of empty values
 * @param nodesTable     	     {@code Array} an array of empty values
 * @param baseDataItemsClusters  {@code Array} an array of arrays of nodes
 */
function fillTables(dataTable, nodesTable, baseDataItemsClusters){
	// Fill all the rows of the first column of the tow tables with the column's number
	for(var i=0; i<dataTable.length; i++){
		var recordNo=(i+1).toString()
		dataTable[i][0]=recordNo;
		nodesTable[i][0]=recordNo;
	}
	// Fill dataTable with the contents of the extracted data items, and nodesTable with the data items' nodes themselves
	for(var i=0; i<baseDataItemsClusters.length; i++){
		var col=i+1, dataItemsCluster=baseDataItemsClusters[i];
		for(var j=0; j<dataItemsCluster.length; j++){
			var dataItem=dataItemsCluster[j], row=parseInt(dataItem.getAttribute('dataRecordId'))-1, content=dataItem.getAttribute('content');
			dataTable[row][col]=content;
			nodesTable[row][col]=dataItem;
		}
	}
}

/**
 * Initializing a csv table and copy the contents of the data table into the csv table
 * @param dataTable     	    {@code Array} an array of string values
 * @param rows                  {@code number} number of table rows
 * @param cols                  {@code number} number of table columns
 * @returns csvTable            {@code Array} an array of string values
 */
function getCsvTable(dataTable, rows, cols){
	var csvTable=initializeTable(rows,cols);
	for(var i=0; i<dataTable.length; i++){
		for(var j=1; j<dataTable[0].length; j++){
			var dataItem=dataTable[i][j].slice(0,dataTable[i][j].length);
			if(dataItem.indexOf('-')==0)
				dataItem = dataItem.replace('-','');
			if(dataItem.indexOf('=')==0)
				dataItem = dataItem.replace('=','');
			// Escape comma for csv 
			dataItem = dataItem.replace(/"/g, '""');
			if(dataItem.includes(",") || dataItem.includes("\""))
				dataItem='"'+dataItem+'"';
			//dataItem = dataItem.replace(/\n/g, ' ');
			dataItem = dataItem.replace(/\r?\n|\r/g,' ');
			csvTable[i][j-1]=dataItem;
		}
	}
	return csvTable;
}

/**
 * Initialize the table cells sizes by specifying the length of each column
 * @param dataTable     	    {@code Array} an array of string values
 * @param rows                  {@code number} number of table rows
 * @param cols                  {@code number} number of table columns
 * @returns cellsSizes          {@code Array} an array of numbers
 */
function initializeCellsSize(dataTable, rows, cols){
	var cellsSizes=[];
	for(var i=0; i<cols; i++){
		// Get the length of all cells of every column
		var sizeList=[];
		for(var j=0; j<rows; j++)
			sizeList.push(dataTable[j][i].length);
		// Choose the maximum length as the column size
		cellsSizes.push(Math.max.apply(null, sizeList));	
	}
	return cellsSizes;
}

/**
 * Print the data table by converting it into one string
 * @param dataTable     	    {@code Array} an array of string values
 * @param cellsSizes            {@code number} an array of numbers
 * @returns dataTableStr        {@code String} a string representing the contents of the data table
 */
function printDataTable(dataTable,cellsSizes){
	var dataTableStr="", lineLength=0;
	for(var i=0; i<cellsSizes.length; i++){
		lineLength+=parseInt(cellsSizes[i]);
	}
	lineLength+=parseInt(dataTable[0].length);
	for(var i=0; i<dataTable.length; i++){
		var line="", row=dataTable[i];
		for(var j=0; j<row.length; j++){
			var size=parseInt(cellsSizes[j]);
			line+=row[j];
			// Fill the cell with blank items if its string length is less than the specified cell size
			if(row[j].length<size){
				var diff=parseInt(size-row[j].length);
				for(var k=1; k<=diff; k++)
					line+=' ';
			}
			line+="|";
		}
		dataTableStr+=line+"\n";
		// Add a separator between the lines
		for(var j=1; j<=lineLength; j++)
			dataTableStr+="-";
		dataTableStr+="\n";
	}
	return dataTableStr;
}

