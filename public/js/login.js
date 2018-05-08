var submit = document.getElementById('submit');

var form = document.getElementById('loginForm');

var inputs = form.getElementsByTagName('input');
var inputsNb = inputs.length-1;

var loginMsg = document.getElementById('loginMsg');








submit.addEventListener(
	'click',
	function(){
		var validForm = true;
		
		for(var n=0; n<inputsNb; n++){
			if(inputs[n].value == ""){
				inputs[n].style.backgroundColor = "rgb(210,100,100)";
				validForm = false;
				loginMsg.innerText = "Uncompleted Form";
			}
		}
		
		if(validForm){
			var user = inputs[0].value;
			var password = inputs[1].value;
			
			inputs[0].style.backgroundColor = "rgb(255,255,255)";
			inputs[1].style.backgroundColor = "rgb(255,255,255)";
			console.log('{"user":"'+user+'","password":"'+password+'"}');
			socket.emit("login",'{"user":"'+user+'","password":"'+password+'"}');
		}
		
	},
	false);
	
	
	
	socket.on('login',function(msg){
		console.log(msg);
		var data = JSON.parse(msg);
		
		for(var n=0; n<inputsNb; n++){
			inputs[n].value = "";
		}
		
		if(data['valid']){
			console.log('logged');
			loginMsg.innerText = "logged";
		}
		if(!data['valid']){
			console.log('error');
			loginMsg.innerText = "Wrong logging or password";
		}
	});
	
	socket.on('redirect',function(msg){
		console.log(msg);
		var data = JSON.parse(msg);
		
		window.location = "/";
		
	});