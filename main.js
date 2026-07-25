/* --- SECTION: IMPORTS & CORE CONFIGURATION --- */
const {
  app,
  BrowserWindow,
  ipcMain,
  shell,
  Notification,
  dialog,
  clipboard,
} = require("electron");
const path = require("path");
const { spawn, exec, execFile } = require("child_process");
const fs = require("fs");
const axios = require("axios");
const AdmZip = require("adm-zip");

// --- SECTION: GLOBAL ERROR HANDLERS ---
// Prevents ugly Developer Stack Trace popups if a fatal Node.js error occurs
process.on("uncaughtException", (error) => {
  // Silently absorb fatal errors in production
});
process.on("unhandledRejection", (error) => {
  // Silently absorb unhandled promise rejections
});

// Force Windows to recognize the app before the lifecycle starts
app.setName("YTDL");
app.setAppUserModelId("com.ditom.ytdl.app");

// --- SECTION: WINDOWS NOTIFICATION SHORTCUT (DEV MODE FIX) ---
// On Windows, native toast notifications ONLY work if the app has a
// Start Menu shortcut with the correct AppUserModelId.
// In dev mode (npm start), no shortcut exists, so .show() silently fails.
// We use Electron's shell.writeShortcutLink which properly sets appUserModelId
// on the .lnk — the WScript.Shell COM approach does NOT set this property,
// causing notifications to silently fail even when Notification.isSupported()
// returns true.
if (process.platform === "win32") {
  const appDataPath = process.env.APPDATA || "";
  const startMenuPath = path.join(
    appDataPath,
    "Microsoft",
    "Windows",
    "Start Menu",
    "Programs",
    "YTDL.lnk"
  );

  // Recreate if missing or if the existing shortcut lacks the correct AppUserModelId
  let needsCreate = !fs.existsSync(startMenuPath);
  if (!needsCreate) {
    try {
      const existingDetail = shell.readShortcutLink(startMenuPath);
      if (existingDetail.appUserModelId !== "com.ditom.ytdl.app") {
        needsCreate = true;
      }
    } catch (e) {
      needsCreate = true;
    }
  }

  if (needsCreate) {
    try {
      shell.writeShortcutLink(startMenuPath, {
        target: process.execPath,
        cwd: __dirname,
        icon: path.join(__dirname, "icon.ico"),
        iconIndex: 0,
        description: "YTDL - YouTube Downloader",
        appUserModelId: "com.ditom.ytdl.app",
      });
    } catch (e) {
      // Non-fatal: notifications won't work in dev but app still runs
    }
  }
}

// --- SECTION: SINGLE INSTANCE LOCK ---
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
  process.exit(0);
}


let normalProcess = null;
let advProcess = null;
let normalKilled = false;
let advKilled = false;

// --- CLIPBOARD MONITORING ENGINE ---
const isMediaUrl = (url) => {
  if (!url || typeof url !== "string") return false;
  const clean = url.trim();
  return /^(https?:\/\/)?([a-z0-9-]+\.)?(youtube\.com|youtu\.be|vimeo\.com|tiktok\.com|twitter\.com|x\.com|instagram\.com|facebook\.com|twitch\.tv|bilibili\.com|dailymotion\.com)\/.+/i.test(clean);
};


const isPlaylistOrChannelUrl = (url) => {
  if (!url || typeof url !== "string") return false;
  const clean = url.trim().toLowerCase();
  return (
    clean.includes("/playlist") ||
    clean.includes("list=") ||
    clean.includes("/@") ||
    clean.includes("/channel/") ||
    clean.includes("/c/") ||
    clean.includes("/user/")
  );
};

let lastClipboardText = "";
let clipboardMonitorEnabled = true;

ipcMain.on("reset-clipboard-monitor", () => {
  lastClipboardText = "";
});

ipcMain.on("set-clipboard-auto-detect", (event, enabled) => {
  clipboardMonitorEnabled = !!enabled;
  if (enabled) lastClipboardText = "";
});


function startClipboardMonitor(mainWindow) {
  try {
    lastClipboardText = clipboard.readText().trim();
  } catch (e) {}

  setInterval(() => {
    try {
      if (!mainWindow || mainWindow.isDestroyed()) return;
      if (!clipboardMonitorEnabled) return;
      const text = clipboard.readText().trim();
      if (text && text !== lastClipboardText) {
        lastClipboardText = text;
        if (isMediaUrl(text)) {
          const isPlaylist = isPlaylistOrChannelUrl(text);
          const payload = { url: text, isPlaylistOrChannel: isPlaylist };

          // Send payload to in-app toast
          mainWindow.webContents.send("clipboard-url-detected", payload);

          // Trigger native OS System Notification on copy
          try {
            if (Notification.isSupported()) {
              const notif = new Notification({
                title: isPlaylist
                  ? "YTDL — Playlist / Channel Copied"
                  : "YTDL — Video Link Copied",
                body: isPlaylist
                  ? "Copied playlist link. Click to open YTDL & fetch playlist."
                  : `Copied: ${text.length > 40 ? text.substring(0, 40) + "..." : text}`,
                icon: path.join(__dirname, "icon.ico"),
                silent: false,
              });

              notif.on("click", () => {
                if (mainWindow.isMinimized()) mainWindow.restore();
                mainWindow.focus();
                mainWindow.webContents.send("clipboard-url-detected", payload);
              });

              notif.show();
            }
          } catch (notifErr) {
            console.error("OS Notification error:", notifErr);
          }
        }
      }
    } catch (e) {
      // Silently catch clipboard access glitches
    }
  }, 1000);
}



