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