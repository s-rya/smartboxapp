/**
 * Main process
 */
const electron = require('electron');
const {app, BrowserWindow, ipcMain} = require('electron');

let mainWindow = null,
    popUpWindow = null;

//To open the Pop up window
function openPopUpWindow(channel, html) {
    popUpWindow = new BrowserWindow({
        width: 840,
        height: 636,
        frame: false,
        show: false,
        modal: true,
        transparent: true,
        parent: mainWindow,
        resizable: false,
        webPreferences: {
            javascript: true,
            java: false,
            directWrite: true,
            defaultEncoding: 'utf-8'
        }
    });

    popUpWindow.loadURL("data:text/html;charset=UTF-8,"+html);
    popUpWindow.once('ready-to-show', () => {
        popUpWindow.show()
    });

    popUpWindow.on('closed', function () {
        console.log('closed new window');
        popUpWindow = null;
        channel.sender.send('popUpClosed', 'bye');
    });
}
//To open the main window
app.on('ready', function () {
    const {width, height} = electron.screen.getPrimaryDisplay().workAreaSize;
    mainWindow = new BrowserWindow({
        width: 350,
        height: 70,
        x: width-350,
        y: height-100,
        transparent: true,
        frame: false,
        resizable: false,
        alwaysOnTop: true,
        title: 'SmartBox',
        webPreferences: {
            javascript: true,
            java: false,
            directWrite: true,
            defaultEncoding: 'UTF-8'
        }
    });

    mainWindow.loadURL('file://' + __dirname + '/view/main.html');

    ipcMain.on('openPopUp', function (channel, html) {
        if (!popUpWindow) {
            openPopUpWindow(channel, html);
        }

    });
});

app.on('window-all-closed', function () {
    //To kill the app when all the windows are closed
    app.quit();
});

//To resize the window
ipcMain.on('resize', function (e, x, y) {
    console.log("resize invokded");
    mainWindow.setSize(x, y);
});

//To set position of window
ipcMain.on('setPos', function (e, x, y) {
    mainWindow.setPosition(x, y);
});

//To resize the window along with position
ipcMain.on('resizeWithPos', (e, x, y, z) => {
    let windowPos = mainWindow.getPosition();
    mainWindow.setSize(x, y);
    if(z) {
        mainWindow.setPosition(windowPos[0], windowPos[1] + z - 75);
    } else {
        mainWindow.setPosition(windowPos[0], windowPos[1] - y + 75);
    }
});


