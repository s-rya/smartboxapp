/**
 * Main process
 */
const electron = require('electron');
const {app, BrowserWindow, session, ipcMain, dialog} = require('electron');
const fs = require('fs');
const redis = require('./redis');
const path = require("path");
const rp = require('request-promise');
const {getMac, isMac} = require('getmac');
const config = require('./config/config');

let cookies = '';

let mainWindow = null,
    popUpWindow = null,
    startUpWindow = null,
    uploadWindow = null;

//To open the Pop up window
function openPopUpWindow(channel, html) {
    popUpWindow = new BrowserWindow({
        width: 724,
        height: 645,
        frame: false,
        show: false,
        modal: true,
        transparent: true,
        parent: mainWindow,
        alwaysOnTop: true,
        resizable: false,
        webPreferences: {
            javascript: true,
            java: false,
            directWrite: true,
            defaultEncoding: 'utf-8'
        }
    });

    popUpWindow.loadURL("data:text/html;charset=UTF-8," + html);
    popUpWindow.show();

    popUpWindow.on('closed', () => {
        console.log('closed new window');
        popUpWindow = null;
        channel.sender.send('popUpClosed', 'bye');
    });
}
//To open the main window
app.on('ready', () => {
    cookies = session.defaultSession.cookies;
    const {width, height} = electron.screen.getPrimaryDisplay().workAreaSize;
    mainWindow = new BrowserWindow({
        width: 335,
        height: 70,
        x: width - 350,
        y: height - 100,
        transparent: true,
        frame: false,
        show: false,
        resizable: false,
        alwaysOnTop: true,
        title: 'SmartBot',
        webPreferences: {
            javascript: true,
            java: false,
            directWrite: true,
            defaultEncoding: 'UTF-8'
        }
    });

    startUpWindow = new BrowserWindow({
        width: 320,
        height: 380,
        transparent: true,
        frame: false,
        resizable: false,
        show: false,
        alwaysOnTop: true,
        title: 'SmartBot',
        webPreferences: {
            javascript: true,
            java: false,
            directWrite: true,
            defaultEncoding: 'UTF-8'
        }
    });
    fs.readFile(path.join(__dirname, 'user.json'), 'utf8', (err, data) => {
        if (err) {
            startUpWindow.loadURL('file://' + __dirname + '/view/start.html');
            startUpWindow.show();
        } else {
            data = JSON.parse(data);
            getMac((error, mac) => {
                checkUser(data.email, mac);
            });
        }
    });

    ipcMain.on('openSearchBox', (e, email, macAddress) => {
        checkUser(email, macAddress);
    });

    ipcMain.on('openPopUp', (channel, html)=> {
        if (!popUpWindow) {
            openPopUpWindow(channel, html);
        }

    });
});

app.on('window-all-closed', () => {
    //To kill the app when all the windows are closed
    app.quit();
});

ipcMain.on('exit', () => {
    console.log("exit invoked");
    app.quit();
});

ipcMain.on('requestAccess', e => {
    dialog.showMessageBox(mainWindow, {
        type: "info",
        buttons: ["Ok"],
        defaultId: 0,
        title: "Access Request raised.",
        message: "Your access request for OmniBot has been raised. You will be notified by email."
    }, data => app.quit());
});

ipcMain.on('openApp', e => {
    mainWindow.loadURL('file://' + __dirname + '/view/main.html');
    mainWindow.show();
});

//To resize the window
ipcMain.on('resize', (e, x, y) => {
    console.log("resize invoked");
    mainWindow.setSize(x, y);
});

//To set position of window
ipcMain.on('setPos', (e, x, y) => {
    mainWindow.setPosition(x, y);
});

//To resize the window along with position
ipcMain.on('resizeWithPos', (e, x, y, z) => {
    let windowPos = mainWindow.getPosition();
    mainWindow.setSize(x, y);
    if (z) {
        mainWindow.setPosition(windowPos[0], windowPos[1] + z - 75);
    } else {
        mainWindow.setPosition(windowPos[0], windowPos[1] - y + 75);
    }
});

ipcMain.on('popup-search', (e, appName, question) => {
    if (appName.split('+')[0] === 'rephrase' || appName.split('+')[0] === 'noneOfTheAbove') {
        popUpWindow.close();
    } else {
        const user = require('./user.json');
        //const user = require('./../../user.json');
        redis.set('newSearch-' + user.email, {appName: appName, question: question});
        popUpWindow.loadURL('file://' + __dirname + '/view/new-popup.html');
    }
});

ipcMain.on('upload-box', e => {
    let uploadWindow = new BrowserWindow({
        width: 320,
        height: 380,
        transparent: true,
        frame: false,
        resizable: false,
        parent: mainWindow,
        modal: true,
        alwaysOnTop: true,
        title: 'SmartBot',
        webPreferences: {
            javascript: true,
            java: false,
            directWrite: true,
            defaultEncoding: 'UTF-8'
        }
    });
    uploadWindow.loadURL('file://' + __dirname + '/view/upload.html');
});

