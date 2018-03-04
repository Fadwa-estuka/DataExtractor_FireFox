NodeCompare = function(){
	
	this.ELEMENT_NODE=1;
	this.ATTRIBUTE_NODE=2;
	this.TEXT_NODE=3;
	this.CDATA_SECTION_NODE=4;
	this.ENTITY_REFERENCE_NODE=5;
	this.ENTITY_NODE=6;
	this.PROCESSING_INSTRUCTION_NODE=7;
	this.COMMENT_NODE=8;
	this.DOCUMENT_NODE=9;
	this.DOCUMENT_TYPE_NODE=10;
	this.DOCUMENT_FRAGMENT_NODE=11;
	this.NOTATION_NODE=12;
	
	this.attributes=[
	        "left", 
            "top", 
            "right", 
            "bottom", 
            "css_background-color", 
            "css_background-image", 
            "css_border-bottom-color", 
            "css_border-bottom-style", 
            "css_border-bottom-width", 
            "css_border-left-color", 
            "css_border-left-style", 
            "css_border-left-width", 
            "css_border-right-color", 
            "css_border-right-style", 
            "css_border-right-width", 
            "css_border-top-color", 
            "css_border-top-style", 
            "css_border-top-width", 
            "css_outline-color", 
            "css_outline-style", 
            "css_outline-width", 
            "css_border-bottom-left-radius", 
            "css_border-bottom-right-radius", 
            "css_border-top-left-radius", 
            "css_border-top-right-radius", 
            "css_box-shadow", 
            "css_direction", 
            "css_letter-spacing", 
            "css_line-height", 
            "css_text-align", 
            "css_text-decoration", 
            "css_text-indent", 
            "css_text-transform", 
            "css_vertical-align", 
            "css_white-space", 
            "css_word-spacing", 
            "css_text-overflow", 
            "css_text-shadow", 
            "css_word-break", 
            "css_word-wrap", 
            "css_-moz-column-count", 
            "css_-moz-column-gap", 
            "css_-moz-column-rule-color", 
            "css_-moz-column-rule-style", 
            "css_-moz-column-rule-width", 
            "css_-moz-column-width", 
            "css_list-style-image", 
            "css_list-style-position", 
            "css_list-style-type", 
            "css_font-family", 
            "css_font-size", 
            "css_font-weight", 
            "css_font-size-adjust", 
            "css_font-style", 
            "css_font-variant", 
            "css_color", 
            "css_position"
	];
	
	this.Compare = function(controlNode, testNode, type){
		if (controlNode.nodeType != this.ELEMENT_NODE && testNode.nodeType != this.ELEMENT_NODE)
            return 1;       // 1 means same
        if (controlNode.nodeType != this.ELEMENT_NODE || testNode.nodeType != this.ELEMENT_NODE)
            return 0;		// 0 means different
		//assert controlNode.getNodeType() == Node.ELEMENT_NODE && testNode.getNodeType() == Node.ELEMENT_NODE;
		
        var re = 0;
		
		// 'Complete': all of the attributes must be matched. 'Partial': 75% of attributes must be matched
		if(type==='partial'){
			for(var i=0; i<this.attributes.length; i++){
				var value1 = controlNode.getAttribute(this.attributes[i]), value2 = testNode.getAttribute(this.attributes[i]);
				if (value1.toUpperCase() === value2.toUpperCase())
					re ++;
			} 
			return (re > (0.75 * this.attributes.length)) ? 1 : 0;
		}else{
			for(var i=4; i<this.attributes.length; i++){
				var value1 = controlNode.getAttribute(this.attributes[i]), value2 = testNode.getAttribute(this.attributes[i]);
				if (value1.toUpperCase() === value2.toUpperCase())
					re ++;
			} 
			return (re === this.attributes.length-4) ? 1 : 0;
		}
        
	};
};