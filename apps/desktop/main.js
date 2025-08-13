const { app, BrowserWindow, globalShortcut } = require("electron");
const path = require("path");

async function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
    },
    show: false,
  });

  win.once("ready-to-show", () => {
    win.show();
  });

  win.webContents.on("did-fail-load", (event, errorCode, errorDescription) => {
    console.error("Failed to load:", errorCode, errorDescription);
  });

  const isDev = !app.isPackaged;

  if (isDev) {
    try {
      console.log("Loading from development server...");
      await win.loadURL("http://localhost:5173");

      // Register F12 to toggle DevTools
      globalShortcut.register("F12", () => {
        if (win.webContents.isDevToolsOpened()) {
          win.webContents.closeDevTools();
        } else {
          win.webContents.openDevTools();
        }
      });
    } catch (error) {
      console.error("Failed to load URL:", error);
    }
  } else {
    try {
      console.log("Loading from production build...");
      await win.loadFile(path.join(__dirname, "../web/dist/index.html"));
    } catch (error) {
      console.error("Failed to load file:", error);
    }
  }

  return win;
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Clean up shortcuts when app is quitting
app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});
