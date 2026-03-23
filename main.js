/* --- SECTION: IMPORTS & CORE CONFIGURATION --- */
const { app, BrowserWindow, ipcMain, shell, Notification, dialog } = require('electron');
const path = require('path');
const { spawn, exec } = require('child_process');
const fs = require('fs');
const axios = require('axios');
const AdmZip = require('adm-zip');

// --- SECTION: GLOBAL ERROR HANDLERS ---
// Prevents ugly Developer Stack Trace popups if a fatal Node.js error occurs
process.on('uncaughtException', (error) => {
  // Silently absorb fatal errors in production
});
process.on('unhandledRejection', (error) => {
  // Silently absorb unhandled promise rejections
});

// Force Windows to recognize the app before the lifecycle starts
app.setName('YTDL');
app.setAppUserModelId('com.ditom.ytdl.app');

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

// --- DYNAMIC DEPENDENCY INJECTION (THIN CLIENT ARCHITECTURE) ---
const binDir = path.join(app.getPath('userData'), 'bin');
if (!fs.existsSync(binDir)) {
  fs.mkdirSync(binDir, { recursive: true });
}

const ytdlpPath = path.join(binDir, 'yt-dlp.exe');
const ffmpegPath = path.join(binDir, 'ffmpeg.exe');
const ffprobePath = path.join(binDir, 'ffprobe.exe');

/* --- SECTION: BOOTLOADER (AUTO-INSTALLER) --- */
async function downloadBinary(url, dest, window, taskName) {
  const response = await axios({ url, method: 'GET', responseType: 'stream' });
  const totalBytes = parseInt(response.headers['content-length'], 10);
  let downloadedBytes = 0;
  let startTime = Date.now();

  const writer = fs.createWriteStream(dest);
  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    response.data.on('data', (chunk) => {
      downloadedBytes += chunk.length;

      const percent = ((downloadedBytes / totalBytes) * 100).toFixed(1);
      const elapsed = (Date.now() - startTime) / 1000;
      const speed = (downloadedBytes / (1024 * 1024) / elapsed).toFixed(2);
      const downloadedMB = (downloadedBytes / (1024 * 1024)).toFixed(1);
      const totalMB = (totalBytes / (1024 * 1024)).toFixed(1);

      window.webContents.send(
        'boot-progress',
        taskName,
        `${downloadedMB}MB / ${totalMB}MB`,
        percent,
        `${speed} MB/s`
      );
    });

    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}

async function validateAndInstallDependencies(window) {
  const setStatus = (main, sub, percent = 0, speed = '') => {
    window.webContents.send('boot-progress', main, sub, percent, speed);
  };

  try {
    // --- DYNAMIC ARCHITECTURE ROUTER ---
    const osArch = process.arch; 
    let ytUrl = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe';
    let ffmpegUrl = 'https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip';

    if (osArch === 'ia32') {
      ytUrl = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_x86.exe';
      ffmpegUrl = 'https://github.com/defisym/FFmpeg-Builds-Win32/releases/download/latest/ffmpeg-master-latest-win32-gpl.zip';
    } 

    if (!fs.existsSync(ytdlpPath)) {
      await downloadBinary(ytUrl, ytdlpPath, window, 'Downloading yt-dlp Core');
    }

    if (!fs.existsSync(ffmpegPath) || !fs.existsSync(ffprobePath)) {
      const zipPath = path.join(binDir, 'ffmpeg.zip');
      await downloadBinary(ffmpegUrl, zipPath, window, 'Downloading Media Codecs');

      setStatus('Extracting Codecs...', 'Unpacking binary files...', 100, 'Extracting...');
      const zip = new AdmZip(zipPath);
      zip.getEntries().forEach((entry) => {
        if (entry.entryName.endsWith('bin/ffmpeg.exe')) fs.writeFileSync(ffmpegPath, entry.getData());
        if (entry.entryName.endsWith('bin/ffprobe.exe')) fs.writeFileSync(ffprobePath, entry.getData());
      });
      fs.unlinkSync(zipPath);
    }

    setStatus('System Ready', 'Starting YTDL...', 100, '');
    setTimeout(() => window.webContents.send('boot-complete'), 800);
  } catch (error) {
    setStatus('Installation Failed', 'Check internet connection and restart.', 0, '');
  }
}