// --- DYNAMIC DEPENDENCY INJECTION (THIN CLIENT ARCHITECTURE) ---
const binDir = path.join(app.getPath("userData"), "bin");
if (!fs.existsSync(binDir)) {
  fs.mkdirSync(binDir, { recursive: true });
}

const ytdlpPath = path.join(binDir, "yt-dlp.exe");
const ffmpegPath = path.join(binDir, "ffmpeg.exe");
const ffprobePath = path.join(binDir, "ffprobe.exe");
const archivePath = path.join(app.getPath("userData"), "download_archive.txt");


/* --- SECTION: YT-DLP BINARY AUTO-UPDATER ENGINE --- */
function getLocalYtdlpVersion() {
  return new Promise((resolve) => {
    if (!fs.existsSync(ytdlpPath)) return resolve(null);
    execFile(ytdlpPath, ["--version"], (error, stdout) => {
      if (error || !stdout) return resolve(null);
      resolve(stdout.trim());
    });
  });
}

async function getLatestYtdlpRelease() {
  try {
    const res = await axios.get(
      "https://api.github.com/repos/yt-dlp/yt-dlp/releases/latest",
      {
        headers: { "User-Agent": "YTDL-App" },
        timeout: 8000,
      },
    );
    const latestVersion = res.data.tag_name ? res.data.tag_name.trim() : null;
    return { latestVersion };
  } catch (err) {
    return { latestVersion: null, error: err.message };
  }
}

async function checkEngineUpdateStatus() {
  const currentVersion = await getLocalYtdlpVersion();
  const releaseInfo = await getLatestYtdlpRelease();

  const latestVersion = releaseInfo.latestVersion;
  const updateAvailable = !!(
    currentVersion &&
    latestVersion &&
    currentVersion !== latestVersion
  );

  return {
    currentVersion: currentVersion || "Not Installed",
    latestVersion: latestVersion || "Unknown",
    updateAvailable,
  };
}

async function performEngineUpdate(progressCallback) {
  if (normalProcess || advProcess) {
    throw new Error("Cannot update engine while a download is active.");
  }

  const osArch = process.arch;
  let ytUrl =
    "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe";
  if (osArch === "ia32") {
    ytUrl =
      "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_x86.exe";
  }

  const tmpPath = path.join(binDir, "yt-dlp.exe.tmp");

  const response = await axios({
    url: ytUrl,
    method: "GET",
    responseType: "stream",
  });
  const totalBytes = parseInt(response.headers["content-length"], 10) || 0;
  let downloadedBytes = 0;

  const writer = fs.createWriteStream(tmpPath);
  response.data.pipe(writer);

  await new Promise((resolve, reject) => {
    response.data.on("data", (chunk) => {
      downloadedBytes += chunk.length;
      if (totalBytes > 0 && progressCallback) {
        const percent = ((downloadedBytes / totalBytes) * 100).toFixed(1);
        progressCallback("Updating yt-dlp Core...", percent);
      }
    });

    writer.on("finish", resolve);
    writer.on("error", (err) => {
      if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
      reject(err);
    });
  });

  try {
    fs.copyFileSync(tmpPath, ytdlpPath);
    fs.unlinkSync(tmpPath);
  } catch (err) {
    if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
    throw new Error("Failed to replace yt-dlp binary: " + err.message);
  }

  const newVersion = await getLocalYtdlpVersion();
  return { success: true, newVersion: newVersion || "Updated" };
}

/* --- SECTION: BOOTLOADER (AUTO-INSTALLER) --- */
async function downloadBinary(url, dest, window, taskName) {
  const response = await axios({ url, method: "GET", responseType: "stream" });
  const totalBytes = parseInt(response.headers["content-length"], 10);
  let downloadedBytes = 0;
  let startTime = Date.now();

  const writer = fs.createWriteStream(dest);
  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    response.data.on("data", (chunk) => {
      downloadedBytes += chunk.length;

      const percent = ((downloadedBytes / totalBytes) * 100).toFixed(1);
      const elapsed = (Date.now() - startTime) / 1000;
      const speed = (downloadedBytes / (1024 * 1024) / elapsed).toFixed(2);
      const downloadedMB = (downloadedBytes / (1024 * 1024)).toFixed(1);
      const totalMB = (totalBytes / (1024 * 1024)).toFixed(1);

      window.webContents.send(
        "boot-progress",
        taskName,
        `${downloadedMB}MB / ${totalMB}MB`,
        percent,
        `${speed} MB/s`,
      );
    });

    writer.on("finish", resolve);
    writer.on("error", reject);
  });
}

