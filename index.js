const electron=require('electron');
const {
	app,
	BrowserWindow,
	ipcMain,
	dialog,
	globalShortcut,
	shell
}=electron;

const fs=require('fs');
const http=require('http');

let win;

function createWindow(){
	win=new BrowserWindow({
		icon:'./favicon.ico',
		width:1000,
		height:700,
		frame:false,
		title:'xmirror',
		minWidth:800,
		minHeight:600,
		center:true
	});
	win.loadURL(`file://${__dirname}/index.html`);
	
	win.webContents.openDevTools();

	win.on('closed',()=>{
		win=null;
	});

	// 给屏幕截图窗口设置退出截图的快捷键
	globalShortcut.register('Esc',tmpWindowEsc);
}
function tmpWindowEsc(){
	xScreenCaptureFinish && ipcMain.removeAllListeners('x-screen-capture-finish');
	if(tmpWindow){
		readyToDraw=false;
		tmpWindow.destroy();
		win.isMinimized() && win.restore();
	}
}

app.on('ready',createWindow);

app.on('window-all-closed',()=>{
	if(process.platform!=='darwin'){
		app.quit();
	}
});

app.on('will-quit',()=>{
	globalShortcut.unregisterAll();
});

app.on('activate',()=>{
	if(win===null){
		createWindow();
	}
});

ipcMain.on('x-close-window',(event)=>{
	win.close();
})
ipcMain.on('x-min-window',(event)=>{
	win.minimize();
});
ipcMain.on('x-max-window',(event)=>{
	if(win.isMaximized()){
		win.unmaximize();
	}else{
		win.maximize();
	}
});

ipcMain.on('x-open-dialog',(event)=>{
	let imgPath=dialog.showOpenDialog({
		properties:['openFile'],
		title:'选择图片',
		filters:[
			{name:'Images',extensions:['jpg','png','gif','bmp']}
		]
	});
	if(imgPath && imgPath.length>0){
		event.sender.send('x-open-dialog-imgpath',{path:imgPath.shift()});
	}
});

ipcMain.on('x-save-dialog',(event)=>{
	let imgPath=dialog.showSaveDialog({
		title:'保存图片',
		filters:[
			{name:'*.jpg',extensions:['jpg']},
			{name:'*.png',extensions:['png']},
			// {name:'*.gif',extensions:['gif']},
			// {name:'*.bmp',extensions:['bmp']},
			{name:'*.xmir',extensions:['xmir']}
		]
	});
	if(imgPath){
		event.sender.send('x-save-dialog-ready',{format:'image/'+imgPath.split('.').pop()});
		ipcMain.once('x-save-dialog-picture',(event,data)=>{
			// console.log(data.pic)
			// 去出base64编码中的格式说明
			base64Pic=data.pic.replace(/^data:\S+;base64,/,'');
			fs.writeFile(imgPath,base64Pic,'base64',(err)=>{
				if(err){
					// 
					console.log(err)
				}
			});
		});
	}else{
		event.sender.send('x-save-dialog-close');
	}
});
// 创建屏幕捕获窗口
var tmpWindow,readyToDraw=false,picture,readyToDrawEvent;

ipcMain.on('x-screen-capture',(event)=>{

	tmpWindow=new BrowserWindow({
		// alwaysOnTop:true,
		fullscreen:true,
		resizable:false,
		movable:false,
		closable:false,
		frame:false,
		transparent:true,
		show:false
	});
	// tmpWindow.hide();
	tmpWindow.loadURL(`file://${__dirname}/partials/capture.html`);
	// tmpWindow.webContents.openDevTools();
	win.on('minimize',()=>{
		// 此处是否设置的延迟和系统是否开启窗口动画显隐效果有关
		let timer=setTimeout(function(){
			event.sender.send('x-screen-capture-initialized');
			clearTimeout(timer);
		},1000);
	});
	// 隐藏主界面窗口
	win.minimize();
});
// 接收程序主界面传来的图像截图并设置到屏幕截图显示界面
let xScreenCaptureFinish;
ipcMain.on('x-screen-capture-picture',(event,data)=>{
	picture=data.url;
	let timer=setInterval(function(){
		if(readyToDraw && readyToDrawEvent){
			if(win.isMinimized()){
				sendPictureToDraw(readyToDrawEvent);
				clearInterval(timer);
			}
		}
	},10);
	let eventCallback=event;
	xScreenCaptureFinish=(event,data)=>{
		eventCallback.sender.send('x-screen-capture-picture-clipped',data);
		tmpWindowEsc();
	};
	ipcMain.on('x-screen-capture-finish',xScreenCaptureFinish);
});
// 截图窗口加载完成
ipcMain.on('x-ready-to-draw',(event)=>{
	readyToDraw=true;
	readyToDrawEvent=event;
});
// 将主界面截到的图片传递到截图显示窗口
function sendPictureToDraw(event){
	event.sender.send('x-picture-to-draw',{path:picture});
}
// 完成截图的显示之后显示窗口
ipcMain.on('x-picture-draw-end',()=>{
	tmpWindow.show();
});

