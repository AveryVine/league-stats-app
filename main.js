const {app, BrowserWindow} = require('electron')
const path = require('path')
const url = require('url')
const electron = require('electron')
const ipc = electron.ipcMain

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win

function createWindow () {
  // Create the browser window.
  win = new BrowserWindow({width: 1200, height: 750})

  // and load the index.html of the app.
  win.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }))

  // Open the DevTools.
  // win.webContents.openDevTools()

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null
  })
}

ipc.on('newChampionDetailWindow', function(event, championId, championName) {
  console.log("Champion ID received: " + championId)
  let child = new BrowserWindow({parent: win, modal: false, show: false, width: win.getSize()[0] * 0.95, height: win.getSize()[1] * 0.95})
  let url = "http://gameinfo.na.leagueoflegends.com/en/game-info/champions/" + championName.toLowerCase()
  console.log("Loading URL: " + url)
  child.loadURL(url)
  child.once('ready-to-show', () => {
    child.show()
    win.blur()
  })
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', () => {
    app.quit()
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow()
  }
})