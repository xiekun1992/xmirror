
ipcRenderer.send('x-setting-panel-ready');
ipcRenderer.on('x-setting-panel-list',(event,data)=>{
	console.log(data);
	let html="";
	data.files.forEach(function(o,i){
		if(o.type!=='folder'){
			html+="<article>"
					+"<header>"
						+"<i class=\"fa fa-spinner\" style='display:none;'></i>"
						+"<span class='progress-bg'>"
							+"<span class='progress-bar'></span>"
						+"</span>"
					+"</header>"
					+"<div style='width:90px;'>"
						+"<img src='"+o.path+"' onload='scaleImg(this)' ondragstart='return false;'>"
					+"</div>"
					+"<footer title='"+o.name+"'>"
						+o.name
					+"</footer>"
				+"</article>";
		}else{
			html+="<article ondblclick='openFolder(\""+o.path.replace(/\\/g,'\\\\')+"\")'>"
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
					+"<footer title='"+o.name+"'>"
						+o.name
					+"</footer>"
				+"</article>";
		}
	});
	pictureSquare.innerHTML=html;
});

// 判断图片宽高比例来缩放图片
var scale=9/7;//width/height
function scaleImg(self){
	// console.log(self.width);
	// console.log(self.height);
	if(self.width/self.height>scale){
		self.style.width='100%';
		self.style.height='auto';
	}else{
		self.style.height='70px';
		self.style.width='auto';
	}
}

function openFolder(path){
	console.log(path)
	ipcRenderer.send('x-setting-panel-open-folder',{path:path});
	ipcRenderer.on('x-setting-panel-enter-folder',(event,data)=>{

	});
}