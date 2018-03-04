Traversal = function(RootNode){
	
	this.nodeQueue = [];
	this.levelQueue = [];
	this.RootNode=RootNode;
	this.level=0;
	
	// Preorder traversal
	this.preorder = function(node){
		var change=false;
		this.nodeQueue.push(node);
		this.levelQueue.push(this.level);
		if(node.firstChild != null){
			this.level++;
			change=true;
			this.preorder(node.firstChild);
		}
		if(node!=this.RootNode && node.nextSibling != null){
			if(change){
			  this.level--;
			  change=false;
		    }
			this.preorder(node.nextSibling);
		}
	};
	
	// Postorder traversal
	this.postorder = function(node){
		var change=false;
		if(node.firstChild != null){
			this.level++;
			change=true;
			this.postorder(node.firstChild);	
		}
		if(change){
			this.level--;
			change=false;
		}
		this.nodeQueue.push(node);
		this.levelQueue.push(this.level);
		if(node!=this.RootNode && node.nextSibling != null){
			this.postorder(node.nextSibling);
		}
	};
};