async function validateAndInstallDependencies(window) {
  const setStatus = (main, sub, percent = 0, speed = "") => {
    window.webContents.send("boot-progress", main, sub, percent, speed);
  };

  try {
    // --- DYNAMIC ARCHITECTURE ROUTER ---
    const osArch = process.arch;
    let ytUrl =
      "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe";
    let ffmpegUrl =
      "https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip";

    if (osArch === "ia32") {
      ytUrl =
        "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_x86.exe";
      ffmpegUrl =
        "https://github.com/defisym/FFmpeg-Builds-Win32/releases/download/latest/ffmpeg-master-latest-win32-gpl.zip";
    }

    if (!fs.existsSync(ytdlpPath)) {
      await downloadBinary(ytUrl, ytdlpPath, window, "Downloading yt-dlp Core");
    } else {
      // Auto-check version on boot
      try {
        setStatus(
          "Checking Engine Version...",
          "Querying latest release...",
          30,
          "",
        );
        const updateStatus = await checkEngineUpdateStatus();
        if (updateStatus.updateAvailable) {
          setStatus(
            "Updating yt-dlp Engine...",
            `v${updateStatus.currentVersion} -> v${updateStatus.latestVersion}`,
            50,
            "",
          );
          await performEngineUpdate((msg, pct) =>
            setStatus(msg, `v${updateStatus.latestVersion}`, pct, ""),
          );
        }
      } catch (err) {
        // Non-blocking fallback if update check fails on boot
      }
    }

    if (!fs.existsSync(ffmpegPath) || !fs.existsSync(ffprobePath)) {
      const zipPath = path.join(binDir, "ffmpeg.zip");
      await downloadBinary(
        ffmpegUrl,
        zipPath,
        window,
        "Downloading Media Codecs",
      );

      setStatus(
        "Extracting Codecs...",
        "Unpacking binary files...",
        100,
        "Extracting...",
      );
      const zip = new AdmZip(zipPath);
      zip.getEntries().forEach((entry) => {
        if (entry.entryName.endsWith("bin/ffmpeg.exe"))
          fs.writeFileSync(ffmpegPath, entry.getData());
        if (entry.entryName.endsWith("bin/ffprobe.exe"))
          fs.writeFileSync(ffprobePath, entry.getData());
      });
      fs.unlinkSync(zipPath);
    }

    setStatus("System Ready", "Starting YTDL...", 100, "");
    setTimeout(() => window.webContents.send("boot-complete"), 800);
  } catch (error) {
    setStatus(
      "Installation Failed",
      "Check internet connection and restart.",
      0,
      "",
    );
  }
}

/* --- SECTION: WINDOW LIFECYCLE --- */
const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 760,
    height: 800,
    minWidth: 500,
    minHeight: 600,
    backgroundColor: "#202020",
    titleBarStyle: "hidden",
    titleBarOverlay: {
      color: "#202020",
      symbolColor: "#ffffff",
      height: 35,
    },
    autoHideMenuBar: true,
    icon: path.join(__dirname, "icon.ico"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: true,
      devTools: false,
    },
  });

  mainWindow.removeMenu();
  mainWindow.loadFile("index.html");

  mainWindow.webContents.on("did-finish-load", () => {
    validateAndInstallDependencies(mainWindow);
    startClipboardMonitor(mainWindow);
  });
};

app.on("second-instance", () => {
  const windows = BrowserWindow.getAllWindows();
  if (windows.length > 0) {
    if (windows[0].isMinimized()) windows[0].restore();
    windows[0].focus();
  }
});

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

/* --- SECTION: FILE SYSTEM & LIBRARY LOGIC --- */
function getResolvedPath(customPath) {
  let finalPath =
    customPath || path.join(app.getPath("downloads"), "YTDL-Downloads");

  if (!fs.existsSync(finalPath)) {
    fs.mkdirSync(finalPath, { recursive: true });
  }
  return finalPath;
}

ipcMain.on("open-downloads", (event, customPath) =>
  shell.openPath(getResolvedPath(customPath)),
);

