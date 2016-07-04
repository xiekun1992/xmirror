
ipcRenderer.send('x-setting-panel-ready');
ipcRenderer.on('x-setting-panel-list',(event,data)=>{
	console.log(data);
	let html="";
	data.files.forEach(function(o,i){
		if(o.type!=='folder'){
			html+="<article>"
					+"<div>"
						+"<img src='"+o.path+"' width='100' height='100'>"
					+"</div>"
					+"<footer>"
						+o.name
					+"</footer>"
				+"</article>";
		}else{
			html+="<article>"
					+"<header>"
						+"<i class=\"fa fa-spinner\" style='display:none;'></i>"
						+"<span class='progress-bg'>"
							+"<span class='progress-bar'></span>"
						+"</span>"
					+"</header>"
					+"<div class='w90'>"
						+"<div class='folder'>"
							+"<div class='back-cover'></div>"
							+"<div class='paper'></div>"
							+"<div class='cover'></div>"
						+"</div>"
					+"</div>"
					+"<footer>"
						+o.name
					+"</footer>"
				+"</article>";
		}
	});
	pictureSquare.innerHTML=html;
});