const { contextBridge, ipcRenderer } = require("electron");

/* --- SECTION: IPC BRIDGE EXPORTS --- */
contextBridge.exposeInMainWorld("api", {
  
  /* --- SECTION: BOOTLOADER --- */
  onBootProgress: (callback) =>
    ipcRenderer.on("boot-progress", (event, mainMsg, subMsg, percent, speed) =>
      callback(mainMsg, subMsg, percent, speed)
    ),
  onBootComplete: (callback) =>
    ipcRenderer.on("boot-complete", () => callback()),

  /* --- SECTION: NORMAL DOWNLOAD HANDLERS --- */
  sendDownload: (url, format, qualityTag, customPath, speedLimit) =>
    ipcRenderer.send("download-video", url, format, qualityTag, customPath, speedLimit),
  cancelNormalDownload: () => ipcRenderer.send("cancel-normal-download"),
  getMetadata: (url) => ipcRenderer.send("get-metadata", url),

  /* --- SECTION: ADVANCED DOWNLOAD HANDLERS --- */
  sendAdvancedDownload: (config) =>
    ipcRenderer.send("download-advanced", config),
  cancelAdvDownload: () => ipcRenderer.send("cancel-adv-download"),

  /* --- SECTION: PROGRESS & STATUS LISTENERS --- */
  onProgress: (callback) =>
    ipcRenderer.on("download-progress", (event, value) => callback(value)),
  onStatus: (callback) =>
    ipcRenderer.on("download-status", (event, message) => callback(message)),
  onAdvProgress: (callback) =>
    ipcRenderer.on("adv-download-progress", (event, value) => callback(value)),
  onAdvStatus: (callback) =>
    ipcRenderer.on("adv-download-status", (event, message) =>
      callback(message)
    ),
  onMetadata: (callback) =>
    ipcRenderer.on("metadata-results", (event, data) => callback(data)),

  /* --- SECTION: FILE & SYSTEM UTILITIES --- */
  openFolder: (customPath) => ipcRenderer.send("open-downloads", customPath),
  selectFolder: () => ipcRenderer.invoke("select-folder"),
  getLibraryFiles: (customPath) =>
    ipcRenderer.invoke("get-library-files", customPath),
  playFile: (filePath) => ipcRenderer.send("play-file", filePath),
  deleteFile: (filePath) => ipcRenderer.invoke("delete-file", filePath),
});