ipcMain.on('startUpload', (e, appName, filePath, fileName, isAID) => {
    dialog.showMessageBox(mainWindow, {
        type: "info",
        buttons: ["Ok"],
        defaultId: 0,
        title: "Document upload",
        message: "Document upload is in progress. Meanwhile you can continue your search. You will be notified once the document is uploaded."
    }, (data)=> {
        rp({
            method: 'POST',
            url: "https://smartbox-crawler.mybluemix.net/upload",
            headers: {
                'content-type': 'multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW'
            },
            formData: {
                file: {
                    value: fs.createReadStream(filePath),
                    options: {filename: fileName, contentType: null}
                },
                appName: appName,
                isAID: isAID
            }
        }).then(data => {
            console.log(data);
            if (data && JSON.parse(data).success) {
                dialog.showMessageBox(mainWindow, {
                    type: "info",
                    buttons: ["Ok"],
                    defaultId: 0,
                    title: "Document upload",
                    message: "Document uploaded successfully."
                });
            } else {
                dialog.showMessageBox(mainWindow, {
                    type: "info",
                    buttons: ["Ok"],
                    defaultId: 0,
                    title: "Document upload",
                    message: "Document upload failed. Please try again ."
                });
            }
            //TODO: Need to handle error cases
        }).catch(err => {
            dialog.showMessageBox(mainWindow, {
                type: "info",
                buttons: ["Ok"],
                defaultId: 0,
                title: "Document upload",
                message: "Document upload failed. Please try again ."
            });
        });

    });
});


ipcMain.on('rankResults', (e, payload) => {
    console.log('rankResults ::::', payload);
    if (payload && payload.payload && payload.payload.length > 0) {
        rp({
            method: 'POST',
            url: `${config.smartboxserviceURL}rank`,
            headers: {
                'content-type': 'application/json'
            },
            body: JSON.stringify(payload)
        }).then(data => console.log('Ranking results ::::', data)).catch(err => console.log('Ranking error >>>>', err));
    }
});

const checkUser = (email, macAddress) => {
    startUpWindow = new BrowserWindow({
        width: 320,
        height: 350,
        show: false,
        transparent: true,
        frame: false,
        resizable: false,
        alwaysOnTop: true,
        title: 'SmartBot',
        webPreferences: {
            javascript: true,
            java: false,
            directWrite: true,
            defaultEncoding: 'UTF-8'
        }
    });
    rp({
        method: 'POST',
        url: `${config.smartboxserviceURL}user`,
        body: {
            email: email,
            macAddress: macAddress
        },
        json: true
    }).then(response => {
        if (response.canUse) {
            mainWindow.loadURL('file://' + __dirname + '/view/main.html');
            mainWindow.show();
        } else {
            if (response.reason === 'new-user') {
                startUpWindow.loadURL('file://' + __dirname + '/view/access.html');
                startUpWindow.show();
            } else if (response.reason === 'new-machine') {
                startUpWindow.loadURL('file://' + __dirname + '/view/activation.html');
                startUpWindow.show();
            } else {
                //TODO: Handle error case
            }
        }
    }).catch(err => {
        console.log(err);
    })
};

ipcMain.on('search-web', (e, searchTerm) => {
    console.log('search-web ::::', searchTerm);
    popUpWindow = new BrowserWindow({
        width: 724,
        height: 645,
        frame: false,
        show: false,
        modal: true,
        transparent: true,
        parent: mainWindow,
        alwaysOnTop: true,
        resizable: false,
        webPreferences: {
            javascript: true,
            java: false,
            directWrite: true,
            defaultEncoding: 'utf-8'
        }
    });
    setCookie('searchTerm', searchTerm)
        .then(() => {
            popUpWindow.loadURL('file://' + __dirname + '/view/web-search.html');
            popUpWindow.show();
        })
        .catch(console.log); //TODO: Need to handle error case

    popUpWindow.on('closed', () => {
        console.log('closed search-web window');
        popUpWindow = null;
    });
});

ipcMain.on('getSearchTerm', channel => {
    getCookies(config.smartboxserviceURL)
        .then(data => {
            channel.sender.send('search-term', data)
        })
});


/*This method is used to set Cookies*/
const setCookie = (key, text) => {
    return new Promise((resolve, reject) => {
        cookies.set({
            url: config.smartboxserviceURL,
            name: key,
            value: text.trim()
        }, error => {
            if (error) {
                reject('Error in setting cookie');
            } else {
                resolve();
            }
        })
    });
};

/*This method is get the cookies*/
const getCookies = url => {
    return new Promise((resolve, reject) => {
        cookies.get({
            url: url
        }, (err, cookie) => {
            if (err) {
                reject();
            } else {
                resolve(cookie);
            }
        })
    });
};