var Mapping = function() {
	
  this.controlSubtreeWeight=0;
  this.testSubtreeWeight=0;
  this.controlSubtree=[];
  this.testSubtree=[];
  this.toString = function() {
        var str='';
		str+='SubtreeWeight_CT('+this.controlSubtreeWeight+' - '+this.testSubtreeWeight+') ';
        var strControl='';
		for(var i=0; i<this.controlSubtree.length; i++) { 
           strControl+=this.controlSubtree[i].toString();
           strControl+='  ';
		}
        var strTest='';
		for(var i=0; i<this.testSubtree.length; i++) { 
           strTest+=this.testSubtree[i].toString();
           strTest+='  ';
		}
        str+='Subtree_CT(controlSubtree size '+this.controlSubtree.length+': '+strControl+'--  testSubtree size '+this.testSubtree.length+': '+strTest+')';
        return str;
  };
};

var controlNodeList=[], testNodeList=[], controlNodeLevel=[], testNodeLevel=[];
// coefficients
var alfa=2; //to amplify the worth of larger subtrees//1~inf
var beta=0.5; // 0~1, to reduce the worth of subtrees with different structural position (level), or low level

/**
 * Get the similarity normalized between two trees
 * @param controlNode     	    the root node of the first tree
 * @param testNode              the root node of the second tree
 * @returns score               {@code number} the normalized similarity value 0~1
 */
function getSimilarityNormalized(controlNode, testNode){
	var score=getSimilarity(controlNode, testNode);
	// normalization
	score=score/Math.max(controlNodeList.length, testNodeList.length);
    score=score/2;
	return score;
}

/**
 * Get the similarity between two trees
 * @param controlNode     	    the root node of the first tree
 * @param testNode              the root node of the second tree
 * @returns score               {@code number} the similarity value 
 */
function getSimilarity(controlNode, testNode){
	var mappingMatrix = getMappings(controlNode, testNode);
	var controlNodesLargestMapping = getControlNodesLargestMapping(mappingMatrix);
    var testNodesLargestMapping = getTestNodesLargestMapping(mappingMatrix);
	fillSubtreeWeightsInMappings(mappingMatrix, controlNodesLargestMapping, testNodesLargestMapping);
	var score = analyseMappings(mappingMatrix);
	return score;
}

/**
 * Get the mapping matrix between two trees
 * @param controlNode     	    the root node of the first tree
 * @param testNode              the root node of the second tree
 * @returns mappingMatrix       {@code Array} an array of arrays of mappings
 */
function getMappings(controlNode, testNode){
	
	var nodeCompare = new NodeCompare();
	var controlTraverse = new Traversal(controlNode);
    var testTraverse = new Traversal(testNode);
	controlTraverse.postorder(controlNode);
    controlNodeList=controlTraverse.nodeQueue;
	controlNodeLevel=controlTraverse.levelQueue;
	testTraverse.postorder(testNode);
    testNodeList=testTraverse.nodeQueue;
	testNodeLevel=testTraverse.levelQueue;
	var mappingMatrix=[];
	
	for(var c=0; c<controlNodeList.length; c++){ 
		var mappingMatrixRow=[];	
        for(var t=0; t<testNodeList.length; t++){
			var compareTemp = nodeCompare.Compare(controlNodeList[c], testNodeList[t], 'partial');
			//console.log(controlNodeList[c].getAttribute('node_name')+"   &   "+testNodeList[t].getAttribute('node_name')+"  =  "+compareTemp);
			if(compareTemp!=0){
				var newMapping = new Mapping();
				newMapping.controlSubtree.push(c);
				newMapping.testSubtree.push(t);
				mappingMatrixRow.push(newMapping);
                //if(controlNodeList[c].hasChildNodes() && testNodeList[t].hasChildNodes()){
                    //mappingMatrixUpdate(c,  t, mappingMatrix);
				//}
            }
            else{
                mappingMatrixRow.push(null);
            }
		}
		mappingMatrix.push(mappingMatrixRow);
	}
	for(var c=0; c<controlNodeList.length; c++){ 
		for(var t=0; t<testNodeList.length; t++){
			if(controlNodeList[c].hasChildNodes() && testNodeList[t].hasChildNodes())
                mappingMatrixUpdate(c,  t, mappingMatrix);
		}
	}
	return mappingMatrix;
}