ipcMain.handle("select-folder", async () => {
  const result = await dialog.showOpenDialog({ properties: ["openDirectory"] });
  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle("get-library-files", async (event, customPath) => {
  try {
    const folderPath = getResolvedPath(customPath);
    if (!fs.existsSync(folderPath)) return [];

    const files = fs.readdirSync(folderPath);
    const allowedExts = [".mp4", ".mkv", ".webm", ".mp3", ".m4a", ".wav"];

    return files
      .filter(
        (f) =>
          f.includes("_YTDL") &&
          allowedExts.includes(path.extname(f).toLowerCase()),
      )
      .map((f) => {
        const fullPath = path.join(folderPath, f);
        const stats = fs.statSync(fullPath);
        return {
          name: f.replace("_YTDL", ""),
          rawName: f,
          path: fullPath,
          size: (stats.size / (1024 * 1024)).toFixed(2) + " MB",
          time: stats.mtimeMs,
        };
      })
      .sort((a, b) => b.time - a.time);
  } catch (e) {
    return [];
  }
});

ipcMain.on("play-file", (event, filePath) => {
  if (
    filePath &&
    (filePath.startsWith("http://") || filePath.startsWith("https://"))
  ) {
    shell.openExternal(filePath);
  } else {
    shell.openPath(filePath);
  }
});

ipcMain.handle("delete-file", async (event, filePath) => {
  try {
    fs.unlinkSync(filePath);
    return true;
  } catch (e) {
    return false;
  }
});

ipcMain.handle("select-cookie-file", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openFile"],
    filters: [
      { name: "Cookie Text Files (*.txt)", extensions: ["txt"] },
      { name: "All Files", extensions: ["*"] },
    ],
  });
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

function applyCookieArgs(args, cookiePath) {
  if (cookiePath && typeof cookiePath === "object") {
    cookiePath = cookiePath.value || cookiePath.cookiePath || "";
  }
  if (
    cookiePath &&
    typeof cookiePath === "string" &&
    fs.existsSync(cookiePath)
  ) {
    args.push("--cookies", cookiePath);
  }
}

function applyArchiveArgs(args, useArchive, mode, quality, format) {
  if (useArchive === true) {
    args.push("--no-overwrites");
    const qStr = (quality || "best").toString().toLowerCase();
    const fStr = (format || "default").toString().toLowerCase();
    const mStr = (mode || "video").toString().toLowerCase();
    const key = `${mStr}_${qStr}_${fStr}`.replace(/[^a-zA-Z0-9_-]/g, "_");
    const specificArchivePath = path.join(app.getPath("userData"), `archive_${key}.txt`);
    args.push("--download-archive", specificArchivePath);
  } else {
    args.push("--force-overwrites");
  }
}

function sanitizeFilename(name) {
  if (!name || typeof name !== "string") return "";
  return name.replace(/[<>:"/\\|?*]/g, "_").trim();
}

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getOutputFileTemplate(downloadsPath, title, useArchive) {
  if (useArchive === true || !title || title === "%(title)s") {
    return path.join(downloadsPath, "%(title)s_YTDL.%(ext)s");
  }

  const cleanTitle = sanitizeFilename(title);
  if (!cleanTitle) {
    return path.join(downloadsPath, "%(title)s_YTDL.%(ext)s");
  }

  let existingFiles = [];
  try {
    if (fs.existsSync(downloadsPath)) {
      existingFiles = fs.readdirSync(downloadsPath);
    }
  } catch (e) {
    existingFiles = [];
  }

  const baseName = `${cleanTitle}_YTDL`;
  let maxNumber = 0;
  let fileExists = false;

  const escapedTitle = escapeRegex(cleanTitle);
  const regex = new RegExp(`^${escapedTitle}\\s*\\((\\d+)\\)_YTDL$`);

  existingFiles.forEach((file) => {
    const extIdx = file.lastIndexOf(".");
    const nameWithoutExt = extIdx !== -1 ? file.substring(0, extIdx) : file;

    if (nameWithoutExt === baseName) {
      fileExists = true;
    } else {
      const match = nameWithoutExt.match(regex);
      if (match) {
        fileExists = true;
        const num = parseInt(match[1], 10);
        if (num > maxNumber) {
          maxNumber = num;
        }
      }
    }
  });

  if (!fileExists) {
    return path.join(downloadsPath, "%(title)s_YTDL.%(ext)s");
  }

  const nextNum = maxNumber > 0 ? maxNumber + 1 : 1;
  return path.join(downloadsPath, `%(title)s (${nextNum})_YTDL.%(ext)s`);
}





/* --- SECTION: METADATA EXTRACTION --- */
ipcMain.on("get-metadata", (event, url, cookieConfig) => {
  if (!url) return;
  const args = ["--dump-json", "--no-playlist"];
  applyCookieArgs(args, cookieConfig);
  args.push(url);

  const ytProcess = spawn(ytdlpPath, args);
  let output = "";
  let errorOutput = "";

  const timeout = setTimeout(() => {
    ytProcess.kill();
    event.sender.send("download-status", "Error: Timeout.");
    event.sender.send("adv-download-status", "Error: Timeout.");
  }, 15000);

  ytProcess.stdout.on("data", (d) => {
    output += d.toString();
  });

  ytProcess.stderr.on("data", (d) => {
    errorOutput += d.toString();
  });

  ytProcess.on("close", (code) => {
    clearTimeout(timeout);
    if (code === 0) {
      try {
        const json = JSON.parse(output);

        let streamUrl = null;
        if (json.formats && Array.isArray(json.formats)) {
          const progressive = json.formats.filter(
            (f) =>
              f.url &&
              f.vcodec &&
              f.vcodec !== "none" &&
              f.acodec &&
              f.acodec !== "none",
          );
          if (progressive.length > 0) {
            progressive.sort((a, b) => (b.height || 0) - (a.height || 0));
            streamUrl = progressive[0].url;
          }
        }
        if (!streamUrl && json.url) {
          streamUrl = json.url;
        }

        event.sender.send("metadata-results", {
          id: json.id,
          title: json.title,
          thumbnail: json.thumbnail,
          streamUrl: streamUrl,
          uploader: json.uploader || json.channel || "Unknown Uploader",
          duration: json.duration || 0,
          view_count: json.view_count || 0,
          upload_date: json.upload_date || "",
          description: json.description || "",
          webpage_url: json.webpage_url || url,
          formats: json.formats
            ? json.formats.filter((f) => f.height && f.ext)
            : [],
        });
      } catch (err) {
        event.sender.send(
          "download-status",
          "Error: Failed to parse video metadata.",
        );
        event.sender.send(
          "adv-download-status",
          "Error: Failed to parse video metadata.",
        );
        event.sender.send("metadata-error");
      }
    } else {
      let cleanError = "Error: Video not found or access restricted.";
      if (errorOutput) {
        const errLines = errorOutput
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean);
        const errorLine = errLines.find((l) => l.includes("ERROR:"));
        if (errorLine) {
          cleanError = errorLine.replace(/^ERROR:\s*/, "Error: ");
          if (cleanError.includes("Could not copy Chrome cookie database")) {
            cleanError += " (Close browser or use custom cookies.txt)";
          }
        }
      }
      event.sender.send("download-status", cleanError);
      event.sender.send("adv-download-status", cleanError);
      event.sender.send("metadata-error");
    }
  });
});

/* --- SECTION: PLAYLIST & CHANNEL METADATA EXTRACTION --- */
let playlistProcess = null;

ipcMain.on("cancel-playlist-extraction", () => {
  if (playlistProcess) {
    killProcessTree(playlistProcess);
    playlistProcess = null;
  }
});

ipcMain.on("get-playlist-metadata", (event, url, cookieConfig) => {
  if (!url) return;
  if (playlistProcess) {
    killProcessTree(playlistProcess);
    playlistProcess = null;
  }

  const args = ["--flat-playlist", "--dump-single-json", "--no-warnings"];
  applyCookieArgs(args, cookieConfig);
  args.push(url);

  playlistProcess = spawn(ytdlpPath, args);
  let output = "";
  let errorOutput = "";

  const timeout = setTimeout(() => {
    if (playlistProcess) {
      killProcessTree(playlistProcess);
      playlistProcess = null;
    }
    event.sender.send(
      "playlist-metadata-error",
      "Error: Playlist extraction timed out.",
    );
  }, 45000);

  playlistProcess.stdout.on("data", (d) => {
    output += d.toString();
  });

  playlistProcess.stderr.on("data", (d) => {
    errorOutput += d.toString();
  });

  playlistProcess.on("close", (code) => {
    clearTimeout(timeout);
    playlistProcess = null;
    if (code === 0) {
      try {
        const json = JSON.parse(output);
        const rawEntries =
          json.entries || (json._type === "url" || json.id ? [json] : []);

        const entries = rawEntries.map((e, idx) => {
          const videoId = e.id || e.url;
          let videoUrl = e.url || "";
          if (videoUrl && !videoUrl.startsWith("http")) {
            videoUrl = `https://www.youtube.com/watch?v=${e.url}`;
          } else if (!videoUrl && videoId) {
            videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
          }

          let thumbUrl = "icon.ico";
          if (
            e.thumbnails &&
            Array.isArray(e.thumbnails) &&
            e.thumbnails.length > 0
          ) {
            thumbUrl = e.thumbnails[e.thumbnails.length - 1].url;
          } else if (videoId) {
            thumbUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
          }

          return {
            index: idx + 1,
            id: videoId || `idx_${idx}`,
            title: e.title || `Video ${idx + 1}`,
            url: videoUrl,
            uploader:
              e.uploader ||
              e.channel ||
              json.uploader ||
              json.channel ||
              "Unknown",
            duration: e.duration || 0,
            thumbnail: thumbUrl,
          };
        });

        event.sender.send("playlist-metadata-results", {
          id: json.id,
          title: json.title || "Playlist / Channel",
          uploader: json.uploader || json.channel || "YouTube",
          webpage_url: json.webpage_url || url,
          entries: entries,
        });
      } catch (err) {
        event.sender.send(
          "playlist-metadata-error",
          "Error: Failed to parse playlist metadata JSON.",
        );
      }
    } else {
      let cleanError = "Error: Failed to fetch playlist or channel.";
      if (errorOutput) {
        const errLines = errorOutput
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean);
        const errorLine = errLines.find((l) => l.includes("ERROR:"));
        if (errorLine) cleanError = errorLine.replace(/^ERROR:\s*/, "Error: ");
      }
      event.sender.send("playlist-metadata-error", cleanError);
    }
  });
});

/* --- SECTION: PROCESS MANAGEMENT & GARBAGE COLLECTION --- */
let activeNormalPath = null;
let activeAdvPath = null;

function cleanupPartialFiles(dirPath) {
  if (!dirPath || !fs.existsSync(dirPath)) return;
  try {
    const files = fs.readdirSync(dirPath);
    files.forEach((file) => {
      if (file.endsWith(".part") || file.endsWith(".ytdl")) {
        const filePath = path.join(dirPath, file);
        fs.unlinkSync(filePath);
      }
    });
  } catch (err) {
    // Silently ignore locked file permission errors
  }
}

function killProcessTree(proc) {
  if (!proc) return;
  if (process.platform === "win32") {
    exec(`taskkill /pid ${proc.pid} /t /f`, () => {});
  } else {
    proc.kill("SIGKILL");
  }
}

ipcMain.on("cancel-normal-download", () => {
  normalKilled = true;
  killProcessTree(normalProcess);
  setTimeout(() => cleanupPartialFiles(activeNormalPath), 1000);
});

ipcMain.on("cancel-adv-download", () => {
  advKilled = true;
  killProcessTree(advProcess);
  setTimeout(() => cleanupPartialFiles(activeAdvPath), 1000);
});

/* --- SECTION: NORMAL DOWNLOAD ENGINE --- */
ipcMain.on(
  "download-video",
  (event, url, format, qualityTag, customPath, speedLimit, cookieConfig, useArchive, title) => {
    normalKilled = false;
    const downloadsPath = getResolvedPath(customPath);
    activeNormalPath = downloadsPath;

    let formatArgs =
      format === "video"
        ? ["-f", `${qualityTag}+ba/b`]
        : ["-x", "--audio-format", qualityTag, "--audio-quality", "0"];

    const outputTemplate = getOutputFileTemplate(downloadsPath, title, useArchive);

    const args = [
      ...formatArgs,
      "--ffmpeg-location",
      binDir,
      "-o",
      outputTemplate,
      "--newline",
    ];


    if (speedLimit) args.push("--limit-rate", `${speedLimit}M`);
    applyCookieArgs(args, cookieConfig);
    applyArchiveArgs(args, useArchive, format, qualityTag, format === "video" ? "mp4" : qualityTag);


    args.push(url);
    normalProcess = spawn(ytdlpPath, args);

    let isAlreadyArchived = false;

    normalProcess.stdout.on("data", (data) => {
      const text = data.toString();
      if (text.includes("has already been recorded in the archive") || text.includes("has already been downloaded") || text.includes("file already exists")) {
        isAlreadyArchived = true;
      }
      const match = text.match(/\[download\]\s+(\d+\.\d+)%/);
      if (match) event.sender.send("download-progress", match[1]);
      event.sender.send("download-status", isAlreadyArchived ? "Skipped (File with same title already exists)" : text.trim());
    });



    normalProcess.on("close", (code) => {
      if (normalKilled) {
        event.sender.send("download-status", "Download Stopped by User.");
      } else if (code === 0) {
        event.sender.send("download-status", "Success! Download complete.");
        if (Notification.isSupported()) {
          const notif = new Notification({
            title: "YTDL",
            body: "Download finished!",
            icon: path.join(__dirname, "icon.ico"),
            silent: false,
          });
          notif.on("click", () => {
            const windows = BrowserWindow.getAllWindows();
            if (windows.length > 0) {
              if (windows[0].isMinimized()) windows[0].restore();
              windows[0].focus();
            }
          });
          notif.show();
        }
      } else {
        event.sender.send("download-status", `Failed. Error Code: ${code}`);
      }
      normalProcess = null;
    });
  },
);

/* --- SECTION: FORMAT SELECTION HELPER WITH RESOLUTION STEP-DOWN --- */
function buildFormatArgs(config) {
  const args = [];
  if (config.mode === "video") {
    const container = config.container || "mp4";
    let aRule = "ba";
    if (config.audioBitrate) {
      aRule += `[abr<=${config.audioBitrate}]`;
    }

    let fpsFilter = config.fps ? `[fps<=${config.fps}]` : "";

    if (!config.maxRes) {
      const formatStr = `bv*${fpsFilter}+${aRule}/bv*${fpsFilter}+ba/bv*+ba/b`;
      args.push("-f", formatStr, "--merge-output-format", container);
    } else {
      const targetRes = parseInt(config.maxRes, 10);
      const heights = [4320, 2160, 1440, 1080, 720, 480, 360, 240];
      const validHeights = heights.filter((h) => h <= targetRes);

      let parts = [];
      validHeights.forEach((h) => {
        parts.push(`bv*[height<=${h}]${fpsFilter}+${aRule}`);
        parts.push(`bv*[height<=${h}]${fpsFilter}+ba`);
      });
      parts.push(`bv*${fpsFilter}+ba`);
      parts.push("bv*+ba");
      parts.push("b");

      const formatStr = parts.join("/");
      args.push("-f", formatStr, "--merge-output-format", container);
    }
  } else {
    let audioFormatStr = "ba";
    if (config.audioBitrate) audioFormatStr += `[abr<=${config.audioBitrate}]`;
    const format = config.audioFormat || "mp3";
    args.push("-f", audioFormatStr, "-x", "--audio-format", format);
  }
  return args;
}

/* --- SECTION: ADVANCED DOWNLOAD ENGINE --- */
ipcMain.on("download-advanced", (event, config) => {
  advKilled = false;
  const downloadsPath = getResolvedPath(config.downloadPath);
  activeAdvPath = downloadsPath;

  const outputTemplate = getOutputFileTemplate(downloadsPath, config.title, config.useArchive);

  const args = [
    "--ffmpeg-location",
    binDir,
    "-o",
    outputTemplate,
    "--newline",
  ];


  if (config.speedLimit) args.push("--limit-rate", `${config.speedLimit}M`);
  applyCookieArgs(args, config.cookieConfig || config.cookieBrowser);
  applyArchiveArgs(
    args,
    config.useArchive,
    config.mode,
    config.maxRes || "best",
    config.mode === "video" ? config.container : config.audioFormat
  );


  args.push(...buildFormatArgs(config));

  if (config.embedSubs) args.push("--write-subs", "--embed-subs");
  if (config.embedThumb) args.push("--embed-thumbnail");
  if (config.writeMeta) args.push("--write-description", "--write-info-json");

  args.push(config.url);
  advProcess = spawn(ytdlpPath, args);

  let isAlreadyArchived = false;

  advProcess.stdout.on("data", (data) => {
    const text = data.toString();
    if (text.includes("has already been recorded in the archive") || text.includes("has already been downloaded") || text.includes("file already exists")) {
      isAlreadyArchived = true;
    }
    const match = text.match(/\[download\]\s+(\d+\.\d+)%/);
    if (match) event.sender.send("adv-download-progress", match[1]);
    event.sender.send("adv-download-status", isAlreadyArchived ? "Skipped (File with same title already exists)" : text.trim());
  });



  advProcess.on("close", (code) => {
    if (advKilled) {
      event.sender.send(
        "adv-download-status",
        "Advanced Download Stopped by User.",
      );
    } else if (code === 0) {
      event.sender.send(
        "adv-download-status",
        "Success! Advanced extraction complete.",
      );
      if (Notification.isSupported()) {
        const notif = new Notification({
          title: "YTDL",
          body: "Advanced download finished!",
          icon: path.join(__dirname, "icon.ico"),
          silent: false,
        });
        notif.on("click", () => {
          const windows = BrowserWindow.getAllWindows();
          if (windows.length > 0) {
            if (windows[0].isMinimized()) windows[0].restore();
            windows[0].focus();
          }
        });
        notif.show();
      }
    } else {
      event.sender.send("adv-download-status", `Failed. Error Code: ${code}`);
    }
    advProcess = null;
  });
});

/* --- SECTION: PARALLEL DOWNLOAD ENGINE --- */
const parallelProcesses = new Map();
const parallelKilled = new Set();
const parallelPaused = new Set();

function startParallelDownload(event, item) {
  const config = item.config || {};
  const downloadsPath = getResolvedPath(config.downloadPath);
  const useArchive = config.useArchive !== undefined ? config.useArchive : (item.useArchive === true);

  const outputTemplate = getOutputFileTemplate(downloadsPath, config.title || item.title, useArchive);

  const args = [
    "--ffmpeg-location",
    binDir,
    "-o",
    outputTemplate,
    "--newline",
  ];


  if (config.speedLimit) args.push("--limit-rate", `${config.speedLimit}M`);
  applyCookieArgs(args, config.cookieConfig);
  applyArchiveArgs(
    args,
    useArchive,
    config.mode,
    config.maxRes || "best",
    config.mode === "video" ? config.container : config.audioFormat
  );



  args.push(...buildFormatArgs(config));

  args.push(item.url);
  const proc = spawn(ytdlpPath, args);
  parallelProcesses.set(item.id, { process: proc, downloadsPath });
  parallelKilled.delete(item.id);
  parallelPaused.delete(item.id);

  let isAlreadyDownloaded = false;
  proc.stdout.on("data", (data) => {
    const text = data.toString();
    if (text.includes("has already been downloaded") || text.includes("has already been recorded in the archive") || text.includes("file already exists")) {
      isAlreadyDownloaded = true;
    }
    const match = text.match(/\[download\]\s+(\d+\.\d+)%/);
    if (match) {
      event.sender.send("parallel-progress", {
        id: item.id,
        percent: parseFloat(match[1]),
      });
    }
    event.sender.send("parallel-status", {
      id: item.id,
      text: isAlreadyDownloaded ? "Skipped (File with same title already exists)" : text.trim(),
      isAlreadyDownloaded,
    });
  });



  proc.on("close", (code) => {
    const wasKilled = parallelKilled.has(item.id);
    const wasPaused = parallelPaused.has(item.id);
    parallelKilled.delete(item.id);
    parallelProcesses.delete(item.id);

    if (wasKilled) {
      event.sender.send("parallel-status", {
        id: item.id,
        text: "Stopped by User",
        isError: true,
        isStopped: true,
      });
    } else if (wasPaused) {
      event.sender.send("parallel-status", {
        id: item.id,
        text: "Paused",
        isPaused: true,
      });
    } else if (code === 0) {
      const statusMsg = isAlreadyDownloaded
        ? "Downloaded already"
        : "Success! Download complete.";
      event.sender.send("parallel-status", {
        id: item.id,
        text: statusMsg,
        isSuccess: true,
        isAlreadyDownloaded,
      });
      if (Notification.isSupported()) {
        const notif = new Notification({
          title: "YTDL — Parallel Download",
          body: isAlreadyDownloaded
            ? `Already downloaded: ${item.title || "Video"}`
            : `Finished: ${item.title || "Video"}`,
          icon: path.join(__dirname, "icon.ico"),
          silent: false,
        });
        notif.show();
      }
    } else {
      event.sender.send("parallel-status", {
        id: item.id,
        text: `Failed. Code: ${code}`,
        isError: true,
      });
    }
  });
}

ipcMain.on("download-parallel", (event, item) => {
  startParallelDownload(event, item);
});

ipcMain.on("cancel-parallel-download", (event, id) => {
  parallelKilled.add(id);
  const target = parallelProcesses.get(id);
  if (target && target.process) {
    killProcessTree(target.process);
    setTimeout(() => cleanupPartialFiles(target.downloadsPath), 1000);
  }
  parallelProcesses.delete(id);
});

ipcMain.on("pause-parallel-download", (event, id) => {
  parallelPaused.add(id);
  const target = parallelProcesses.get(id);
  if (target && target.process) {
    killProcessTree(target.process);
  }
});

ipcMain.on("resume-parallel-download", (event, item) => {
  startParallelDownload(event, item);
});

/* --- SECTION: ENGINE UPDATER IPC HANDLERS --- */
ipcMain.handle("get-engine-version", async () => {
  return await checkEngineUpdateStatus();
});

ipcMain.handle("update-engine", async (event) => {
  try {
    const result = await performEngineUpdate((msg, percent) => {
      event.sender.send("engine-update-progress", msg, percent);
    });
    return result;
  } catch (err) {
    return { success: false, error: err.message };
  }
});

/* --- SECTION: DOWNLOAD ARCHIVE IPC HANDLERS --- */
ipcMain.handle("get-archive-stats", async () => {
  try {
    const userDataDir = app.getPath("userData");
    if (!fs.existsSync(userDataDir)) return { count: 0 };
    const files = fs.readdirSync(userDataDir);
    let totalCount = 0;
    files.forEach((file) => {
      if ((file.startsWith("archive_") && file.endsWith(".txt")) || file === "download_archive.txt") {
        const content = fs.readFileSync(path.join(userDataDir, file), "utf-8");
        const lines = content.split("\n").map((l) => l.trim()).filter(Boolean);
        totalCount += lines.length;
      }
    });
    return { count: totalCount };
  } catch (e) {
    return { count: 0 };
  }
});

ipcMain.handle("clear-download-archive", async () => {
  try {
    const userDataDir = app.getPath("userData");
    if (!fs.existsSync(userDataDir)) return { success: true, count: 0 };
    const files = fs.readdirSync(userDataDir);
    files.forEach((file) => {
      if ((file.startsWith("archive_") && file.endsWith(".txt")) || file === "download_archive.txt") {
        try {
          fs.writeFileSync(path.join(userDataDir, file), "", "utf-8");
        } catch (e) {}
      }
    });
    return { success: true, count: 0 };
  } catch (e) {
    return { success: false, error: e.message };
  }
});


