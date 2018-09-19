const {
  app,
  BrowserWindow,
  Menu
} = require('electron');
const path = require('path');
const url = require('url');
const electron = require('electron');
const ipc = electron.ipcMain;

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win;

function createWindow() {
  // Create the browser window.
  win = new BrowserWindow({
    width: 1225,
    height: 800,
    minWidth: 800,
    minHeight: 400,
    backgroundColor: "#D4E1E7"
  });

  // and load the index.html of the app.
  win.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }));

  // Open the DevTools.
  // win.webContents.openDevTools()

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null;
  });

  setMainMenu();
}

function setMainMenu() {
  const template = [
    {
      label: 'Filter',
      submenu: [
        {
          label: 'About League Stats',
          accelerator: 'Shift+CmdOrCtrl+A',
          click() {
              displayAboutWindow();
          }
        },
        {
          label: 'Quit League Stats',
          accelerator: 'CmdOrCtrl+Q',
          click() {
            app.quit();
          }
        }
      ]
    }
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function displayAboutWindow() {
  let child = new BrowserWindow({
    parent: win,
    modal: false,
    show: true
  });
  child.loadURL(url.format({
    pathname: path.join(__dirname, 'about.html'),
    protocol: 'file:',
    slashes: true
  }));
}

ipc.on('newChampionDetailWindow', function (event, championId, championName) {
  console.log("Champion received: " + championName + " (id " + championId + ")");
  let childWidth = Math.round(win.getSize()[0] * 0.95);
  let childHeight = Math.round(win.getSize()[1] * 0.95);
  let child = new BrowserWindow({
    parent: win,
    modal: false,
    show: true,
    width: childWidth,
    height: childHeight
  });
  let childUrl = "https://gameinfo.na.leagueoflegends.com/en/game-info/champions/" + championName;
  console.log("Loading URL: " + childUrl);
  child.loadURL(childUrl);
});

ipc.on('summonerSearch', function (event, summonerName, accountId) {
  console.log("Loading summoner page: " + summonerName);
  win.webContents.loadURL(url.format({
    pathname: path.join(__dirname, 'summoner.html'),
    protocol: 'file:',
    slashes: true
  }));
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow();
  }
});
