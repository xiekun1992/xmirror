var htmlBody=document.querySelector('body');
ipcRenderer.send('x-setting-panel-ready');
ipcRenderer.on('x-resize',(event,data)=>{
	console.log(data.size);
	htmlBody.style.height=data.size[1]+'px';
	document.querySelector('#pictureSquare').style.height=data.size[1]-123+'px';
});
ipcRenderer.on('x-setting-panel-list',(event,data)=>{
	console.log(data);
	let navs=data.nav.split('\\').slice(1);
	let a="";
	for(let n of navs){
		a+="<a onclick='openFolder(\""+(data.nav.substring(0,data.nav.indexOf(n))+n).replace(/\\/g,'\\\\')+"\")'>"+n+"</a>";
	}
	navbar.innerHTML=a;
	let html="";
	data.files.forEach(function(o,i){
		if(o.type!=='folder'){
			html+="<article onmousedown='showMenu(event,\""+o.path.replace(/\\/g,'\\\\')+"\")' ondblclick='openFileFn(\""+o.path.replace(/\\/g,'\\\\')+"\")'>"
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
// 双击打开文件夹
function openFolder(path){
	// console.log(path)
	ipcRenderer.send('x-setting-panel-open-folder',{path:path});
}
// 右键菜单
let targetElement;//保存待操作的图片路径
function showMenu(event,link){
	let articles=document.querySelectorAll('#pictureSquare article');
	for(let e in articles){
		articles[e].classList && articles[e].classList.remove('active');
	}
 	console.log(event);
 	if(event.button==2){
 		targetElement=link;
 		let path=event.path;
 		for(let e in path){
 			if(path[e].nodeName.toLowerCase()=='article'){
 				path[e].classList.add('active');
 				break;
 			}
 		}
 		// 菜单位置靠左边
 		if(window.document.body.clientWidth-event.pageX<=110){
 			rightMenu.style.left=event.pageX-108-10+'px';
 		}else{
 			rightMenu.style.left=event.pageX+10+'px';
 		}
 		// 菜单位上边置靠
 		if(window.document.body.clientHeight-event.pageY<=170){
 			rightMenu.style.top=event.pageY-162-10+'px';
 		}else{
 			rightMenu.style.top=event.pageY+10+'px';
 		}
 		rightMenu.style.display='block';
 		// rightMenu.addAttribute('index','-1');
 		pictureSquare.onmousewheel=function(){
 			return false;
 		};
 	}else{
 		targetElement=null;
 		// rightMenu.removeAttribute('index');
 		pictureSquare.onmousewheel=function(){
 			return true;
 		};
 		rightMenu.style.display='none';
 	}
}
// 右键菜单
const openFileFn=()=>{

};
const uploadFn=()=>{

};
const openFilePositionFn=()=>{
	if(targetElement){
		// alert(targetElement)
		ipcRenderer.send('x-menu-showiteminfolder',targetElement);
		rightMenu.style.display='none';
	}
};
