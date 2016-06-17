const electron=require('electron');
const {app}=electron;
const {BrowserWindow}=electron;
const {ipcMain}=electron;

let win;

function createWindow(){
	win=new BrowserWindow({
		icon:'./favicon.ico',
		width:1000,
		height:700,
		frame:false
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
})