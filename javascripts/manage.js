
ipcRenderer.send('x-setting-panel-ready');
ipcRenderer.on('x-setting-panel-list',(event,data)=>{
	console.log(data);
	let html="";
	data.files.forEach(function(o,i){
		if(o.type!=='folder'){
			html+="<article>"
					+"<p>"
						+"<img src='"+o.path+"' width='100' height='100'>"
					+"</p>"
					+"<footer>"
						+o.name
					+"</footer>"
				+"</article>";
		}else{
			html+="<article>"
					+"<p>"
						+"<i class=\"fa fa-folder-o\" style=\"font-size:100px;\" ></i>"
					+"</p>"
					+"<footer>"
						+o.name
					+"</footer>"
				+"</article>";
		}
	});
	pictureSquare.innerHTML=html;
});