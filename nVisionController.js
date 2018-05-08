var dgram = require('dgram');
var http = require('http');
var express = require('express');
var fs = require("fs");
var shortid = require('shortid');
var ent = require('ent');
var session = require('express-session')({
	secret : "my-secret",
	resave : true,
	saveUninitialized : true
});
var sharedsession = require("express-socket.io-session");

var app = express();
var server = http.createServer(app);
var io = require('socket.io').listen(server);


// Matrix variables
var mtxStatusLoop = false;	
var mtxStatusLoopTimeout = 200;			
var mtxOnline = false;
var mtxIpAddr;
var mtxUdpPort = 5194;

//serverSettings
var serverIpAddr;
var serverPort;


// Settings Variables
var labels;
var settings;

// Utilities
var clientNb = 0;					
var displayLog = true;
var validSession = {};

		
		webServerStart();
		socketIoStart();
		
	

		function webServerStart(){
			
			app.use(express.static(__dirname + '/public'));
			
			app.use(session);
	
			app.get('/',function(req,res){
				
				var sessionId = req.session.id;
							
				if(validSession[sessionId]){
					switch(validSession[sessionId]['type']){
						case "user":{
							var userPanel = settings["users"][validSession[sessionId]['user']]['panel'];
							res.render('user.ejs',{'type':'user','panel':JSON.stringify(settings["panels"][userPanel])});
						}
						break;
						case "admin" :{
							res.render('admin.ejs',{'type':'admin'});
						}
						break;
					}
				}else{
					res.render('login.ejs');
				}
				
				log("/ rendered");
			});	

			app.get('/settings',function(req,res){
				
				var sessionId = req.session.id;
							
				if(validSession[sessionId]){
					switch(validSession[sessionId]['type']){
						case "user":{
							res.render('unauthorized.ejs');
						}
						break;
						case "admin" :{
							res.render('settings.ejs',{'type':'admin'});
						}
						break;
					}
				}else{
					res.render('login.ejs');
				}
				
				log("/settings rendered");
			});		
			
			settingsLoad();
			
			server.listen(8080);
			log("server ready");

		}

		function socketIoStart(){
			
			io.use(sharedsession(session, {
				autoSave:true
			})); 
			
			io.sockets.on('connection', function (socketIo) {
				
				log("Browser connected...");	
			
				socketIo.on("login",function(msg) {
				
					var data = JSON.parse(msg);
				
					log(msg);
				
					var user = ent.encode(data['user']);
					var password = ent.encode(data['password']);
					
					
					if(settings['users'][user]){
						if(settings['users'][user]["password"] == password){
							socketIo.emit("login",'{"valid":true}');
							
							socketIo.handshake.session.user = user;
							socketIo.handshake.session.save();
							
							var sessionInfo = {};
							sessionInfo['user'] = user;
							sessionInfo['type'] = settings['users'][user]["type"];
							if(sessionInfo['type'] == "user"){
								sessionInfo['panel'] = settings['users'][user]["panel"];
							}
							
													
							validSession[socketIo.handshake.session.id] = sessionInfo;
							
							clientNbUpdate();
							
							socketIo.emit('redirect','{"url":"/"}');
							
						}else{
							socketIo.emit("login",'{"valid":false}');
						}
					}else{
						socketIo.emit("login",'{"valid":false}');
					}
				});	
				
				if(validSession[socketIo.handshake.session.id]){
								
					mtxStatusLoopStart();
					settingsSend(validSession[socketIo.handshake.session.id]['type']);
					clientNbSend();
					
					socketIo.on("disconnect",function() {
						log("Browser gone.");
					});	
					
					
					if(validSession[socketIo.handshake.session.id]['type'] == "admin"){
						
						socketIo.on("settingEdit",function(msg) {
							
							var data = JSON.parse(msg);
							log(msg);
							settingsEdit(data["keys"],data["value"]);
							settingsSave();
							
							socketIoEmit("settingEdit", msg);
							
							if(data["keys"] == "mtxStatusLoopTimeout"){
							
								clearInterval(mtxStatusLoop);
								mtxStatusLoop = false;
								mtxStatusLoopStart();
								
								log("mtxStatusLoop edited");
							}
							
							
						
						});
						
						socketIo.on("reloadSettings",function(msg) {
							log("reloadSettings");
							settingsLoad();
							setTimeout(
								function(){
									settingsSend(validSession[socketIo.handshake.session.id]['type']);
								},200);
							
						});
						
						socketIo.on("panelAdd",function(msg) {
						
							var panel = JSON.parse(msg);
							log(msg);
							
							var uid = shortid.generate();
							
							settings["panels"][uid] = panel;
							settingsSave();
							settingsSend("admin");
							
						});
						
						socketIo.on("panelDel",function(msg) {
							var panel = JSON.parse(msg);
							log(msg);
							
							delete settings['panels'][panel['panel']];
							settingsSave();
							settingsSend("admin");
							
						});
						
						socketIo.on("userAdd",function(msg) {
							var user = JSON.parse(msg);
							log(msg);
							
							var newUser = {};
							
							newUser['password'] = user['password'];
							newUser['type'] = user['type'];
							newUser['panel'] = user['panel'];
							
							settings['users'][user['name']] = newUser;
							settingsSave();
							settingsSend("admin");
							
						});
						
						socketIo.on("userDel",function(msg) {
							var user = JSON.parse(msg);
							log(msg);
							
							delete settings['users'][user['user']];
							settingsSave();
							settingsSend("admin");
							
						});
						
					}
					
					socketIo.on("mtxSetRouting",function(msg) {
						var data = JSON.parse(msg);
						log(msg);
						mtxRoutingSet(data);
					});
					
					socketIo.on("logout",function(msg) {
						var data = JSON.parse(msg);
					
						log(msg);
						delete validSession[socketIo.handshake.session.id];
						
						clientNbUpdate();
					
						
						socketIo.handshake.session.destroy();
						socketIo.emit('redirect','{"url":"/"}');
						
					});
					
				}	
					
					
					
					/**
						Matrix functions
					**/

					function mtxStatusLoopStart(){
						/**
							lance la boucle de requête de statut de la grille
						**/
						if(!mtxStatusLoop){
							log('starting mtxStatusLoop...');
							mtxStatusLoop = setInterval(
								function(){	
									if(clientNb > 0){
										mtxStatusGet();
										if(!mtxOnline){
											socketIoEmit('status','{"online":false, "status":[]}');
										}else{
											mtxOnline = false;
										}
									}else{
										clearInterval(mtxStatusLoop);
										mtxStatusLoop = false;
										log('...mtxStatusLoop ended');
									}
								},
								mtxStatusLoopTimeout);
						}
						
					}
					
					function mtxStatusGet(){
						/**
							Envoie la commande de requête de statut à la grille
						**/					
						getStatusMsg = "0000000c00000011000000200000009200000002000000000000000100000010";
						mtxUdpSend(getStatusMsg);
					}

					function mtxRoutingSet(data){
						/**
							Envoie une commande de routing
						**/					
						var input = parseInt(data["input"]);	
						var hexaInput = input.toString(16);
							while(hexaInput.length < 8){
								hexaInput = '0'+hexaInput;
							}
						var outputs = data["outputs"];
						
						var outputsNb = outputs.length;
						var hexaOuputsNb = outputsNb.toString(16);
							while(hexaOuputsNb.length < 8){
								hexaOuputsNb = '0'+hexaOuputsNb;
							}	
						
						var setRoutingMsg = '0000000c00000260000000200000009000000000'+hexaOuputsNb;			

						for(var n=0; n<outputsNb; n++){
							var output = parseInt(outputs[n]);
							var hexaOutput =  output.toString(16);
								while( hexaOutput.length < 8){
									 hexaOutput = '0'+ hexaOutput;
								}
							
							setRoutingMsg += hexaInput + hexaOutput;
						}
						
						mtxUdpSend(setRoutingMsg);	
					}
					
					function mtxUdpSend(msg){
						/**
							Envoie une trame udp à la grille
						**/					
						var buffer = new Buffer(msg,'hex');
						var udpSocket = dgram.createSocket('udp4');
							udpSocket.send(buffer, 0, buffer.length, mtxUdpPort, mtxIpAddr, function(err, bytes) {
								if (err) throw err;
							});
							udpSocket.on('message', function(msg, server){
								mtxUdpRespAnalysis(msg);
								udpSocket.close();
							});
					}
					
					function mtxUdpRespAnalysis(msg){
						/**
							Analyse une trame de réponse UDP de la grille
						**/
						var data = arrayFormat(msg);
						var dataLgt = data.length;
						
						switch(data[3]){
							case "80000002" : {			// take Response
								
							}
							break;
							case "80000092" : {			// status Reponse
								
								var status = new Array;
								
								for(var n=10; n<dataLgt; n+=4){
									
									var output = new Array();
									
									var input = parseInt(data[n],16);
										output.push(input);
																	
									var inputStatus = data[n+1];
										if(inputStatus == "00000000"){
											output.push("free");
										} 
										else if(inputStatus == "00000001"){
											output.push("locked");
										}
									
									status.push(output);
									
								}
								
								mtxStatusSend(status);
							}
							break;
						}
						
						mtxOnline = true;
						
					}
					
					function mtxStatusSend(statusArray){
						/**
							Envoie un tableau formatté aux client socketIo contenant le status de la grille
						**/
						var msg = '{"online":true, "status":'+JSON.stringify(statusArray)+'}';
						
						socketIoEmit('status', msg);
						
					}
					
					
					/**
						Settings Functions
					**/
					
					function settingsSend(userType){
						/**
							Envoie les settings aux client SocketIo
						**/
						switch(userType){
							case "user" :{
								var userSettings = JSON.parse(JSON.stringify(settings));
								delete userSettings['users'];
								userSettings['panels'] = userSettings['panels'][validSession[socketIo.handshake.session.id]['panel']];
								
								socketIo.emit('settings',JSON.stringify(userSettings));
							}break;
							case "admin" :{
								socketIo.emit('settings',JSON.stringify(settings));
							}
						}
						
						
						// A CHANGER. ENVOI LOGIN DE CHAQUE USER
					}
					
					function settingsEdit(keysArray, value){
						var keyNb = keysArray.length;
						switch(keyNb){
							case 0 : settings = value;
							break;
							case 1 : settings[keysArray[0]] = value;
							break;
							case 2 : settings[keysArray[0]][keysArray[1]] = value;
							break;
							case 3 : settings[keysArray[0]][keysArray[1]][keysArray[2]] = value;
							break;
							case 4 : settings[keysArray[0]][keysArray[1]][keysArray[2]][keysArray[3]][keysArray[4]] = value;
							break;
							
						}		
						console.log("settings edited");
						
						settingsApply();
						
					}
					
					function settingsSave(){
						
						fs.writeFile('./settings.json',JSON.stringify(settings),onFileWrite);
						
						function onFileWrite(err){
							if (err) throw err;
							log("settings modifications saved");
						}
				
					}
					
					
					
					
				/**
					Utilities
				**/
				
				function socketIoEmit(key ,msg){
					socketIo.emit(key, msg);
					socketIo.broadcast.emit(key, msg);
				}	
						
				function arrayFormat(msg){
					/**
						retourne un tableau contenant chaque mot de la réponse brute de la grille
					**/
					var resp = msg.toString('hex');
							
					var wordsNb = resp.length/8;
				
					var arrayData = new Array();						//tableau contenant la réponse brute découpée en mots
					
					for(var n=0; n<wordsNb; n++){
						var word = resp.substring(0,8);
						arrayData.push(word);
						resp = resp.substring(8);
					}
					return arrayData;
				}
				
				function clientNbUpdate(){
					clientNb = Object.keys(validSession).length;
					log("clientNb :"+clientNb);
					clientNbSend();
				
				}
				function clientNbSend(){
					socketIoEmit("settingEdit",'{"keys" : ["clientNb"] , "value":"'+clientNb+'"}');
					log('{"keys" : ["clientNb"] , "value":"'+clientNb+'"}');
				}
				
			});
		}

	
	
	/**
		Settings Methods 
	**/

	function settingsLoad(){
		/**
			Lit des paramètre dans le fichier settings.json
		**/
		fs.readFile('./settings.json','utf8',onFileRead);
		
		function onFileRead(err, data){
			if (err) throw err;
			settings = JSON.parse(data);
			settingsApply();
				
		}					
	}
	
	function settingsApply(){
		/**
			Application d'une modification de settings aux variables du server
		**/
		mtxIpAddr = settings["mtxIpAddr"];
		mtxUdpPort = settings["mtxUdpPort"];
		mtxStatusLoopTimeout = settings['mtxStatusLoopTimeout'];
	}
		
	

	/**
		Utilities
	**/

	function log(pMessage){
		if(displayLog){
			console.log(pMessage);
		}
	}
	
	
	
	
