/**
 * Get the control nodes largest mappings
 * @param mappingMatrix          {@code Array} an array of arrays of mappings
 * @returns nodesLargestMapping  {@code Array} an array of mappings
 */
function getControlNodesLargestMapping(mappingMatrix){
    var nodesLargestMapping=[];
	for(var c=0;c<controlNodeList.length;c++){
		nodesLargestMapping.push(null);	
	}
	// go through all the mappings and all the nodes in each mapping
    for(var c=0; c<controlNodeList.length; c++){            
        for(var t=0; t<testNodeList.length; t++){
            if(mappingMatrix[c][t]==null)
                continue;
			for(nodeIndex in mappingMatrix[c][t].controlSubtree){
				if(nodesLargestMapping[nodeIndex]==null)
					nodesLargestMapping[nodeIndex]=mappingMatrix[c][t];
				else if(nodesLargestMapping[nodeIndex].controlSubtree.length <= mappingMatrix[c][t].controlSubtree.length)
						nodesLargestMapping[nodeIndex]=mappingMatrix[c][t];
			}
        }
    }
    return nodesLargestMapping; 
}

/**
 * Get the test nodes largest mappings
 * @param mappingMatrix          {@code Array} an array of arrays of mappings
 * @returns nodesLargestMapping  {@code Array} an array of mappings
 */
function getTestNodesLargestMapping(mappingMatrix){
    var nodesLargestMapping=[];
	for(var c=0;c<testNodeList.length;c++){
		nodesLargestMapping.push(null);	
	}
	// go through all the mappings and all the nodes in each mapping	
    for(var c=0; c<controlNodeList.length; c++){            
        for(var t=0; t<testNodeList.length; t++){
            if(mappingMatrix[c][t]==null)
                continue;
            for(nodeIndex in mappingMatrix[c][t].testSubtree){
                if(nodesLargestMapping[nodeIndex]==null)
                    nodesLargestMapping[nodeIndex]=mappingMatrix[c][t];
                else if(nodesLargestMapping[nodeIndex].testSubtree.length <= mappingMatrix[c][t].testSubtree.length)
                        nodesLargestMapping[nodeIndex]=mappingMatrix[c][t];
            }
        }
    }
    return nodesLargestMapping; 
}

/**
 * Fill the control subtree and test subtree weights of the mappings
 * @param controlNodesLargestMapping  {@code Array} an array of mappings
 * @param testNodesLargestMapping     {@code Array} an array of mappings
 */
function fillSubtreeWeightsInMappings(mappingMatrix, controlNodesLargestMapping, testNodesLargestMapping){
    for(var i=0; i<controlNodesLargestMapping.length; i++){
        if(controlNodesLargestMapping[i]!=null)
            controlNodesLargestMapping[i].controlSubtreeWeight++;
    }
    for(var i=0; i<testNodesLargestMapping.length; i++){
        if(testNodesLargestMapping[i]!=null)
            testNodesLargestMapping[i].testSubtreeWeight++;
    }
}

/**
 * Analyse the mapping matrix and calculate the similarity score
 * @param mappingMatrix     	{@code Array} an array of arrays of mappings
 * @returns similarityScore     {@code number} the similarity value 
 */
