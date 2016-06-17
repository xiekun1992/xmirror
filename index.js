const electron=require('electron');
const {app}=electron;
const {BrowserWindow}=electron;
const {ipcMain}=electron;

let mainWindow;

function createWindow(){
	mainWindow=new BrowserWindow({
		icon:'./favicon.ico',
		width:1000,
		height:700,
		frame:false
	});
	mainWindow.loadURL(`file://${__dirname}/index.html`);
	// mainWindow.webContents.openDevTools();
	mainWindow.on('close',()=>{
		mainWindow=null;
	});
}

app.on('ready',createWindow);

app.on('window-all-closed',()=>{
	if(process.platform!=='darwin'){
		app.quit();
	}
});

app.on('activate',()=>{
	if(mainWindow===null){
		createWindow();
	}
});

ipcMain.on('x-close-window',(event)=>{
	mainWindow.close();
})
ipcMain.on('x-min-window',(event)=>{
	mainWindow.minimize();
});
ipcMain.on('x-max-window',(event)=>{
	if(mainWindow.isMaximized()){
		mainWindow.unmaximize();
	}else{
		mainWindow.maximize();
	}
})