/* --- SECTION: WINDOW LIFECYCLE --- */
const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 600,
    height: 800,
    minWidth: 450,
    minHeight: 600,
    autoHideMenuBar: true,
    icon: path.join(__dirname, 'icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      devTools: false 
    }
  });

  mainWindow.removeMenu(); 
  mainWindow.loadFile('index.html');

  mainWindow.webContents.on('did-finish-load', () => {
    validateAndInstallDependencies(mainWindow);
  });
};

app.on('second-instance', () => {
  const windows = BrowserWindow.getAllWindows();
  if (windows.length > 0) {
    if (windows[0].isMinimized()) windows[0].restore();
    windows[0].focus();
  }
});

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

/* --- SECTION: FILE SYSTEM & LIBRARY LOGIC --- */
function getResolvedPath(customPath) {
  let finalPath = customPath || path.join(app.getPath('downloads'), 'YTDL-Downloads');

  if (!fs.existsSync(finalPath)) {
    fs.mkdirSync(finalPath, { recursive: true });
  }
  return finalPath;
}

ipcMain.on('open-downloads', (event, customPath) => shell.openPath(getResolvedPath(customPath)));

ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog({ properties: ['openDirectory'] });
  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle('get-library-files', async (event, customPath) => {
  try {
    const folderPath = getResolvedPath(customPath);
    if (!fs.existsSync(folderPath)) return [];
    
    const files = fs.readdirSync(folderPath);
    const allowedExts = ['.mp4', '.mkv', '.webm', '.mp3', '.m4a', '.wav'];

    return files
      .filter((f) => f.includes('_YTDL') && allowedExts.includes(path.extname(f).toLowerCase()))
      .map((f) => {
        const fullPath = path.join(folderPath, f);
        const stats = fs.statSync(fullPath);
        return {
          name: f.replace('_YTDL', ''),
          rawName: f,
          path: fullPath,
          size: (stats.size / (1024 * 1024)).toFixed(2) + ' MB',
          time: stats.mtimeMs
        };
      })
      .sort((a, b) => b.time - a.time);
  } catch (e) {
    return [];
  }
});

ipcMain.on('play-file', (event, filePath) => shell.openPath(filePath));

ipcMain.handle('delete-file', async (event, filePath) => {
  try {
    fs.unlinkSync(filePath);
    return true;
  } catch (e) {
    return false;
  }
});