function analyseMappings(mappingMatrix){
	// coefficients
    var gamma, gamma0=1; //gamma0 is a coefficiant used to calc gamma, gamma reduce the worth of mapping with high level
	//result
    var similarityScore=0;
    //tree depth measure
	var controlDepth = Math.max.apply(null,controlNodeLevel);
	var testDepth = Math.max.apply(null,testNodeLevel);

	for(var c=0; c<controlNodeList.length; c++){
        for(var t=0; t<testNodeList.length; t++){
            if(mappingMatrix[c][t]!=null){
                //var mappingWeight = (mappingMatrix[c][t].controlSubtreeWeight + mappingMatrix[c][t].testSubtreeWeight)/2.0;
                var mappingWeight = mappingMatrix[c][t].controlSubtreeWeight + mappingMatrix[c][t].testSubtreeWeight; 				
                    mappingWeight = Math.pow(mappingWeight, alfa);
                    //beta if required
                    if(controlNodeLevel[c] != testNodeLevel[t]){
                        mappingWeight*=beta;
                    }
                    /*//gamma if required
                    double controlGamma=gamma0+(1-gamma0)*(1-controlNodeLevel.get(c).doubleValue()/controlDepth);
                    double testGamma=gamma0+(1-gamma0)*(1-testNodeLevel.get(t).doubleValue()/testDepth);
                    gamma=Math.max(controlGamma, testGamma);
                    mappingWeight*=gamma;*/
                    similarityScore+=mappingWeight;
            }
        }
    }
	similarityScore = Math.pow(similarityScore, 1/alfa);
    return similarityScore;
}

/**
 * Update the mapping matrix
 * @param cnodeId     	        {@code number} id of the control node
 * @param tnodeId     	        {@code number} id of the test node
 * @param mappingMatrix     	{@code Array} an array of arrays of mappings
 */
function mappingMatrixUpdate(cnodeId, tnodeId, mappingMatrix){
	var cnode=controlNodeList[cnodeId];
    var tnode=testNodeList[tnodeId];
    var mapping=mappingMatrix[cnodeId][tnodeId];
	var controlChildList = cnode.childNodes;
    var m = controlChildList.length;
    var testChildList = tnode.childNodes;
    var n = testChildList.length;
	var MAT = []; //MAT Score
    var MATA = []; //MAT Score Accumulative
	
	for (var i=0; i<=m; i++) {
		var MatRow=[];	
		var MataRow=[];
        for (var j=0; j<=n; j++){
			MatRow.push(0);
			MataRow.push(0);
		}
		MAT.push(MatRow);
		MATA.push(MataRow);
	}
	
	for (var i=1; i<=m; i++) {
        for (var j=1; j<=n; j++){
            var c = controlNodeList.indexOf(controlChildList.item(i-1));
            var t = testNodeList.indexOf(testChildList.item(j-1));
            if(mappingMatrix[c][t]==null)
                MAT[i][j]=0;
            else
                MAT[i][j]=mappingMatrix[c][t].controlSubtree.length; //or testSubtree.size(), has same size  
            MATA[i][j] = Math.max(MATA[i][j-1], MATA[i-1][j]);
            MATA[i][j] = Math.max(MATA[i][j], MATA[i-1][j-1] + MAT[i][j]);			
        }
    }
	
	var i=m;
    var j=n;
	
	while(i>0 && j>0){
        if(MATA[i][j]==MATA[i-1][j-1] + MAT[i][j]){
            var c=controlNodeList.indexOf(controlChildList.item(i-1));
            var t=testNodeList.indexOf(testChildList.item(j-1));
                if(MAT[i][j]>0){
                    for(var x=0; x<mappingMatrix[c][t].controlSubtree.length; x++){
						if(mapping!=null && mappingMatrix[c][t]!=null)
						   mapping.controlSubtree.push(mappingMatrix[c][t].controlSubtree[x]);
					}
                    for(var x=0; x<mappingMatrix[c][t].testSubtree.length; x++){
						if(mapping!=null && mappingMatrix[c][t]!=null)
						   mapping.testSubtree.push(mappingMatrix[c][t].testSubtree[x]);
					}
                }
                i--;
                j--;
        }
        else 
			if(MATA[i][j]==MATA[i][j-1]){
                j--;
            }   
            else{
                 i--;
            }   
    }
}
