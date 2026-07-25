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
  sendDownload: (url, format, qualityTag, customPath, speedLimit, cookieBrowser, useArchive, title) =>
    ipcRenderer.send("download-video", url, format, qualityTag, customPath, speedLimit, cookieBrowser, useArchive, title),

  cancelNormalDownload: () => ipcRenderer.send("cancel-normal-download"),
  getMetadata: (url, cookieBrowser) => ipcRenderer.send("get-metadata", url, cookieBrowser),

  /* --- SECTION: ADVANCED DOWNLOAD HANDLERS --- */
  sendAdvancedDownload: (config) =>
    ipcRenderer.send("download-advanced", config),
  cancelAdvDownload: () => ipcRenderer.send("cancel-adv-download"),

  /* --- SECTION: PARALLEL DOWNLOAD HANDLERS --- */
  sendParallelDownload: (item) =>
    ipcRenderer.send("download-parallel", item),
  cancelParallelDownload: (id) =>
    ipcRenderer.send("cancel-parallel-download", id),
  pauseParallelDownload: (id) =>
    ipcRenderer.send("pause-parallel-download", id),
  resumeParallelDownload: (item) =>
    ipcRenderer.send("resume-parallel-download", item),
  onParallelProgress: (callback) =>
    ipcRenderer.on("parallel-progress", (event, data) => callback(data)),
  onParallelStatus: (callback) =>
    ipcRenderer.on("parallel-status", (event, data) => callback(data)),

  /* --- SECTION: PLAYLIST & CHANNEL HANDLERS --- */
  getPlaylistMetadata: (url, cookieBrowser) =>
    ipcRenderer.send("get-playlist-metadata", url, cookieBrowser),
  cancelPlaylistExtraction: () =>
    ipcRenderer.send("cancel-playlist-extraction"),
  onPlaylistMetadata: (callback) =>
    ipcRenderer.on("playlist-metadata-results", (event, data) => callback(data)),
  onPlaylistError: (callback) =>
    ipcRenderer.on("playlist-metadata-error", (event, message) => callback(message)),

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
  selectCookieFile: () => ipcRenderer.invoke("select-cookie-file"),

  /* --- SECTION: ENGINE UPDATER --- */
  getEngineVersion: () => ipcRenderer.invoke("get-engine-version"),
  updateEngine: () => ipcRenderer.invoke("update-engine"),
  onEngineUpdateProgress: (callback) =>
    ipcRenderer.on("engine-update-progress", (event, message, percent) =>
      callback(message, percent)
    ),

  /* --- SECTION: CLIPBOARD AUTO-DETECT --- */
  onClipboardUrl: (callback) =>
    ipcRenderer.on("clipboard-url-detected", (event, url) => callback(url)),
  resetClipboardMonitor: () => ipcRenderer.send("reset-clipboard-monitor"),
  setClipboardAutoDetect: (enabled) => ipcRenderer.send("set-clipboard-auto-detect", enabled),


  /* --- SECTION: ARCHIVE & SYNC HANDLERS --- */
  getArchiveStats: () => ipcRenderer.invoke("get-archive-stats"),
  clearDownloadArchive: () => ipcRenderer.invoke("clear-download-archive"),
});