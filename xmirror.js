'use strict';

var cp=require('child_process');
var fs=require('fs');
var http=require('http');
var page=fs.readFileSync('./index.html','utf8');
http.createServer(function(req,res){
	res.writeHead(200,{'Content-Type':'text/html'});
	res.end(page);
}).listen('3000');
console.log('server launched...');


cp.exec('echo %HOMEPATH%',function(err,path){
	console.log(path);
	var chromePath='C:\\'+path.replace(/\r\n/g,'')+'\\Local Settings\\Application Data\\Google\\Chrome\\Application\\chrome.exe';
	cp.spawn(chromePath,['-new-tab','http://localhost:3000']);
	
})
