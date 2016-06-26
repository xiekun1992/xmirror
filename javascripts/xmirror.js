const ipcRenderer=require('electron').ipcRenderer;
const {desktopCapturer}=require('electron');

function closeWin(){
	ipcRenderer.send('x-close-window');
}
function minWin(){
	ipcRenderer.send('x-min-window');
}
function maxWin(){
	ipcRenderer.send('x-max-window');
}
function openDialog(){
	ipcRenderer.send('x-open-dialog');
}

// 点击按钮导入图片
ipcRenderer.on('x-open-dialog-imgpath',(e,data)=>{
	warningMention.init(data.path);
});

// 拖拽导入图片
const holder=document.getElementsByTagName('body')[0];
// 设置body高度防止第一次拖拽打开图片失败
holder.style.height=window.screen.availHeight+'px';

holder.ondragover=holder.ondragenter=(e)=>{
	e.preventDefault();
	return false;
};
holder.ondragleave=()=>{
	return false;
};
holder.ondrop=(e)=>{
	e.preventDefault();
	const file=e.dataTransfer.files[0];
	warningMention.init(file.path);
	return false;
};

// 截屏导入图片
function screenCapture(e){
	e.preventDefault();
	e.stopPropagation();
	ipcRenderer.send('x-screen-capture');
	ipcRenderer.once('x-screen-capture-initialized',()=>{
		desktopCapturer.getSources({types:['screen','window'],thumbnailSize:{width:window.screen.width,height:window.screen.height}},(error,sources)=>{
			if(error) throw error;
			console.log(sources)
			for(let i=0;i<sources.length;i++){
				if(sources[i].name.toLowerCase()==='entire screen'){
					// warningMention.init(sources[i].thumbnail.toDataURL());
					ipcRenderer.send('x-screen-capture-picture',{url:sources[i].thumbnail.toDataURL()});
					console.log(0)
					ipcRenderer.once('x-screen-capture-picture-clipped',(event,data)=>{
						warningMention.init(data.pic);
					});
					return false;
				}
			}
		});
	});
}
function saveImage(){
	ipcRenderer.send('x-save-dialog');
	ipcRenderer.once('x-save-dialog-ready',(event,data)=>{
		ipcRenderer.send('x-save-dialog-picture',{pic:xmirror.exportImage(data)});
		ipcRenderer.removeAllListeners('x-save-dialog-close');
	});
	ipcRenderer.once('x-save-dialog-close',()=>{
		ipcRenderer.removeAllListeners('x-save-dialog-ready');
	});
}
const workPanel=document.querySelector('#workPanel'),
	  settingPanel=document.querySelector('#settingPanel');
function openSettingPanel(){
	if(workPanel.style.display==='block'){
		workPanel.style.display='none';
		settingPanel.style.display='block';
	}else{
		workPanel.style.display='block';
		settingPanel.style.display='none';
	}
}

const warningMention={
	firstInit:false,
	dom:document.querySelector('#warning'),
	url:'',
	text:'重新导入图片将覆盖原有图片，是否继续导入图片？',
	title:'警告',
	init:function(url){
		this.url=url;
		if(!this.firstInit){
			this.confirm();
			this.firstInit=true;
			return ;
		}
		this.dom.style.display='block';
		this.dom.childNodes[1].childNodes[1].childNodes[1].innerHTML=this.title;
		this.dom.childNodes[1].childNodes[1].childNodes[3].innerHTML=this.text;
	},
	confirm:function(){
		xmirror=new Xmirror(this.url);
		let childNodes=document.querySelector("#tooltip").childNodes;
		childNodes.forEach(function(o,i){
			if(o.nodeName.toLowerCase()==='button'){
				o.removeAttribute('disabled');
			}
		})
		xmirror.move(document.querySelector('#move'));
		this.dom.style.display='none';
	},
	cancel:function(){
		this.dom.style.display='none';
	}
}



var xmirror;
// xmirror.move();