/* --- SECTION: METADATA EXTRACTION --- */
ipcMain.on('get-metadata', (event, url) => {
  if (!url) return;
  const ytProcess = spawn(ytdlpPath, ['--dump-json', '--no-playlist', url]);
  let output = '';
  
  const timeout = setTimeout(() => {
    ytProcess.kill();
    event.sender.send('download-status', 'Error: Timeout.');
  }, 15000);

  ytProcess.stdout.on('data', (d) => {
    output += d.toString();
  });

  ytProcess.on('close', (code) => {
    clearTimeout(timeout);
    if (code === 0) {
      try {
        const json = JSON.parse(output);
        event.sender.send('metadata-results', {
          title: json.title,
          thumbnail: json.thumbnail,
          formats: json.formats.filter((f) => f.height && f.ext)
        });
      } catch (err) {
        event.sender.send('metadata-error');
      }
    } else {
      event.sender.send('download-status', code === 1 ? 'Error: Video not found.' : 'Error: Analysis failed.');
      event.sender.send('metadata-error');
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
      if (file.endsWith('.part') || file.endsWith('.ytdl')) {
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
  if (process.platform === 'win32') {
    exec(`taskkill /pid ${proc.pid} /t /f`, () => {});
  } else {
    proc.kill('SIGKILL');
  }
}

ipcMain.on('cancel-normal-download', () => {
  normalKilled = true;
  killProcessTree(normalProcess);
  setTimeout(() => cleanupPartialFiles(activeNormalPath), 1000); 
});

ipcMain.on('cancel-adv-download', () => {
  advKilled = true;
  killProcessTree(advProcess);
  setTimeout(() => cleanupPartialFiles(activeAdvPath), 1000);
});

/* --- SECTION: NORMAL DOWNLOAD ENGINE --- */
ipcMain.on('download-video', (event, url, format, qualityTag, customPath, speedLimit) => {
  normalKilled = false;
  const downloadsPath = getResolvedPath(customPath);
  activeNormalPath = downloadsPath;

  let formatArgs = (format === 'video') ? ['-f', `${qualityTag}+ba/b`] : ['-x', '--audio-format', qualityTag, '--audio-quality', '0'];

  const args = [
    ...formatArgs,
    '--ffmpeg-location', binDir,
    '-o', path.join(downloadsPath, '%(title)s_YTDL.%(ext)s'),
    '--newline'
  ];

  if (speedLimit) args.push('--limit-rate', `${speedLimit}M`);

  args.push(url);
  normalProcess = spawn(ytdlpPath, args);

  normalProcess.stdout.on('data', (data) => {
    const text = data.toString();
    const match = text.match(/\[download\]\s+(\d+\.\d+)%/);
    if (match) event.sender.send('download-progress', match[1]);
    event.sender.send('download-status', text.trim());
  });

  normalProcess.on('close', (code) => {
    if (normalKilled) {
      event.sender.send('download-status', 'Download Stopped by User.');
    } else if (code === 0) {
      event.sender.send('download-status', 'Success! Download complete.');
      if (Notification.isSupported()) {
        const notif = new Notification({ 
          title: 'YTDL', 
          body: 'Download finished!', 
          icon: path.join(__dirname, 'icon.ico'), 
          silent: false 
        });
        notif.on('click', () => {
          const windows = BrowserWindow.getAllWindows();
          if (windows.length > 0) {
            if (windows[0].isMinimized()) windows[0].restore();
            windows[0].focus();
          }
        });
        notif.show();
      }
    } else {
      event.sender.send('download-status', `Failed. Error Code: ${code}`);
    }
    normalProcess = null;
  });
});

/* --- SECTION: ADVANCED DOWNLOAD ENGINE --- */
ipcMain.on('download-advanced', (event, config) => {
  advKilled = false;
  const downloadsPath = getResolvedPath(config.downloadPath);
  activeAdvPath = downloadsPath;
  
  const args = [
    '--ffmpeg-location', binDir,
    '-o', path.join(downloadsPath, '%(title)s_YTDL.%(ext)s'),
    '--newline'
  ];

  if (config.speedLimit) args.push('--limit-rate', `${config.speedLimit}M`);

  if (config.mode === 'video') {
    let vRule = 'bv*';
    let aRule = 'ba';
    let fallback = 'b';
    
    if (config.container === 'mp4') { vRule += '[ext=mp4]'; aRule += '[ext=m4a]'; fallback += '[ext=mp4]'; } 
    else if (config.container === 'webm') { vRule += '[ext=webm]'; aRule += '[ext=webm]'; fallback += '[ext=webm]'; }
    
    if (config.maxRes) { vRule += `[height<=${config.maxRes}]`; fallback += `[height<=${config.maxRes}]`; }
    if (config.fps) { vRule += `[fps<=${config.fps}]`; fallback += `[fps<=${config.fps}]`; }
    if (config.audioBitrate) { aRule += `[abr<=${config.audioBitrate}]`; }
    
    const formatStr = `${vRule}+${aRule}/${fallback}/bv*+ba/b`;
    args.push('-f', formatStr, '--merge-output-format', config.container);
  } else {
    let audioFormatStr = 'ba';
    if (config.audioBitrate) audioFormatStr += `[abr<=${config.audioBitrate}]`;
    args.push('-f', audioFormatStr, '-x', '--audio-format', config.audioFormat);
  }

  if (config.embedSubs) args.push('--write-subs', '--embed-subs');
  if (config.embedThumb) args.push('--embed-thumbnail');
  if (config.writeMeta) args.push('--write-description', '--write-info-json');

  args.push(config.url);
  advProcess = spawn(ytdlpPath, args);

  advProcess.stdout.on('data', (data) => {
    const text = data.toString();
    const match = text.match(/\[download\]\s+(\d+\.\d+)%/);
    if (match) event.sender.send('adv-download-progress', match[1]);
    event.sender.send('adv-download-status', text.trim());
  });

  advProcess.on('close', (code) => {
    if (advKilled) {
      event.sender.send('adv-download-status', 'Advanced Download Stopped by User.');
    } else if (code === 0) {
      event.sender.send('adv-download-status', 'Success! Advanced extraction complete.');
      if (Notification.isSupported()) {
        const notif = new Notification({ 
          title: 'YTDL', 
          body: 'Advanced download finished!', 
          icon: path.join(__dirname, 'icon.ico'), 
          silent: false 
        });
        notif.on('click', () => {
          const windows = BrowserWindow.getAllWindows();
          if (windows.length > 0) {
            if (windows[0].isMinimized()) windows[0].restore();
            windows[0].focus();
          }
        });
        notif.show();
      }
    } else {
      event.sender.send('adv-download-status', `Failed. Error Code: ${code}`);
    }
    advProcess = null;
  });
});