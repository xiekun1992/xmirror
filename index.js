const electron=require('electron');
const {
	app,
	BrowserWindow,
	ipcMain,
	dialog,
	globalShortcut
}=electron;

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
	
	// win.webContents.openDevTools();

	win.on('closed',()=>{
		win=null;
	});

	// 给屏幕截图窗口设置退出截图的快捷键
	globalShortcut.register('Esc',()=>{
		if(tmpWindow){
			tmpWindow.destroy();
		}
	});
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

// 创建屏幕捕获窗口
let tmpWindow,readyToDraw=false,picture,readyToDrawEvent;

ipcMain.on('x-screen-capture',()=>{
	// 隐藏主界面窗口
	win.hide();

	tmpWindow=new BrowserWindow({
		alwaysOnTop:true,
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
});
// 接收程序主界面传来的图像截图并设置到屏幕截图显示界面
ipcMain.on('x-screen-capture-picture',(event,data)=>{
	picture=data.url;
	if(readyToDraw && readyToDrawEvent){
		sendPictureToDraw(readyToDrawEvent);
	}else{
		let timer=setInterval(function(){
			if(readyToDraw && readyToDrawEvent){
				sendPictureToDraw(readyToDrawEvent);
				clearInterval(timer);
			}
		},10);
	}
});
// 截图窗口加载完成
ipcMain.on('x-ready-to-draw',(event)=>{
	readyToDraw=true;
	readyToDrawEvent=event;
	sendPictureToDraw(event);
});
// 将主界面截到的图片传递到截图显示窗口
function sendPictureToDraw(event){
	event.sender.send('x-picture-to-draw',{path:picture});
}
// 完成截图的显示之后显示窗口
ipcMain.on('x-picture-draw-end',()=>{
	tmpWindow.show();
	win.show();
});