function Xmirror(imgPath){
	const _self=this;
	// 画布容器
	const layer=document.getElementById('layer'),
		layerTop=layer.offsetTop,
		layerLeft=layer.offsetLeft;

	layer.addEventListener('mousewheel',function(e){
		e.stopPropagation();
		e.preventDefault();
	});
	// 获取展示用的画布和操作用的画布
	// 采用双图层避免操作的时候清空原画布的内容
	// 采用result图层导出原比例尺的图片
	const c=document.getElementById('canvas');
	const fc=document.getElementById('frontCanvas');
	const rc=document.getElementById('result');
	c.style.display='block';
	fc.height=c.height=window.screen.availHeight;
	fc.width=c.width=window.screen.availWidth;
	const rctx=rc.getContext('2d');
	const ctx=c.getContext('2d');
	const fctx=fc.getContext('2d');
	// 移动和缩放图片的变量
	let scale=1,scaleDelta=0.9,imgDeltaX=10,imgDeltaY=10;

	this.setActiveClass=function(domtThis){
		if(domtThis){
			var childNodes=domtThis.parentNode.childNodes;
			childNodes.forEach(function(o,i){
				if(o.nodeName!=='#text' && o.nodeName!=='#comment'){
					o.classList.remove('active');
				}
			});
			domtThis.classList.add('active');
		}
	};
	// 初始化图片
	this.drawImage=function(){
		ctx.clearRect(0,0,c.width,c.height);
		ctx.drawImage(img,0,0,img.width,img.height,imgDeltaX,imgDeltaY,img.width*scale,img.height*scale);
		if(annotations.length>0){
			for(var i=0;i<annotations.length;i++){
				annotations[i].draw(imgDeltaX,imgDeltaY,scale);
			}
		}
	};
	this.exportImage=function(specification){
		console.log(specification)
		rctx.drawImage(img,0,0);
		if(specification.format==='image/jpg'){
			return rc.toDataURL(specification.format,1);
		}else{
			return rc.toDataURL();
		}
	};
	var img=new Image();
	img.src=imgPath;
	img.onload=function(){
		_self.drawImage();
		_self.move();
	};
	// window.onbeforeunload=function(e){
	// 	return e.returnValue='离开或重新加载当前页面会导致当前保存的内容被清空';
	// };
	// 记录原画布上的标注以便画布清空后重绘
	var annotations=[];
	// 只有cover,move函数能直接操作原画布，其他操作都在frontCanvas画布上进行操作，其结果将反映到原画布
	// 保存操作前的画布内容的副本，并将操作画布产生的工作路径绘制到原画布上
	this.cover=function(annotation){
		annotations.push(annotation);
		annotation.draw();
	};

	this.move=function(domtThis){
		this.setActiveClass(domtThis);
		// 注销其他操作按钮产生的监听事件
		fc.onclick=fc.onmousemove=fc.onmousedown=fc.onmouseout=null;

		// 原地放大
		function scaleUp(e){
			if(scale<scaleDelta*100){
				scale/=scaleDelta;
				imgDeltaX-=img.width*(scale-scale*scaleDelta)/2;
				imgDeltaY-=img.height*(scale-scale*scaleDelta)/2;
				_self.drawImage();
			}
		}
		// 原地缩小
		function scaleDown(e){
			if(scale>scaleDelta/100){
				scale*=scaleDelta;
				imgDeltaX+=img.width*(scale/scaleDelta-scale)/2;
				imgDeltaY+=img.height*(scale/scaleDelta-scale)/2;
				_self.drawImage();
			}
		}
		// 移动按钮
		fc.style.display='none';//隐藏操作用的画布
		c.onmousewheel=function(e){
			if(e.wheelDelta){//IE/Opera/Chrome
				if(e.wheelDelta==120){//向上滚动
					scaleUp(e);
				}else{//向下滚动
					scaleDown(e);
				}
			}else if(e.detail){
				if(e.detail==-3){//向上滚动
					scaleUp(e);
				}else{//向下滚动
					scaleDown(e);
				}
			}
			e.stopPropagation();
		};
		c.onmousedown=function(e){
			c.style.cursor='-webkit-grabbing';
			var clickX=e.clientX,clickY=e.clientY;
			var mousemovefn=function(e){
				// c.style.cursor='-webkit-grabbing';
				if(clickX<e.clientX){//向右
					imgDeltaX+=e.clientX-clickX;
				}else{//向左
					imgDeltaX-=clickX-e.clientX;
				}
				if(clickY<e.clientY){//向下
					imgDeltaY+=e.clientY-clickY;
				}else{//向上
					imgDeltaY-=clickY-e.clientY;
				}
				clickX=e.clientX;
				clickY=e.clientY;
				_self.drawImage();
			};
			c.addEventListener('mousemove',mousemovefn);
			c.addEventListener('mouseup',function(){
				c.style.cursor='-webkit-grab';
				c.removeEventListener('mousemove',mousemovefn);
			});
		};
	};

	this.colorPicker=function(domtThis){
		this.setActiveClass(domtThis);
		// 拾色器功能（禁用其他功能）
		var canvasOffsetLeft=c.offsetLeft,canvasOffsetTop=c.offsetTop;
		function rgb2Hex(rgb){
			var hex='#';
			for(var i=0;i<3;i++){
				hex+=('0'+(rgb[i]).toString(16)).substr(-2);
			}
			return hex;
		}
		// 在frontCanvas图层上画出拾色器标识
		var pixel,hexValue,xsign,ysign,deltaX,deltaY,colorRulerX,colorRulerY,annotation;
		function colorPickerFrame(e){
			fctx.clearRect(0,0,fc.width,fc.height);
			xsign=1;
			ysign=-1;
			deltaX=0;//拾色器hex值在左侧时的x偏移量
			deltaY=0;//拾色器hex值在下侧时的x偏移量
			colorRulerX=e.clientX-layerLeft;
			colorRulerY=e.clientY-layerTop;
			pixel=ctx.getImageData(colorRulerX,colorRulerY,1,1);
			hexValue=rgb2Hex(pixel.data);
			// 判断鼠标所在位置确定标注的显示位置（默认在右上显示）
			if(layerLeft+fc.width-e.clientX<100){//离右边界太近，水平xsign取相反数
				xsign*=-1;
				deltaX=-55;
			}
			if(e.clientY-layerTop<20){//离上边界太近，垂直ysign取相反数
				ysign*=-1;
				deltaY=11;
			}
			new Annotation({
				context:fctx,
				colorRulerX:colorRulerX,
				colorRulerY:colorRulerY,
				xsign:xsign,
				ysign:ysign,
				deltaX:deltaX,
				deltaY:deltaY,
				hexValue:hexValue},imgDeltaX,imgDeltaY).draw();
		}
		function Annotation(params,originImageOffsetX,originImageOffsetY){
			this.draw=function(offsetX,offsetY,scale){
				offsetX=offsetX-originImageOffsetX||0;
				offsetY=offsetY-originImageOffsetY||0;
				scale=scale||1;
				params.context.beginPath();
				params.context.moveTo(offsetX+scale*(params.colorRulerX),offsetY+scale*(params.colorRulerY));
				params.context.lineTo(offsetX+scale*(params.colorRulerX+params.xsign*10),offsetY+scale*(params.colorRulerY+params.ysign*10));
				params.context.lineTo(offsetX+scale*(params.colorRulerX+params.xsign*20),offsetY+scale*(params.colorRulerY+params.ysign*10));
				params.context.lineTo(offsetX+scale*(params.colorRulerX+params.xsign*20),offsetY+scale*(params.colorRulerY+params.ysign*17));
				params.context.lineTo(offsetX+scale*(params.colorRulerX+params.xsign*35),offsetY+scale*(params.colorRulerY+params.ysign*17));
				params.context.lineTo(offsetX+scale*(params.colorRulerX+params.xsign*35),offsetY+scale*(params.colorRulerY+params.ysign*2));
				params.context.lineTo(offsetX+scale*(params.colorRulerX+params.xsign*20),offsetY+scale*(params.colorRulerY+params.ysign*2));
				params.context.lineTo(offsetX+scale*(params.colorRulerX+params.xsign*20),offsetY+scale*(params.colorRulerY+params.ysign*10));
				params.context.lineTo(offsetX+scale*(params.colorRulerX+params.xsign*10),offsetY+scale*(params.colorRulerY+params.ysign*10));
				params.context.closePath();
				params.context.strokeStyle='#f00';
				params.context.stroke();
				params.context.fillStyle=params.hexValue;
				params.context.fill();
				params.context.stroke();
				params.context.fillStyle='#f00';
				params.context.font='bolder 15px Arial';
				params.context.fillText(params.hexValue,scale*(params.colorRulerX+params.xsign*40+params.deltaX)+offsetX,scale*(params.colorRulerY+params.ysign*4+params.deltaY)+offsetY);

			};
		}

		// 拾色器按钮
		fc.style.cursor='none';
		fc.style.display='block';//显示操作图层
		fc.onmousemove=colorPickerFrame;
		fc.onclick=function(){
			_self.cover(new Annotation({
				context:ctx,
				colorRulerX:colorRulerX,
				colorRulerY:colorRulerY,
				xsign:xsign,
				ysign:ysign,
				deltaX:deltaX,
				deltaY:deltaY,
				hexValue:hexValue},imgDeltaX,imgDeltaY));
		};



	};


	this.openFolder=function(){

	}
};




