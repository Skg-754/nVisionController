console.log("style.js");

var vAlign = document.getElementsByClassName('vAlign');
var vAlignNb = vAlign.length;

vMiddleApply();

function vMiddleApply(){
	
	for(var n=0; n<vAlignNb; n++){
		vAlign[n].style="null";
		vAlign[n].style.height = vAlign[n].offsetHeight+'px';
		console.log(vAlign[n].offsetHeight+'px');
		vAlign[n].style.lineHeight = vAlign[n].offsetHeight+'px';
		vAlign[n].firstElementChild.style.lineHeight = "normal"
	}
}




window.onresize = function(){
	console.log("resize!");
	vMiddleApply();
}