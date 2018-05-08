		
	var input = null;
	var outputs = new Array();
		
	/**
		Getting the btns
	**/
	var panelBtn = document.getElementsByClassName('panelBtn');
	var panelBtnNb = panelBtn.length;

	var takeCmdSend = 0;
	var prvStatus = new Array();
	var crtStatus = new Array();
	
	var onlineCookie = document.createElement('canvas');
		onlineCookie.id =n;
		onlineCookie.width = "14";
		onlineCookie.height = "14";
	
	for(var n=0; n<panelBtnNb; n++){
		
		panelBtn[n].addEventListener(
			'click',
			function(e){
				
				var btn = e.currentTarget;
			
				var btnId = btn.firstElementChild.getAttribute('name');
				var line = btn.getAttribute('name');
				var col = btn.parentNode.getAttribute('name');
				
				switch(line){
					
					case "in" : {
						if(input){
							if(input == btnId){
								btn.style.backgroundColor = "green";
								input = null;
							}else{
								var prv = document.getElementById('in'+input);
								prv.style.backgroundColor = 'green';
								btn.style.backgroundColor = "rgb(0,70,0)";
								input = btnId;
							}
						}else{
							btn.style.backgroundColor = "rgb(0,70,0)";
							input = btnId;
							
						}
					
					}
					break;
					case "out" : {
						var idx = outputs.indexOf(btnId);
						
						if(idx > -1){
							outputs.splice(idx,1);
							btn.style.backgroundColor = "red";
						}else{
							outputs.push(btnId);
							btn.style.backgroundColor = "rgb(100,0,0)";
						}
					
					}
					break;
					
				}
				
			},
			false);	
	}
			
	/**
	var takeBtn = document.getElementById('take');
		takeBtn.addEventListener(
			'click',
			function(e){
				if(input){
					
					socket.emit('routing','{"input":"'+input+'","outputs":'+JSON.stringify(outputs)+'}');		
					takeCmdSend = outputs.length;
				}
			},
			false);
	**/
			
			
	var mtxBtn = document.getElementsByClassName('mtxBtn');
	var mtxBtnNb = mtxBtn.length;
	
	for(var n=0; n<mtxBtnNb; n++){
		mtxBtn[n].addEventListener(
			'click',
			function(e){
				var line = e.currentTarget.parentNode.getAttribute('name');
				var col = e.currentTarget.getAttribute('name');
				socket.emit('mtxSetRouting','{"input":"'+col+'","outputs":['+line+']}');	
			},
			false);
		mtxBtn[n].addEventListener(
			'mouseover',
			function(e){
				var line = e.currentTarget.parentNode.getAttribute('name');
				var col = e.currentTarget.getAttribute('name');
				
				var iLabel = document.getElementById("labelI"+col);
					iLabel.style.backgroundColor = "rgb(210,210,210)";
					iLabel.style.color = "rgb(30,30,30)";
				var oLabel = document.getElementById("labelO"+line);
					oLabel.style.backgroundColor = "rgb(210,210,210)"
					oLabel.style.color = "rgb(30,30,30)"
				},
			false);
		mtxBtn[n].addEventListener(
			'mouseout',
			function(e){
				var line = e.currentTarget.parentNode.getAttribute('name');
				var col = e.currentTarget.getAttribute('name');
				
				var iLabel = document.getElementById("labelI"+col);
					iLabel.style = "null";
				var oLabel = document.getElementById("labelO"+line);
					oLabel.style = "null"
				},
			false);
	}
			
	socket.on('routingResp',function(msg){
		var data = JSON.parse(msg);
	
		/**
			Si tous les takes envoyés ont été effectués
		**/
		if(takeCmdSend == data['takeNb']){
			
			/**
				Actualisation de l'interface
			**/
			var ip = document.getElementById('in'+input);
			ip.style = null;
			
			var outputsNb = outputs.length;
			
			for(var n=0; n<outputsNb; n++){
				var op = document.getElementById('out'+outputs[n]);
				op.style = null;
			}
			
			/**
				Remise à zéro des compteurs
			**/
			input = null;
			outputs = new Array();
		}
	});	
	
	socket.on('status',function(msg){
		
	
		
		prvStatus = crtStatus;
		crtStatus = new Array();
		prvStatusLgt = prvStatus.length;
		
		
		var data = JSON.parse(msg);
		var mtxOnline = data['online'];
		var status = data['status'];
		var online = document.getElementById('online');
		
		if(mtxOnline){
			
			var ctx = onlineCookie.getContext('2d');
				ctx.clearRect(0,0,20,20);
				ctx.beginPath();
				ctx.fillStyle = "green";
				ctx.arc(7,7,7,0,Math.PI*2);
				ctx.fill();
				ctx.closePath();
			online.appendChild(onlineCookie);
		
			//2D array : 1st column = ipNumber, 2ns colum = opStatus
			var statusLgt = status.length;
		
			
			for(var n=1;n<=statusLgt;n++){
				var cel = document.getElementById("mtxO"+n+"I"+status[n-1][0]);
				
				cel.style.backgroundColor = "rgb(100,100,100)";
				
				if(prvStatusLgt>0){
					if(prvStatus[n-1] != "mtxO"+n+"I"+status[n-1][0]){
					var prv = document.getElementById(prvStatus[n-1]);
				
					prv.style = "null";
					}
				}
				
				crtStatus.push("mtxO"+n+"I"+status[n-1][0]);
				
				if(status[n-1][1] == "free" && cel.parentNode.firstElementChild.getAttribute('name') != "free"){
					cel.parentNode.firstElementChild.innerHTML = "<img src = 'ressources/pictures/unlocked.png'/>";
					cel.parentNode.firstElementChild.setAttribute('name','free');
				}else if(status[n-1][1] == "locked" && cel.parentNode.firstElementChild.getAttribute('name') != "locked"){
					cel.parentNode.firstElementChild.innerHTML = "<img src = 'ressources/pictures/locked.png'/>";
					cel.parentNode.firstElementChild.setAttribute('name', 'locked');
				}
				
			}
		}else{
			
			var ctx = onlineCookie.getContext('2d');
				ctx.clearRect(0,0,20,20);
				ctx.beginPath();
				ctx.fillStyle = "red";
				ctx.arc(7,7,7,0,Math.PI*2);
				ctx.fill();
				ctx.closePath();
			online.appendChild(onlineCookie);		
		}
		
	

	});
	
	socket.on('settingEdit',function(msg){
	
		console.log(msg);
		var data = JSON.parse(msg);
		var setting = data["keys"][0];
		
		switch(setting){
			case "defaultLabels" :{
				
				var labelNb = data["keys"][2];
				var labelCtId = "label";
				if(data["keys"][1] == "inputs"){
					labelCtId += "I";
				}else if(data["keys"][1] == "outputs"){
					labelCtId += "O";
				}	
				labelCtId += labelNb;
				
				var labelCt = document.getElementById(labelCtId);
				console.log(labelCt);
				labelCt.innerHTML = data["value"];
				
			}
			break;
			case "mtxIpAddr" :{
				
				var mtxIpAddrCt = document.getElementById('ipAddr');
				mtxIpAddrCt.firstElementChild.innerHTML = data["value"];
				
			}
			break;
			case "clientNb" :{
				
				var clientNbCt = document.getElementById('clientNb');
				clientNbCt.firstElementChild.innerHTML = data["value"];
				
			}
			break;
			
		}
		console.log();
		
		
	
	});
	
	socket.on('settings',function(msg){
		
		var settings = JSON.parse(msg);
		
		var ipAddrCt = document.getElementById('ipAddr');
			ipAddrCt.firstElementChild.innerHTML = settings['mtxIpAddr'];
		

		var vLabels = document.getElementsByClassName("vLabel");
		var vLabelsNb = vLabels.length;
		var hLabels = document.getElementsByClassName("hLabel");
		var hLabelsNb = hLabels.length;
		
		for(var n=0; n<vLabelsNb; n++){
			vLabels[n].firstElementChild.innerHTML = settings["defaultLabels"]["outputs"][n+1];
		}
		for(var n=0; n<hLabelsNb; n++){
			hLabels[n].firstElementChild.innerHTML = settings["defaultLabels"]["inputs"][n+1];
		}
		
		
	

		
		
		  
		
	});
	
	
	
	var labels = document.getElementsByClassName('label');
	var labelsNb = labels.length;
	var labelBuffer;
	
	for(var n=0; n<labelsNb; n++){
		labels[n].addEventListener(
			'focus',
			function(e){
				labelBuffer = e.currentTarget.innerHTML
			},
			false);
		labels[n].addEventListener(
			'blur',
			function(e){
				if(labelBuffer != e.currentTarget.innerHTML){
					var nb = e.currentTarget.getAttribute('name');
					var type = e.currentTarget.parentNode.getAttribute('name');
					socket.emit('settingEdit','{"keys":["defaultLabels","'+type+'","'+nb+'"],"value":"'+e.currentTarget.innerHTML+'"}');
				}
			},
			false);
	}
	
	
	var mtxIpAddrCt = document.getElementById('ipAddr').firstElementChild;
	var mtxIpAddrBuffer;
	
	mtxIpAddrCt.addEventListener(
		'focus',
		function(e){
			mtxIpAddrBuffer = e.currentTarget.innerText;
		},
		false);
	mtxIpAddrCt.addEventListener(
		'blur',
		function(e){
			var value = e.currentTarget.innerText;
			value = value.replace(/\s+/g, '');
			if(mtxIpAddrBuffer != value){
				socket.emit("settingEdit",'{"keys":["mtxIpAddr"],"value":"'+value+'"}');
			}
		},
		false);
		
		


		var logout = document.getElementById('logout');
		
		logout.addEventListener(
			'click',
			function(){
				console.log('logout');
				socket.emit('logout','{}');
			},
			false);
			
		socket.on('redirect',function(msg){
			console.log(msg);
			var data = JSON.parse(msg);
			
			window.location = "/";
		
		});