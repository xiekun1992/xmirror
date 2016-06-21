const electron=require('electron');
const {app}=electron;
const {BrowserWindow}=electron;
const {ipcMain}=electron;
const {dialog}=electron;


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
}

app.on('ready',createWindow);

app.on('window-all-closed',()=>{
	if(process.platform!=='darwin'){
		app.quit();
	}
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

let tmpWindow;
ipcMain.on('x-screen-capture',()=>{
	// 用于屏幕捕获
	tmpWindow=new BrowserWindow({
		// width:1366,
		// height:1000,
		alwaysOnTop:true,
		fullscreen:true,
		resizable:false,
		movable:false,
		closable:false,
		frame:false,
		transparent:true
	});
});
ipcMain.on('x-screen-capture-picture',(event,data)=>{
	tmpWindow.loadURL(`file://${__dirname}/partial/capture.html`);
});