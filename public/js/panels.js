var panelsBtn = document.getElementsByClassName("panelBtn");
var panelsBtnNb = panelsBtn.length;	

var selectedOutput = null;
var	selectedInput = null;

var outputBtn = document.getElementsByClassName('out');
var outputBtnNb = outputBtn.length;

var settings;

var panel = document.getElementById('panel');
var panelIptBtn = panel.firstElementChild.getElementsByClassName('panelBtn');
var panelIptBtnNb = panelIptBtn.length;

var panelOptBtn = panel.firstElementChild.nextSibling.nextSibling.getElementsByClassName('panelBtn');
var panelOptBtnNb = panelOptBtn.length;


if(outputBtnNb ==1){
	selectedOutput = outputBtn[0].firstElementChild.getAttribute('name');
}
selectedOutput = outputBtn[0].firstElementChild.getAttribute('name');
outputBtn[0].style.backgroundColor = 'rgb(200,0,0)';


for(var n=0; n<panelsBtnNb; n++){
	panelsBtn[n].addEventListener(
		'click',
		function(e){
			var type = e.currentTarget.getAttribute("name");
			var number = e.currentTarget.firstElementChild.getAttribute("name");
			
			switch(type){
				case "in" :{
					socket.emit('mtxSetRouting','{"input":"'+number+'","outputs":['+selectedOutput+']}');	
				}
				break;
				case "out" :{
					if(outputBtnNb>1){
						var prvOutput = document.getElementById("out"+selectedOutput);
							prvOutput.style = "null";
						selectedOutput = number;
						e.currentTarget.style.backgroundColor = 'red';
					}else{
						
					}
					
				}
				break;
			}
		},	
		false);
}

socket.on('settings', function(msg){

	settings = JSON.parse(msg);
	labelUpdate();
	
	
});

socket.on('settingEdit', function(msg){
	
	var setting = JSON.parse(msg);
	console.log(msg);
	
	
	
	
	
});


function labelUpdate(){
	
	var iptsLabel = settings['defaultLabels']['inputs'];
	var optsLabel = settings['defaultLabels']['outputs'];
	
	for(var n=0;n<panelIptBtnNb;n++){
		panelIptBtn[n].firstElementChild.innerHTML = iptsLabel[panelIptBtn[n].firstElementChild.getAttribute('name')];
	}
	for(var n=0;n<panelOptBtnNb;n++){
		panelOptBtn[n].firstElementChild.innerHTML = optsLabel[panelOptBtn[n].firstElementChild.getAttribute('name')];
	}
	
}

socket.on('status', function(msg){

	var status = JSON.parse(msg);

	
	var routedInput = status["status"][parseInt(selectedOutput)-1][0];
	var prvBtn = document.getElementById('in'+selectedInput);
		if(prvBtn){
			prvBtn.style = 'null';
		}
	selectedInput = routedInput;
	var btn = document.getElementById('in'+routedInput);
		if(btn){
			btn.style.backgroundColor = 'rgb(80,150,0)';
		}
	
});
		