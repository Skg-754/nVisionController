var panels;
var panelsNb;


var ipts = document.getElementsByClassName('getVal');
var iptsNb = ipts.length;

var settings;
var log = document.getElementById('log');

socket.on('settings',function(msg){
	
	settings = JSON.parse(msg);
	console.log(msg);
	
	var mtxIpAddrIpt = document.getElementById('mtxIpAddr');
	mtxIpAddrIpt.value = settings['mtxIpAddr'];
	
	
	
	for(var n=0; n<iptsNb; n++){
		ipts[n].value = settings[ipts[n].id];
	}
	
	console.log(iptsNb);
	
	
	panelsListGenerate();
	usersListGenerate();
	 
	 log.innerText = "Settings Reloaded";
	log.style.opacity ="1";
	setTimeout(
		function(){
			log.style.opacity ="0";
		},
		5000);
	
	
});


function panelsListGenerate(){
	
	panels = settings['panels'];
	panelsNb = Object.keys(panels).length;
	var panelsList = document.getElementById('panelsList').firstElementChild.nextSibling.nextSibling;
	
	panelsList.innerHTML = "";
	
	var userPanelList = document.getElementById('userPanel');
		userPanelList.innerHTML = "";
	
	for(var n=0; n<panelsNb; n++){
		var panelKey = Object.keys(panels)[n];
		var panelName = panels[panelKey]["name"];
		console.log(panelKey);
		
		var panel = document.createElement("tr");
			panel.id = panelKey;
		var name = document.createElement("td");
		var key = document.createElement("td");
		var edit = document.createElement("td");
		var del = document.createElement("td");
		name.innerHTML = panelName;
		key.innerHTML = panelKey;
		edit.innerHTML = "edit";
		edit.className = "edit";
		del.innerHTML = "del";
		del.className = "del";
		
		panel.appendChild(key);
		panel.appendChild(name);
		panel.appendChild(edit);
		panel.appendChild(del);
		
		panelsList.appendChild(panel);
		


		del.addEventListener(
		'click',
		function(e){
			var panelId = e.currentTarget.parentNode.id;
			socket.emit('panelDel','{"panel":"'+panelId+'"}');
		},
		false);
	
		
		
		var panelOpt = document.createElement("option");
			panelOpt.value = panelKey;
			panelOpt.innerHTML = panelName;
		userPanelList.appendChild(panelOpt);
	
		
			
	}
}

function usersListGenerate(){
	
	var users = settings['users'];
	var usersNb = Object.keys(users).length;
	var usersList = document.getElementById('usersList').firstElementChild.nextSibling.nextSibling;;
	
	usersList.innerHTML = "";
	
	
	for(var n=0; n<usersNb; n++){
		var userName = Object.keys(users)[n];
		
		var user = document.createElement("tr");
			user.id = userName;
		var name = document.createElement("td");
		var password = document.createElement("td");
		var type = document.createElement("td");
		var panel = document.createElement("td");
		var edit = document.createElement("td");
		var del = document.createElement("td");
		
		name.innerHTML = userName;
		var userType = settings['users'][userName]['type'];
		type.innerHTML = userType;
		if(userType == "user"){
			var panelId = settings['users'][userName]['panel'];
			if(settings['panels'][panelId] == null){
				panel.innerHTML = "PANEL MISSING";
			}else{
				panel.innerHTML = settings['panels'][panelId]['name'];
			}
		}
		password.innerHTML = settings['users'][userName]['password'];
		edit.innerHTML = "edit";
		edit.className = "edit";
		del.innerHTML = "del";
		

		del.addEventListener(
		'click',
		function(e){
			var userId = e.currentTarget.parentNode.id;
			socket.emit('userDel','{"user":"'+userId+'"}');
		},
		false);
	

		
		
		
		del.className = "del";

		user.appendChild(name);
		user.appendChild(password);
		user.appendChild(type);
		user.appendChild(panel);
		user.appendChild(edit);
		user.appendChild(del);
		
		usersList.appendChild(user);
		
		
			
	}
}

socket.on('settingEdit',function(msg){
	console.log(msg);
		var data = JSON.parse(msg);
		var setting = data["keys"][0];
		settings['setting'] = data["value"];
		var ipt = document.getElementById(setting);
		if(ipt != "undefined"){
			ipt.value = data['value'];	
		}
	log.innerText = "Settings Edited";
	log.style.opacity ="1";
	setTimeout(
		function(){
			log.style.opacity ="0";
		},
		5000);
	
});

var apply = document.getElementById('applyMtxSettings');

apply.addEventListener(
	'click',
	function(e){
		for(var n=0; n<iptsNb; n++){
			if(settings[ipts[n].id] != ipts[n].value){
				console.log(ipts[n].id + "changed");
				settings[ipts[n].id] = ipts[n].value;
				socket.emit('settingEdit','{"keys":["'+ipts[n].id+'"],"value":"'+ipts[n].value+'"}');
			}
		}
	},
	false);
	
	
var reloadSettings = document.getElementById('reloadSettings');
reloadSettings.addEventListener(
	'click',
	function(e){
		socket.emit('reloadSettings','{}');
	},	
	false);
	
	
	
var panelAddForm = document.getElementById('panelForm');
var inputs = panelAddForm.getElementsByTagName('input');
var inputsNb = inputs.length;
var panelAddFormSubmit = document.getElementById("createPanel");
	
	panelAddFormSubmit.addEventListener(
		'click',
		function(e){
			var name = inputs[0].value;
			var mtxInputs = new Array();
			var mtxOutputs = new Array();
			for(var n=1;n<inputsNb; n++){
				if(inputs[n].checked){
					var inputName = inputs[n].getAttribute('name');
					if(inputName == "in"){
						mtxInputs.push(inputs[n].value);
					}else if(inputName == "out"){
						mtxOutputs.push(inputs[n].value);
					}
				};
			}
			var msg = '{"name":"'+name+'", "inputs":'+JSON.stringify(mtxInputs)+',"outputs":'+JSON.stringify(mtxOutputs)+'}';
			socket.emit("panelAdd",msg); 
		}, false);

	
	var usersList = document.getElementById('usersList');
	var createUserIpts = usersList.getElementsByTagName('input');
	var createUserIptsNb = createUserIpts.length;
	var userType =  document.getElementById('userType');
	var userPanel = document.getElementById('userPanel');
	var addUserBtn = document.getElementById('addUserBtn');
	
	addUserBtn.addEventListener(
		'click',
		function(e){
			var type = userType[userType.selectedIndex].value;
			var panel = userPanel[userPanel.selectedIndex].value;
			var name = createUserIpts[0].value;
			var password = createUserIpts[1].value;
			
			socket.emit('userAdd','{"name":"'+name+'","password":"'+password+'","type":"'+type+'","panel":"'+panel+'"}');
		},
		false);
	
	
	
