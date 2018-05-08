var url = window.location.href;
url = url.replace("http://","");
url = url.split("/");


var socket = io.connect(url[0]);