let workspace="D:\\xmirror_workspace";
ipcMain.on('x-setting-panel-ready',(event)=>{
	fs.readdir(workspace,(err,files)=>{
		if(err){
			throw err;	
		}else{
			// console.log(files);
			let filesInfo=[];
			for(var o of files){
				let stats=fs.statSync(workspace+'\\'+o);
				if(stats.isFile()){
					// console.log(o,' is a file.');
					if(['jpg','png'].indexOf(o.split('.').pop())!==-1){
						filesInfo.push({name:o,type:'image',path:workspace+'\\'+o});
					}
				}else if(stats.isDirectory()){
					// console.log(o,' is a directory.');
					filesInfo.push({name:o,type:'folder',path:workspace+'\\'+o});
				}
			}
			event.sender.send('x-setting-panel-list',{files:filesInfo,nav:workspace});
		}
	});
	event.sender.send('x-resize',{size:win.getSize()});
	win.on('resize',()=>{
		// console.log(win.getSize());
		event.sender.send('x-resize',{size:win.getSize()});
	});
});
ipcMain.on('x-setting-panel-open-folder',(event,data)=>{
	console.log(data.path);
	const path=data.path;
	fs.readdir(path,(err,files)=>{
		if(err){
			throw err;
		}else{
			let filesInfo=[];
			for(var o of files){
				let stats=fs.statSync(path+'\\'+o);
				if(stats.isFile()){
					// console.log(o,' is a file.');
					if(['jpg','png'].indexOf(o.split('.').pop())!==-1){
						filesInfo.push({name:o,type:'image',path:path+'\\'+o});
					}
				}else if(stats.isDirectory()){
					// console.log(o,' is a directory.');
					filesInfo.push({name:o,type:'folder',path:path+'\\'+o});
				}
			}
			event.sender.send('x-setting-panel-list',{files:filesInfo,nav:path});
		}
	});
});
// 菜单右键
ipcMain.on('x-menu-showiteminfolder',(event,path)=>{
	shell.showItemInFolder(path);
});
ipcMain.on('x-menu-openitem',(event,path)=>{
	shell.openItem(path);
});
ipcMain.on('x-menu-uploadfile',(event,path)=>{
	let boundaryKey='----'+Date.now();
	let options={
		host:'http://localhost:3000',
		port:80,
		method:'POST',
		path:'/images',
		headers:{
			'Content-Type':'multipart/form-data; boundary='+boundaryKey,
			'Connection':'keep-alive'
		}
	};

	let req=http.request(options,(res)=>{
		res.setEncoding('utf8');
		res.on('data',(chunk)=>{
			console.log('body: '+chunk);
		});
		res.on('end',()=>{
			console.log('res end');
		});
	});

	req.write('-'+boundaryKey+'\r\n'+
			  'Content-Disposition:form-data;name="file";filename="'+
			  path.split('\\').pop()+'"\r\n'+
			  'Content-Type:application/x-zip-compressed\r\n\r\n');
	let fileStream=fs.createReadStream(path,{bufferSize:1024*1024});
	fileStream.pipe(req,{end:false});
	fileStream.on('end',()=>{
		req.end('\r\n-'+boundaryKey+'-');
	})
});