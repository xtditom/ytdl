/* --- SECTION: BOOTLOADER LOGIC --- */
const bootProgressWrapper = document.getElementById("bootProgressWrapper");
const bootProgressBar = document.getElementById("bootProgressBar");
const bootSpeedText = document.getElementById("bootSpeedText");

window.api.onBootProgress((mainMsg, subMsg, percent, speed) => {
  document.getElementById("bootText").innerText = mainMsg;
  document.getElementById("bootSubText").innerText = subMsg;

  if (percent > 0) {
    bootProgressWrapper.style.display = "block";
    bootProgressBar.style.width = `${percent}%`;
    bootSpeedText.innerText = speed;
  }
});

window.api.onBootComplete(() => {
  const bootScreen = document.getElementById("bootScreen");
  bootScreen.style.opacity = "0";
  setTimeout(() => {
    bootScreen.style.display = "none";
  }, 500);
});

/* --- SECTION: THEME TOGGLE LOGIC --- */
const themeToggleBtn = document.getElementById("themeToggleBtn");
const themeIcon = document.getElementById("themeIcon");
const moonPath =
  "M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-3.03 0-5.5-2.47-5.5-5.5 0-1.82.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z";
const sunPath =
  "M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0 .39-.39.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0 .39-.39.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41.39.39 1.03.39 1.41 0l1.06-1.06zM7.05 18.36c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41.39.39 1.03.39 1.41 0l1.06-1.06z";

const savedTheme = localStorage.getItem("theme");
if (savedTheme === null || savedTheme === "light") {
  if (savedTheme === null) {
    localStorage.setItem("theme", "light");
  }
  document.body.classList.add("light-mode");
  themeIcon.innerHTML = `<path d="${sunPath}"/>`;
} else {
  themeIcon.innerHTML = `<path d="${moonPath}"/>`;
}

themeToggleBtn.addEventListener("click", () => {
  document.body.classList.toggle("light-mode");
  if (document.body.classList.contains("light-mode")) {
    localStorage.setItem("theme", "light");
    themeIcon.innerHTML = `<path d="${sunPath}"/>`;
  } else {
    localStorage.setItem("theme", "dark");
    themeIcon.innerHTML = `<path d="${moonPath}"/>`;
  }
});

/* --- SECTION: UI NAVIGATION --- */
const navBtns = document.querySelectorAll("#sidebar .nav-btn");
const views = document.querySelectorAll(".view");

navBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    navBtns.forEach((b) => b.classList.remove("active"));
    views.forEach((v) => v.classList.remove("active"));
    btn.classList.add("active");
    document
      .getElementById(btn.getAttribute("data-target"))
      .classList.add("active");
  });
});

/* --- SECTION: SYNCHRONIZED UI ELEMENTS --- */
const urlInput = document.getElementById("urlInput");
const advUrlInput = document.getElementById("advUrlInput");
const analyzeBtn = document.getElementById("analyzeBtn");
const advAnalyzeBtn = document.getElementById("advAnalyzeBtn");
const downloadSection = document.getElementById("downloadSection");
const advConfigSection = document.getElementById("advConfigSection");
const statusDiv = document.getElementById("status");
const advStatus = document.getElementById("advStatus");
const videoTitle = document.getElementById("videoTitle");
const thumbnail = document.getElementById("thumbnail");
const qualitySelect = document.getElementById("qualitySelect");
const advMetaHeader = document.getElementById("advMetaHeader");
const advVideoTitle = document.getElementById("advVideoTitle");
const advThumbnail = document.getElementById("advThumbnail");

const thumbnailContainer = document.getElementById("thumbnailContainer");
const previewBtn = document.getElementById("previewBtn");
const previewModal = document.getElementById("previewModal");
const closePreviewModalBtn = document.getElementById("closePreviewModalBtn");
const modalVideoTitle = document.getElementById("modalVideoTitle");
const metaUploader = document.getElementById("metaUploader");
const metaDuration = document.getElementById("metaDuration");
const metaViews = document.getElementById("metaViews");
const metaDate = document.getElementById("metaDate");
const metaDescription = document.getElementById("metaDescription");

let currentMetadata = null;

function formatDuration(seconds) {
  if (!seconds || isNaN(seconds)) return "Unknown";
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hrs > 0) {
    return `${hrs}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

function formatViews(views) {
  if (!views && views !== 0) return "Unknown";
  if (views >= 1000000) return (views / 1000000).toFixed(1) + "M";
  if (views >= 1000) return (views / 1000).toFixed(1) + "K";
  return Number(views).toLocaleString();
}

function formatDate(dateStr) {
  if (!dateStr || dateStr.length !== 8) return dateStr || "Unknown";
  const year = dateStr.substring(0, 4);
  const month = dateStr.substring(4, 6);
  const day = dateStr.substring(6, 8);
  const dateObj = new Date(`${year}-${month}-${day}`);
  if (isNaN(dateObj.getTime())) return dateStr;
  return dateObj.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

/* --- YouTube UI Cleanup CSS (injected into webview) --- */
const YOUTUBE_CLEANUP_CSS = `
  /* Hide all YouTube chrome */
  #masthead-container, ytd-masthead, #secondary, #below, #related,
  #comments, #guide, #guide-button, tp-yt-app-drawer, .ytd-miniplayer,
  ytd-popup-container, #end, #chips-wrapper, ytd-consent-bump-v2-lightbox,
  #info-container, #meta, #top-row, #above-the-fold, #bottom-row,
  ytd-watch-metadata, #subscribe-button, #sponsor-button, #actions,
  ytd-merch-shelf-renderer, ytd-structured-description-content-renderer,
  #chat-container, #ticket-shelf, #clarify-box, #panels,
  .ytp-paid-content-overlay, .ytp-ce-element, .ytp-endscreen-content,
  .ytp-chrome-top, #menu, .iv-branding, .ytp-watermark,
  tp-yt-paper-dialog, ytd-engagement-panel-section-list-renderer,
  #notification-permission-request-bottom-bar, #cinematics { display: none !important; }

  /* Full viewport player */
  html, body {
    margin: 0 !important; padding: 0 !important;
    overflow: hidden !important; background: #000 !important;
  }
  #page-manager { margin-top: 0 !important; padding: 0 !important; }
  ytd-watch-flexy { padding: 0 !important; margin: 0 !important; max-width: 100% !important; }
  #columns { max-width: 100% !important; padding: 0 !important; }
  #primary, #primary-inner { max-width: 100% !important; padding: 0 !important; margin: 0 !important; }
  #player-container-outer { max-width: 100% !important; }

  /* Force video player to fill entire viewport */
  #player, #player-container-inner, #ytd-player, #movie_player,
  .html5-video-container {
    position: fixed !important; top: 0 !important; left: 0 !important;
    width: 100vw !important; height: 100vh !important;
    max-width: none !important; max-height: none !important;
    margin: 0 !important; padding: 0 !important; z-index: 9999 !important;
  }
  video.html5-main-video {
    width: 100% !important; height: 100% !important;
    object-fit: contain !important;
    left: 0 !important; top: 0 !important;
  }
  /* Keep player controls visible */
  .ytp-chrome-bottom { z-index: 10000 !important; }
  .ytp-gradient-bottom { z-index: 9999 !important; }
`;

const previewWebview = document.getElementById("previewWebview");

/* Inject CSS each time the webview page finishes loading */
if (previewWebview) {
  previewWebview.addEventListener("dom-ready", () => {
    previewWebview.insertCSS(YOUTUBE_CLEANUP_CSS);
  });
}

function openPreviewModal() {
  if (!currentMetadata) return;
  modalVideoTitle.innerText = currentMetadata.title || "Media Preview";
  metaUploader.innerText = currentMetadata.uploader || "Unknown Channel";
  metaDuration.innerText = formatDuration(currentMetadata.duration);
  metaViews.innerText = formatViews(currentMetadata.view_count);
  metaDate.innerText = formatDate(currentMetadata.upload_date);
  metaDescription.innerText = currentMetadata.description || "No description available for this video.";

  if (previewWebview && currentMetadata.id) {
    previewWebview.src = `https://www.youtube.com/watch?v=${currentMetadata.id}&autoplay=1`;
  }

  if (previewModal) previewModal.classList.add("active");
}

function closePreviewModal() {
  if (previewWebview) {
    previewWebview.src = "about:blank";
  }
  if (previewModal) previewModal.classList.remove("active");
}

const openExternalBtn = document.getElementById("openExternalBtn");
if (openExternalBtn) {
  openExternalBtn.addEventListener("click", () => {
    if (currentMetadata && currentMetadata.webpage_url) {
      window.api.playFile(currentMetadata.webpage_url);
    }
  });
}

if (previewBtn) previewBtn.addEventListener("click", openPreviewModal);
if (closePreviewModalBtn) closePreviewModalBtn.addEventListener("click", closePreviewModal);
if (previewModal) {
  previewModal.addEventListener("click", (e) => {
    if (e.target === previewModal) closePreviewModal();
  });
}
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && previewModal && previewModal.classList.contains("active")) {
    closePreviewModal();
  }
});

/* --- SECTION: PLAYLIST & CHANNEL LINK DETECTOR & REDIRECTOR --- */
function isPlaylistOrChannelUrl(url) {
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
}

function checkAndRedirectPlaylistOrChannel(url, sourceInput) {
  if (!url || typeof url !== "string") return false;
  const cleanUrl = url.trim();
  if (isPlaylistOrChannelUrl(cleanUrl)) {
    if (sourceInput) sourceInput.value = "";
    if (urlInput) urlInput.value = "";
    if (advUrlInput) advUrlInput.value = "";
    const pParallelInput = document.getElementById("parallelUrlInput");
    if (pParallelInput) pParallelInput.value = "";
    if (typeof resetUIs === "function") resetUIs();

    const pUrlInput = document.getElementById("playlistUrlInput");
    const pAnalyzeBtn = document.getElementById("playlistAnalyzeBtn");
    const pStatus = document.getElementById("playlistStatus");

    if (pUrlInput) pUrlInput.value = cleanUrl;

    const playlistNavBtn = document.querySelector('[data-target="view-playlist"]');
    if (playlistNavBtn) playlistNavBtn.click();

    if (pStatus) {
      pStatus.innerText = "Playlist / Channel link detected! Redirecting to Playlist & Channel section...";
      pStatus.style.color = "var(--accent)";
    }

    if (pAnalyzeBtn) {
      setTimeout(() => {
        pAnalyzeBtn.click();
      }, 150);
    }
    return true;
  }
  return false;
}

function triggerAnalysis(url) {
  if (!url) {
    statusDiv.innerText = "Error: Please enter a link.";
    statusDiv.style.color = "#ff4444";
    advStatus.innerText = "Error: Please enter a link.";
    advStatus.style.color = "#ff4444";
    return;
  }

  if (checkAndRedirectPlaylistOrChannel(url)) return;

  if (url.includes("youtube.com/") || url.includes("youtu.be/")) {
    statusDiv.innerText = "Analyzing video...";
    statusDiv.style.color = "var(--text-muted)";
    analyzeBtn.disabled = true;
    analyzeBtn.innerText = "Please wait...";
    
    advStatus.innerText = "Analyzing video...";
    advStatus.style.color = "var(--text-muted)";
    advAnalyzeBtn.disabled = true;
    advAnalyzeBtn.innerText = "Please wait...";
    
    window.api.getMetadata(url, getCookieConfig());
  } else {
    statusDiv.innerText = "Error: Enter a valid YouTube link.";
    statusDiv.style.color = "#ff4444";
    advStatus.innerText = "Error: Enter a valid YouTube link.";
    advStatus.style.color = "#ff4444";
  }
}

analyzeBtn.addEventListener("click", () =>
  triggerAnalysis(urlInput.value.trim()),
);
advAnalyzeBtn.addEventListener("click", () =>
  triggerAnalysis(advUrlInput.value.trim()),
);

function resetUIs() {
  analyzeBtn.style.display = "block";
  analyzeBtn.disabled = false;
  analyzeBtn.innerText = "Analyze Video";
  
  advAnalyzeBtn.style.display = "block";
  advAnalyzeBtn.disabled = false;
  advAnalyzeBtn.innerText = "Analyze Video";
  
  downloadSection.style.display = "none";
  advConfigSection.style.display = "none";
  if (thumbnailContainer) thumbnailContainer.style.display = "none";
  thumbnail.style.display = "none";
  advMetaHeader.style.display = "none";
  
  videoTitle.innerText = "Paste a link to begin";
  statusDiv.innerText = "Ready";
  statusDiv.style.color = "var(--text-muted)";
  
  advStatus.innerText = "Advanced Engine Ready";
  advStatus.style.color = "var(--text-muted)";
  currentMetadata = null;
  closePreviewModal();
}

urlInput.addEventListener("input", (e) => {
  if (advUrlInput.value !== e.target.value) {
    advUrlInput.value = e.target.value;
  }
  resetUIs();
});

urlInput.addEventListener("click", () => {
  urlInput.select();
});

advUrlInput.addEventListener("input", (e) => {
  if (urlInput.value !== e.target.value) {
    urlInput.value = e.target.value;
  }
  resetUIs();
});

advUrlInput.addEventListener("click", () => {
  advUrlInput.select();
});

/* --- SECTION: METADATA SUCCESS HANDLER --- */
window.api.onMetadata((data) => {
  currentMetadata = data;
  analyzeBtn.style.display = "none";
  advAnalyzeBtn.style.display = "none";
  downloadSection.style.display = "flex";
  advConfigSection.style.display = "flex";

  videoTitle.innerText = data.title;
  thumbnail.src = data.thumbnail;
  thumbnail.style.display = "block";
  if (thumbnailContainer) thumbnailContainer.style.display = "block";

  advVideoTitle.innerText = data.title;
  advThumbnail.src = data.thumbnail;
  advMetaHeader.style.display = "flex";

  const standardHeights = [144, 240, 360, 480, 720, 1080, 1440, 2160, 4320];
  const getLabel = (h) => {
    if (h >= 4320) return `${h}p (8K)`;
    if (h >= 2160) return `${h}p (4K)`;
    if (h >= 1440) return `${h}p (QHD)`;
    if (h >= 1080) return `${h}p (FHD)`;
    if (h >= 720) return `${h}p (HD)`;
    return `${h}p`;
  };

  qualitySelect.innerHTML = `<optgroup label="Audio Formats"><option value="mp3">Audio: MP3</option><option value="m4a">Audio: M4A</option><option value="wav">Audio: WAV</option></optgroup><optgroup label="Video Formats" id="videoGroup"></optgroup>`;
  
  const uniqueFormats = data.formats
    .filter((f) => f.height && standardHeights.includes(f.height))
    .sort((a, b) => b.height - a.height);
    
  const seenHeights = new Set();
  
  uniqueFormats.forEach((f) => {
    if (!seenHeights.has(f.height)) {
      seenHeights.add(f.height);
      const opt = document.createElement("option");
      opt.value = f.format_id;
      opt.innerText = `Video: ${getLabel(f.height)}`;
      document.getElementById("videoGroup").appendChild(opt);
    }
  });

  // Apply Default Preset Preference
  const prefVideo = localStorage.getItem("defaultVideo");
  if (prefVideo) {
    const matchedOption = Array.from(qualitySelect.options).find(opt => opt.text.includes(`${prefVideo}p`));
    if (matchedOption) qualitySelect.value = matchedOption.value;
  }

  // Apply Default Audio Preference to Advanced Tab
  const prefAudio = localStorage.getItem("defaultAudio");
  if (prefAudio) {
    const advAudioFormat = document.getElementById("advAudioFormat");
    if (advAudioFormat) advAudioFormat.value = prefAudio;
  }

  // Apply Default Video Format (Container) Preference to Advanced Tab
  const prefVideoFormat = localStorage.getItem("defaultVideoFormat");
  if (prefVideoFormat) {
    const advContainer = document.getElementById("advContainer");
    if (advContainer) advContainer.value = prefVideoFormat;
  }

  const advMaxRes = document.getElementById("advMaxRes");
  const advFps = document.getElementById("advFps");

  const availableHeights = [
    ...new Set(
      data.formats.map((f) => f.height).filter((h) => standardHeights.includes(h)),
    ),
  ].sort((a, b) => b - a);
  
  const availableFps = [
    ...new Set(data.formats.map((f) => f.fps).filter((fps) => fps >= 24)),
  ].sort((a, b) => b - a);

  advMaxRes.innerHTML = '<option value="">Best Available (No Limit)</option>';
  availableHeights.forEach((h) => {
    advMaxRes.innerHTML += `<option value="${h}">Max ${getLabel(h)}</option>`;
  });
  if (prefVideo) advMaxRes.value = prefVideo;

  advFps.innerHTML = '<option value="">Auto (Best Available)</option>';
  availableFps.forEach((fps) => {
    advFps.innerHTML += `<option value="${fps}">Max ${fps} FPS</option>`;
  });

  statusDiv.innerText = "Analysis Complete.";
  statusDiv.style.color = "#4CAF50";
  advStatus.innerText = "Analysis Complete. Configure Advanced Rules.";
  advStatus.style.color = "#4CAF50";
});

/* --- SECTION: NORMAL DOWNLOAD ENGINE --- */
const downloadBtn = document.getElementById("downloadBtn");
const stopNormalBtn = document.getElementById("stopNormalBtn");
const progressBar = document.getElementById("progressBar");

downloadBtn.addEventListener("click", () => {
  const url = urlInput.value.trim();
  const selection = qualitySelect.value;
  if (!url || !selection) return;

  statusDiv.innerText = "Initializing download...";
  statusDiv.style.color = "#777";
  progressBar.style.display = "block";
  progressBar.classList.add("downloading");
  downloadBtn.style.display = "none";
  stopNormalBtn.style.display = "block";

  const isAudio = ["mp3", "m4a", "wav"].includes(selection);
  const currentSpeedLimit = localStorage.getItem("speedLimit") || "";

  const currentTitle = (currentMetadata && currentMetadata.title) ? currentMetadata.title : "";

  window.api.sendDownload(
    url,
    isAudio ? "audio" : "video",
    selection,
    localStorage.getItem("downloadPath") || "",
    currentSpeedLimit,
    getCookieConfig(),
    isArchiveEnabled,
    currentTitle
  );
});



stopNormalBtn.addEventListener("click", () => {
  window.api.cancelNormalDownload();
});

window.api.onProgress((percent) => {
  progressBar.value = percent;
  statusDiv.innerText = `Downloading: ${percent}%`;
});

window.api.onStatus((msg) => {
  statusDiv.innerText = msg;
  if (
    msg.includes("Error") ||
    msg.includes("Failed") ||
    msg.includes("Stopped") ||
    msg.includes("Success")
  ) {
    downloadBtn.style.display = "block";
    stopNormalBtn.style.display = "none";
    progressBar.classList.remove("downloading");
    statusDiv.style.color = msg.includes("Success") ? "#4CAF50" : "#ff4444";
    
    if (msg.includes("Error")) {
      analyzeBtn.disabled = false;
      analyzeBtn.innerText = "Analyze Video";
    }

    if (msg.includes("Success")) loadLibrary();
  }
});

/* --- SECTION: ADVANCED DOWNLOAD ENGINE --- */
let advMode = "video";
const tabVideo = document.getElementById("tabVideoMode");
const tabAudio = document.getElementById("tabAudioMode");
const advVideoPanel = document.getElementById("advVideoPanel");
const advAudioPanel = document.getElementById("advAudioPanel");
const advDownloadBtn = document.getElementById("advDownloadBtn");
const advStopBtn = document.getElementById("advStopBtn");
const advProgressBar = document.getElementById("advProgressBar");
const advSubsLabel = document.getElementById("advSubsLabel");
const advSubsCheckbox = document.getElementById("advSubs");

tabVideo.addEventListener("click", () => {
  advMode = "video";
  tabVideo.classList.add("active");
  tabAudio.classList.remove("active");
  advVideoPanel.style.display = "flex";
  advAudioPanel.style.display = "none";
  advSubsLabel.style.display = "flex";
});

tabAudio.addEventListener("click", () => {
  advMode = "audio";
  tabAudio.classList.add("active");
  tabVideo.classList.remove("active");
  advAudioPanel.style.display = "flex";
  advVideoPanel.style.display = "none";
  advSubsLabel.style.display = "none";
  advSubsCheckbox.checked = false;
});

advDownloadBtn.addEventListener("click", () => {
  const url = document.getElementById("advUrlInput").value.trim();
  if (!url) {
    advStatus.innerText = "Error: Provide a valid URL.";
    advStatus.style.color = "#ff4444";
    return;
  }

  const config = {
    downloadPath: localStorage.getItem("downloadPath") || "",
    url: url,
    mode: advMode,
    maxRes: document.getElementById("advMaxRes").value,
    container: document.getElementById("advContainer").value,
    fps: document.getElementById("advFps").value,
    audioFormat: document.getElementById("advAudioFormat").value,
    audioBitrate:
      advMode === "video"
        ? document.getElementById("advVideoAudioBitrate").value
        : document.getElementById("advAudioBitrate").value,
    embedSubs: advSubsCheckbox.checked,
    embedThumb: document.getElementById("advThumb").checked,
    writeMeta: document.getElementById("advMeta").checked,
    useArchive: localStorage.getItem("enableArchive") === "true",
    title: (currentMetadata && currentMetadata.webpage_url === url) ? currentMetadata.title : "",
    speedLimit: localStorage.getItem("speedLimit") || "",
    cookieConfig: getCookieConfig()
  };




  advStatus.innerText = "Initializing Advanced Engine...";
  advStatus.style.color = "#777";
  advProgressBar.style.display = "block";
  advProgressBar.classList.add("downloading");
  advDownloadBtn.style.display = "none";
  advStopBtn.style.display = "block";
  
  window.api.sendAdvancedDownload(config);
});

advStopBtn.addEventListener("click", () => {
  window.api.cancelAdvDownload();
});

window.api.onAdvProgress((percent) => {
  advProgressBar.value = percent;
  advStatus.innerText = `Downloading: ${percent}%`;
});

window.api.onAdvStatus((msg) => {
  advStatus.innerText = msg;
  if (
    msg.includes("Error") ||
    msg.includes("Failed") ||
    msg.includes("Stopped") ||
    msg.includes("Success")
  ) {
    advDownloadBtn.style.display = "block";
    advStopBtn.style.display = "none";
    advProgressBar.classList.remove("downloading");
    advStatus.style.color = msg.includes("Success") ? "#4CAF50" : "#ff4444";

    if (msg.includes("Success")) loadLibrary();
  }
});

/* --- SECTION: SETTINGS STATE MANAGER --- */
function getCookieConfig() {
  return localStorage.getItem("cookieFilePath") || "";
}

const downloadPathInput = document.getElementById("downloadPathInput");
const settingDefaultVideo = document.getElementById("settingDefaultVideo");
const settingDefaultAudio = document.getElementById("settingDefaultAudio");
const settingSpeedLimit = document.getElementById("settingSpeedLimit");

const cookieFilePathInput = document.getElementById("cookieFilePathInput");
const selectCookieFileBtn = document.getElementById("selectCookieFileBtn");
const clearCookieFileBtn = document.getElementById("clearCookieFileBtn");

function updateCookieDisplay() {
  const savedPath = localStorage.getItem("cookieFilePath") || "";
  if (cookieFilePathInput) {
    cookieFilePathInput.value = savedPath || "";
  }
  if (clearCookieFileBtn) {
    clearCookieFileBtn.style.display = savedPath ? "flex" : "none";
  }
}

// Initialize values from localStorage
if (downloadPathInput) downloadPathInput.value = localStorage.getItem("downloadPath") || "Default Directory (System Downloads)";
if (settingSpeedLimit) settingSpeedLimit.value = localStorage.getItem("speedLimit") || "";


updateCookieDisplay();

if (selectCookieFileBtn) {
  selectCookieFileBtn.addEventListener("click", async () => {
    const selected = await window.api.selectCookieFile();
    if (selected) {
      localStorage.setItem("cookieFilePath", selected);
      updateCookieDisplay();
    }
  });
}

if (clearCookieFileBtn) {
  clearCookieFileBtn.addEventListener("click", () => {
    localStorage.removeItem("cookieFilePath");
    updateCookieDisplay();
  });
}

// Event Listeners for saving settings
if (downloadPathInput) {
  document.getElementById("changeFolderBtn").addEventListener("click", async () => {
    const selectedFolder = await window.api.selectFolder();
    if (selectedFolder) {
      localStorage.setItem("downloadPath", selectedFolder);
      downloadPathInput.value = selectedFolder;
      loadLibrary();
    }
  });
}

const settingClipboardAutoDetect = document.getElementById("settingClipboardAutoDetect");
if (settingClipboardAutoDetect) {
  const initialEnabled = localStorage.getItem("clipboardAutoDetect") !== "false";
  settingClipboardAutoDetect.checked = initialEnabled;
  // Sync initial state to main process so clipboard monitor respects it on startup
  if (window.api.setClipboardAutoDetect) {
    window.api.setClipboardAutoDetect(initialEnabled);
  }
  settingClipboardAutoDetect.addEventListener("change", (e) => {
    const isEnabled = e.target.checked;
    localStorage.setItem("clipboardAutoDetect", isEnabled ? "true" : "false");
    // Immediately tell main process to enable/disable the clipboard monitor
    if (window.api.setClipboardAutoDetect) {
      window.api.setClipboardAutoDetect(isEnabled);
    }
    if (isEnabled && window.api.resetClipboardMonitor) {
      window.api.resetClipboardMonitor();
    }
  });
}


if (settingSpeedLimit) settingSpeedLimit.addEventListener("input", (e) => localStorage.setItem("speedLimit", e.target.value));


document.getElementById("openFolderBtn").addEventListener("click", () => {
  window.api.openFolder(localStorage.getItem("downloadPath") || "");
});

document.getElementById("advOpenFolderBtn").addEventListener("click", () => {
  window.api.openFolder(localStorage.getItem("downloadPath") || "");
});

const libraryOpenFolderBtn = document.getElementById("libraryOpenFolderBtn");
if (libraryOpenFolderBtn) {
  libraryOpenFolderBtn.addEventListener("click", () => {
    window.api.openFolder(localStorage.getItem("downloadPath") || "");
  });
}

/* --- SECTION: LIBRARY LOGIC --- */
const libraryContainer = document.getElementById("libraryContainer");
const refreshLibraryBtn = document.getElementById("refreshLibraryBtn");

async function loadLibrary() {
  if (!libraryContainer) return;
  libraryContainer.innerHTML =
    '<p style="color: var(--text-muted); text-align: center;">Scanning files...</p>';
    
  const files = await window.api.getLibraryFiles(localStorage.getItem("downloadPath") || "");

  if (!files || files.length === 0) {
    libraryContainer.innerHTML =
      '<p style="color: var(--text-muted); text-align: center;">No downloaded files found.</p>';
    return;
  }

  libraryContainer.innerHTML = "";
  files.forEach((file) => {
    const item = document.createElement("div");
    item.style.cssText =
      "display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.2); padding: 10px; border-radius: 8px; border: 1px solid var(--border-color);";

    item.innerHTML = `
        <div style="flex: 1; overflow: hidden; margin-right: 10px;">
            <div style="font-weight: bold; font-size: 0.9rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${file.name}">${file.name}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">${file.size}</div>
        </div>
        <div style="display: flex; gap: 8px;">
            <button class="primary play-btn" style="padding: 6px 12px; font-size: 0.8rem;">Play</button>
            <button class="secondary del-btn" style="padding: 6px 12px; font-size: 0.8rem; border-color: #ff4444; color: #ff4444;">Delete</button>
        </div>
    `;

    item.querySelector(".play-btn").addEventListener("click", () => {
      window.api.playFile(file.path);
    });
    
    item.querySelector(".del-btn").addEventListener("click", async () => {
      if (
        confirm(
          `Are you sure you want to permanently delete:\n${file.name}?`
        )
      ) {
        const success = await window.api.deleteFile(file.path);
        if (success) loadLibrary();
      }
    });

    libraryContainer.appendChild(item);
  });
}

if (refreshLibraryBtn) {
  refreshLibraryBtn.addEventListener("click", loadLibrary);
}

document
  .querySelector('[data-target="view-library"]')
  .addEventListener("click", loadLibrary);

/* --- SECTION: ENGINE AUTO-UPDATER LOGIC --- */
const engineVersionText = document.getElementById("engineVersionText");
const engineUpdateStatus = document.getElementById("engineUpdateStatus");
const checkUpdateBtn = document.getElementById("checkUpdateBtn");

let lastEngineInfo = null;

async function checkEngineVersionUI() {
  if (!engineVersionText || !engineUpdateStatus) return;

  engineUpdateStatus.innerText = "Status: Checking GitHub for updates...";
  engineUpdateStatus.style.color = "var(--text-muted)";
  if (checkUpdateBtn) {
    checkUpdateBtn.disabled = true;
    checkUpdateBtn.innerText = "Checking...";
  }

  try {
    lastEngineInfo = await window.api.getEngineVersion();
    if (lastEngineInfo) {
      engineVersionText.innerText = `yt-dlp Core: v${lastEngineInfo.currentVersion}`;
      
      if (lastEngineInfo.updateAvailable) {
        engineUpdateStatus.innerText = `Update Available: v${lastEngineInfo.latestVersion} (Current: v${lastEngineInfo.currentVersion})`;
        engineUpdateStatus.style.color = "#FF9800";
        if (checkUpdateBtn) {
          checkUpdateBtn.disabled = false;
          checkUpdateBtn.innerText = "Update Now";
          checkUpdateBtn.style.background = "#FF9800";
        }
      } else {
        if (lastEngineInfo.latestVersion !== "Unknown") {
          engineUpdateStatus.innerText = `Status: Engine is up to date (v${lastEngineInfo.currentVersion})`;
          engineUpdateStatus.style.color = "#4CAF50";
        } else {
          engineUpdateStatus.innerText = `Status: Unable to check latest release (Offline/Limit)`;
          engineUpdateStatus.style.color = "var(--text-muted)";
        }
        if (checkUpdateBtn) {
          checkUpdateBtn.disabled = false;
          checkUpdateBtn.innerText = "Check for Updates";
          checkUpdateBtn.style.background = "var(--accent)";
        }
      }
    }
  } catch (err) {
    engineUpdateStatus.innerText = "Status: Check failed.";
    engineUpdateStatus.style.color = "#ff4444";
    if (checkUpdateBtn) {
      checkUpdateBtn.disabled = false;
      checkUpdateBtn.innerText = "Check for Updates";
      checkUpdateBtn.style.background = "var(--accent)";
    }
  }
}

if (checkUpdateBtn) {
  checkUpdateBtn.addEventListener("click", async () => {
    if (checkUpdateBtn.innerText === "Update Now") {
      checkUpdateBtn.disabled = true;
      checkUpdateBtn.innerText = "Updating...";
      engineUpdateStatus.innerText = "Status: Downloading latest yt-dlp binary...";
      engineUpdateStatus.style.color = "var(--text-muted)";

      const result = await window.api.updateEngine();
      if (result && result.success) {
        engineUpdateStatus.innerText = `Status: Engine updated successfully to v${result.newVersion}!`;
        engineUpdateStatus.style.color = "#4CAF50";
        engineVersionText.innerText = `yt-dlp Core: v${result.newVersion}`;
        checkUpdateBtn.disabled = false;
        checkUpdateBtn.innerText = "Check for Updates";
        checkUpdateBtn.style.background = "var(--accent)";
      } else {
        engineUpdateStatus.innerText = `Status: Update failed (${result ? result.error : "Unknown error"})`;
        engineUpdateStatus.style.color = "#ff4444";
        checkUpdateBtn.disabled = false;
        checkUpdateBtn.innerText = "Retry Update";
      }
    } else {
      await checkEngineVersionUI();
    }
  });
}

if (window.api.onEngineUpdateProgress) {
  window.api.onEngineUpdateProgress((message, percent) => {
    if (engineUpdateStatus) {
      engineUpdateStatus.innerText = `Status: ${message} ${percent}%`;
    }
  });
}

const settingsNavBtn = document.querySelector('[data-target="view-settings"]');
/* --- SECTION: DOWNLOAD ARCHIVE MANAGEMENT --- */
const settingEnableArchive = document.getElementById("settingEnableArchive");

if (settingEnableArchive) {
  settingEnableArchive.checked = localStorage.getItem("enableArchive") === "true";
  settingEnableArchive.addEventListener("change", (e) => {
    localStorage.setItem("enableArchive", e.target.checked ? "true" : "false");
  });
}

if (settingsNavBtn) {
  settingsNavBtn.addEventListener("click", () => {
    checkEngineVersionUI();
  });
}

checkEngineVersionUI();




/* --- SECTION: CLIPBOARD AUTO-DETECT TOAST LOGIC --- */
let currentToastUrl = "";
let currentToastIsPlaylist = false;
let toastTimeout = null;

function showClipboardToast(data) {
  if (localStorage.getItem("clipboardAutoDetect") === "false") return;
  const url = typeof data === "object" ? data.url : data;
  const isPlaylist = typeof data === "object" ? data.isPlaylistOrChannel : isPlaylistOrChannelUrl(url);

  if (!url) return;
  if (urlInput && urlInput.value.trim() === url.trim() && !isPlaylist) return;

  currentToastUrl = url.trim();

  currentToastIsPlaylist = isPlaylist;

  const clipboardToast = document.getElementById("clipboardToast");
  const toastTitleText = document.getElementById("toastTitleText");
  const toastUrlText = document.getElementById("toastUrlText");
  const toastAnalyzeBtn = document.getElementById("toastAnalyzeBtn");
  const toastDownloadMp3Btn = document.getElementById("toastDownloadMp3Btn");

  if (!clipboardToast || !toastUrlText) return;

  toastUrlText.innerText = currentToastUrl;
  toastUrlText.title = currentToastUrl;

  if (toastTitleText) {
    toastTitleText.innerText = isPlaylist ? "Playlist / Channel Link Detected" : "Single Video Link Detected";
  }

  if (toastAnalyzeBtn) {
    toastAnalyzeBtn.innerText = isPlaylist ? "Fetch Playlist" : "Analyze Video";
  }

  if (toastDownloadMp3Btn) {
    toastDownloadMp3Btn.innerText = isPlaylist ? "Fetch Audio Playlist" : "Download MP3";
  }

  clipboardToast.style.display = "flex";

  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    hideClipboardToast();
  }, 12000);
}

function hideClipboardToast() {
  const clipboardToast = document.getElementById("clipboardToast");
  if (clipboardToast) {
    clipboardToast.style.display = "none";
  }
  if (toastTimeout) clearTimeout(toastTimeout);
}

// Hide clipboard toast whenever user pastes into any input field
document.addEventListener("paste", () => {
  hideClipboardToast();
});

if (window.api.onClipboardUrl) {
  window.api.onClipboardUrl((data) => {
    showClipboardToast(data);
  });
}

const toastCloseBtn = document.getElementById("toastCloseBtn");
if (toastCloseBtn) {
  toastCloseBtn.addEventListener("click", hideClipboardToast);
}

const toastAnalyzeBtn = document.getElementById("toastAnalyzeBtn");
if (toastAnalyzeBtn) {
  toastAnalyzeBtn.addEventListener("click", () => {
    if (currentToastUrl) {
      if (currentToastIsPlaylist || isPlaylistOrChannelUrl(currentToastUrl)) {
        checkAndRedirectPlaylistOrChannel(currentToastUrl);
      } else {
        const homeNavBtn = document.querySelector('[data-target="view-home"]');
        if (homeNavBtn) homeNavBtn.click();

        if (urlInput) urlInput.value = currentToastUrl;
        if (advUrlInput) advUrlInput.value = currentToastUrl;

        triggerAnalysis(currentToastUrl);
      }
    }
    hideClipboardToast();
  });
}

const toastDownloadMp3Btn = document.getElementById("toastDownloadMp3Btn");
if (toastDownloadMp3Btn) {
  toastDownloadMp3Btn.addEventListener("click", () => {
    if (currentToastUrl) {
      if (currentToastIsPlaylist || isPlaylistOrChannelUrl(currentToastUrl)) {
        const playlistModeSelect = document.getElementById("playlistModeSelect");
        if (playlistModeSelect) {
          playlistModeSelect.value = "audio";
          playlistModeSelect.dispatchEvent(new Event("change"));
        }
        checkAndRedirectPlaylistOrChannel(currentToastUrl);
      } else {
        const homeNavBtn = document.querySelector('[data-target="view-home"]');
        if (homeNavBtn) homeNavBtn.click();

        if (urlInput) urlInput.value = currentToastUrl;
        if (advUrlInput) advUrlInput.value = currentToastUrl;

        triggerAnalysis(currentToastUrl);

        // Trigger instant download for MP3 audio
        const currentSpeedLimit = localStorage.getItem("speedLimit") || "";
        window.api.sendDownload(
          currentToastUrl,
          "audio",
          "mp3",
          localStorage.getItem("downloadPath") || "",
          currentSpeedLimit,
          getCookieConfig()
        );
      }
    }
    hideClipboardToast();
  });
}

/* --- SECTION: PARALLEL DOWNLOAD LOGIC --- */
const parallelUrlInput = document.getElementById("parallelUrlInput");
const parallelAnalyzeBtn = document.getElementById("parallelAnalyzeBtn");
const parallelDownloadBtn = document.getElementById("parallelDownloadBtn");
const parallelStatus = document.getElementById("parallelStatus");
const parallelListContainer = document.getElementById("parallelListContainer");
const parallelRefreshBtn = document.getElementById("parallelRefreshBtn");
const parallelConfigBtn = document.getElementById("parallelConfigBtn");

const parallelThumbnailContainer = document.getElementById("parallelThumbnailContainer");
const parallelThumbnail = document.getElementById("parallelThumbnail");
const parallelPreviewTitle = document.getElementById("parallelPreviewTitle");

const parallelConfigModal = document.getElementById("parallelConfigModal");
const closeParallelConfigBtn = document.getElementById("closeParallelConfigBtn");
const saveParallelConfigBtn = document.getElementById("saveParallelConfigBtn");

const parallelModeSelect = document.getElementById("parallelModeSelect");
const parallelVideoOptions = document.getElementById("parallelVideoOptions");
const parallelAudioOptions = document.getElementById("parallelAudioOptions");
const parallelVideoFormatSelect = document.getElementById("parallelVideoFormatSelect");
const parallelQualitySelect = document.getElementById("parallelQualitySelect");
const parallelFpsSelect = document.getElementById("parallelFpsSelect");
const parallelAudioFormatSelect = document.getElementById("parallelAudioFormatSelect");
const parallelAudioBitrateSelect = document.getElementById("parallelAudioBitrateSelect");

// In-memory Parallel Session State
let parallelSessionItems = [];
let parallelConfig = {
  mode: "video",
  container: "mp4",
  maxRes: "",
  fps: "",
  audioFormat: "mp3",
  audioBitrate: ""
};

function extractYoutubeVideoId(url) {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/);
  return match ? match[1] : null;
}

function getThumbnailUrl(url, metadata) {
  if (metadata && metadata.thumbnail && (metadata.webpage_url === url || url.includes(metadata.id))) {
    return metadata.thumbnail;
  }
  const videoId = extractYoutubeVideoId(url);
  if (videoId) {
    return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  }
  return "icon.ico";
}

function updateParallelThumbnailPreview(url) {
  if (!parallelThumbnailContainer || !parallelThumbnail) return;
  const cleanUrl = url ? url.trim() : "";
  if (!cleanUrl) {
    parallelThumbnailContainer.style.display = "none";
    return;
  }
  const thumbUrl = getThumbnailUrl(cleanUrl, currentMetadata);
  parallelThumbnail.src = thumbUrl;
  if (parallelPreviewTitle) {
    parallelPreviewTitle.innerText = (currentMetadata && currentMetadata.webpage_url === cleanUrl) ? currentMetadata.title : cleanUrl;
  }
  parallelThumbnailContainer.style.display = "block";
}

if (parallelUrlInput) {
  parallelUrlInput.addEventListener("input", (e) => {
    updateParallelThumbnailPreview(e.target.value);
  });
}

// Toggle Video/Audio Options inside Configuration Modal
if (parallelModeSelect) {
  parallelModeSelect.addEventListener("change", (e) => {
    if (e.target.value === "video") {
      parallelVideoOptions.style.display = "block";
      parallelAudioOptions.style.display = "none";
    } else {
      parallelVideoOptions.style.display = "none";
      parallelAudioOptions.style.display = "block";
    }
  });
}

// Modal open & close
if (parallelConfigBtn) {
  parallelConfigBtn.addEventListener("click", () => {
    if (parallelConfigModal) parallelConfigModal.classList.add("active");
  });
}
if (closeParallelConfigBtn) {
  closeParallelConfigBtn.addEventListener("click", () => {
    if (parallelConfigModal) parallelConfigModal.classList.remove("active");
  });
}
if (saveParallelConfigBtn) {
  saveParallelConfigBtn.addEventListener("click", () => {
    parallelConfig.mode = parallelModeSelect.value;
    parallelConfig.container = parallelVideoFormatSelect.value;
    parallelConfig.maxRes = parallelQualitySelect.value;
    parallelConfig.fps = parallelFpsSelect.value;
    parallelConfig.audioFormat = parallelAudioFormatSelect.value;
    parallelConfig.audioBitrate = parallelAudioBitrateSelect.value;

    if (parallelConfigModal) parallelConfigModal.classList.remove("active");
    if (parallelStatus) {
      parallelStatus.innerText = "Configuration saved for session.";
      parallelStatus.style.color = "#4CAF50";
    }
  });
}

// Update Download Button Text ("Download" vs "Add to Queue")
function updateParallelDownloadBtnText() {
  if (!parallelDownloadBtn) return;
  if (parallelSessionItems.length > 0) {
    parallelDownloadBtn.innerText = "Add to Queue";
  } else {
    parallelDownloadBtn.innerText = "Download";
  }
}

// Render Parallel List Cards
function renderParallelItems() {
  if (!parallelListContainer) return;
  parallelListContainer.innerHTML = "";

  parallelSessionItems.forEach((item) => {
    const card = document.createElement("div");
    card.className = "card";
    card.style.cssText = "padding: 15px; flex-direction: row; gap: 15px; align-items: center; max-width: 100%; width: 100%; border-radius: 14px;";

    const thumbUrl = item.thumbnail || getThumbnailUrl(item.url, null);
    const titleText = item.title || item.url;
    const isDownloaded = item.status === "downloaded";
    const isAlready = item.statusText === "Downloaded already" || item.isAlreadyDownloaded;
    const badgeText = isAlready ? "Downloaded Already ✓" : "Downloaded ✓";
    const isPaused = item.status === "paused";
    const isStopped = item.status === "stopped";

    card.innerHTML = `
      <img src="${thumbUrl}" alt="Thumbnail" style="width: 110px; height: 62px; object-fit: cover; border-radius: 8px; flex-shrink: 0; background: #000;" onerror="if (this.src !== 'icon.ico') this.src='icon.ico';" />
      <div style="flex: 1; display: flex; flex-direction: column; gap: 6px; overflow: hidden;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <h3 style="font-size: 0.92rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin: 0; padding: 0; border: none;" title="${titleText}">${titleText}</h3>
          ${isDownloaded ? `<span style="background: #4CAF50; color: white; padding: 2px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: bold; flex-shrink: 0; margin-left: 10px;">${badgeText}</span>` : ''}
        </div>
        <div style="font-size: 0.8rem; color: var(--text-muted);">${item.statusText || item.status}</div>
        <progress value="${item.percent || 0}" max="100" style="display: block; width: 100%; height: 6px;"></progress>
      </div>
      <div style="display: flex; gap: 8px; flex-shrink: 0;">
        ${!isDownloaded && !isStopped ? `<button class="secondary pause-parallel-btn" data-id="${item.id}" style="width: auto; padding: 6px 12px; font-size: 0.8rem;">${isPaused ? 'Resume' : 'Pause'}</button>` : ''}
        <button class="secondary stop-parallel-btn" data-id="${item.id}" style="width: auto; padding: 6px 12px; font-size: 0.8rem; border-color: #ff4444; color: #ff4444;">${isDownloaded || isStopped ? 'Remove' : 'Stop'}</button>
      </div>
    `;

    parallelListContainer.appendChild(card);
  });

  // Attach Pause & Stop Listeners
  document.querySelectorAll(".pause-parallel-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const id = e.currentTarget.getAttribute("data-id");
      const item = parallelSessionItems.find((i) => i.id === id);
      if (item) {
        if (item.status === "paused") {
          item.status = "downloading";
          item.statusText = "Resuming download...";
          renderParallelItems();
          window.api.resumeParallelDownload(item);
        } else {
          item.status = "paused";
          item.statusText = "Paused";
          renderParallelItems();
          window.api.pauseParallelDownload(id);
        }
      }
    });
  });

  document.querySelectorAll(".stop-parallel-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const id = e.currentTarget.getAttribute("data-id");
      const index = parallelSessionItems.findIndex((i) => i.id === id);
      if (index !== -1) {
        const item = parallelSessionItems[index];
        if (item.status === "downloaded" || item.status === "stopped") {
          parallelSessionItems.splice(index, 1);
        } else {
          item.status = "stopped";
          item.statusText = "Stopped by user";
          window.api.cancelParallelDownload(id);
        }
        updateParallelDownloadBtnText();
        renderParallelItems();
      }
    });
  });

  updateParallelDownloadBtnText();
}

// Analyze Button Handler
if (parallelAnalyzeBtn) {
  parallelAnalyzeBtn.addEventListener("click", () => {
    const url = parallelUrlInput.value.trim();
    if (!url) {
      if (parallelStatus) {
        parallelStatus.innerText = "Error: Enter a valid link.";
        parallelStatus.style.color = "#ff4444";
      }
      return;
    }
    if (checkAndRedirectPlaylistOrChannel(url, parallelUrlInput)) return;
    updateParallelThumbnailPreview(url);
    if (parallelStatus) {
      parallelStatus.innerText = "Analyzing video link...";
      parallelStatus.style.color = "var(--text-muted)";
    }
    parallelAnalyzeBtn.disabled = true;
    parallelAnalyzeBtn.innerText = "Analyzing...";

    window.api.getMetadata(url, getCookieConfig());
  });
}

// Metadata listener hook to populate parallel thumbnail/title
window.api.onMetadata((data) => {
  if (parallelAnalyzeBtn && parallelAnalyzeBtn.disabled) {
    parallelAnalyzeBtn.disabled = false;
    parallelAnalyzeBtn.innerText = "Analyze";
    if (parallelStatus) {
      parallelStatus.innerText = `Analyzed: ${data.title}`;
      parallelStatus.style.color = "#4CAF50";
    }
  }

  // Update parallel preview banner if URL matches
  if (parallelUrlInput && data.webpage_url && parallelUrlInput.value.includes(data.id)) {
    if (parallelThumbnail) parallelThumbnail.src = data.thumbnail;
    if (parallelPreviewTitle) parallelPreviewTitle.innerText = data.title;
    if (parallelThumbnailContainer) parallelThumbnailContainer.style.display = "block";
  }

  // Update items in queue that were waiting for metadata
  let updatedCount = 0;
  parallelSessionItems.forEach((item) => {
    if ((item.title === item.url || !item.thumbnail || item.thumbnail === "icon.ico") &&
        (item.url === data.webpage_url || item.url.includes(data.id))) {
      item.title = data.title;
      item.thumbnail = data.thumbnail;
      updatedCount++;
    }
  });

  if (updatedCount > 0) {
    renderParallelItems();
  }
});

// Download / Add to Queue Button Handler
if (parallelDownloadBtn) {
  parallelDownloadBtn.addEventListener("click", async () => {
    const url = parallelUrlInput.value.trim();
    if (!url) {
      if (parallelStatus) {
        parallelStatus.innerText = "Error: Enter a valid video link.";
        parallelStatus.style.color = "#ff4444";
      }
      return;
    }
    if (checkAndRedirectPlaylistOrChannel(url, parallelUrlInput)) return;

    const thumbUrl = getThumbnailUrl(url, currentMetadata);
    const titleText = (currentMetadata && (currentMetadata.webpage_url === url || url.includes(currentMetadata.id))) ? currentMetadata.title : url;

    const newItem = {
      id: "p_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
      url: url,
      title: titleText,
      thumbnail: thumbUrl,
      status: "downloading",
      statusText: "Initializing download...",
      percent: 0,
      config: {
        downloadPath: localStorage.getItem("downloadPath") || "",
        mode: parallelConfig.mode,
        container: parallelConfig.container,
        maxRes: parallelConfig.maxRes,
        fps: parallelConfig.fps,
        audioFormat: parallelConfig.audioFormat,
        audioBitrate: parallelConfig.audioBitrate,
        speedLimit: localStorage.getItem("speedLimit") || "",
        cookieConfig: getCookieConfig()
      }
    };

    parallelSessionItems.unshift(newItem);
    parallelUrlInput.value = "";
    if (parallelThumbnailContainer) parallelThumbnailContainer.style.display = "none";
    if (parallelStatus) {
      parallelStatus.innerText = "Added to download session.";
      parallelStatus.style.color = "#4CAF50";
    }

    renderParallelItems();
    window.api.sendParallelDownload(newItem);

    // If metadata title/thumbnail missing, fetch in background
    if (newItem.title === newItem.url || newItem.thumbnail === "icon.ico") {
      window.api.getMetadata(url, getCookieConfig());
    }
  });
}

// Refresh Session Handler
if (parallelRefreshBtn) {
  parallelRefreshBtn.addEventListener("click", () => {
    // Stop all active processes in session
    parallelSessionItems.forEach((item) => {
      if (item.status !== "downloaded" && item.status !== "stopped") {
        window.api.cancelParallelDownload(item.id);
      }
    });

    parallelSessionItems = [];
    if (parallelUrlInput) parallelUrlInput.value = "";
    if (parallelThumbnailContainer) parallelThumbnailContainer.style.display = "none";
    if (parallelStatus) {
      parallelStatus.innerText = "New session started.";
      parallelStatus.style.color = "var(--text-muted)";
    }
    renderParallelItems();
  });
}

// IPC Listeners for Parallel Progress & Status
if (window.api.onParallelProgress) {
  window.api.onParallelProgress(({ id, percent }) => {
    const item = parallelSessionItems.find((i) => i.id === id);
    if (item) {
      item.percent = percent;
      item.statusText = `Downloading: ${percent}%`;
      renderParallelItems();
    }
  });
}

if (window.api.onParallelStatus) {
  window.api.onParallelStatus(({ id, text, isSuccess, isError, isStopped, isPaused, isAlreadyDownloaded }) => {
    const item = parallelSessionItems.find((i) => i.id === id);
    if (item) {
      if (isAlreadyDownloaded || (text && text.toLowerCase().includes("already"))) {
        item.status = "downloaded";
        item.percent = 100;
        item.isAlreadyDownloaded = true;
        item.statusText = "Downloaded already";
        if (typeof loadLibrary === "function") loadLibrary();
      } else if (isSuccess) {
        item.status = "downloaded";
        item.percent = 100;
        item.statusText = "Download complete.";
        if (typeof loadLibrary === "function") loadLibrary();
      } else if (isStopped) {
        item.status = "stopped";
        item.statusText = "Stopped by user.";
      } else if (isPaused) {
        item.status = "paused";
        item.statusText = "Paused.";
      } else if (isError) {
        item.status = "error";
        item.statusText = text || "Download failed.";
      } else {
        item.statusText = text;
      }
      renderParallelItems();
    }
  });
}

/* --- SECTION: PLAYLIST & CHANNEL LOGIC --- */
const playlistUrlInput = document.getElementById("playlistUrlInput");
const playlistAnalyzeBtn = document.getElementById("playlistAnalyzeBtn");
const playlistStatus = document.getElementById("playlistStatus");
const playlistResetBtn = document.getElementById("playlistResetBtn");
const playlistMetaBanner = document.getElementById("playlistMetaBanner");
const playlistTitleText = document.getElementById("playlistTitleText");
const playlistSubText = document.getElementById("playlistSubText");
const playlistSelectAllBtn = document.getElementById("playlistSelectAllBtn");
const playlistDeselectAllBtn = document.getElementById("playlistDeselectAllBtn");
const playlistItemsContainer = document.getElementById("playlistItemsContainer");
const playlistDownloadSelectedBtn = document.getElementById("playlistDownloadSelectedBtn");

const playlistModeSelect = document.getElementById("playlistModeSelect");
const playlistVideoFormatCol = document.getElementById("playlistVideoFormatCol");
const playlistQualityCol = document.getElementById("playlistQualityCol");
const playlistFormatSelect = document.getElementById("playlistFormatSelect");
const playlistQualitySelect = document.getElementById("playlistQualitySelect");

let currentPlaylistEntries = [];
let selectedPlaylistIds = new Set();

// Toggle Mode settings UI (Video Mode vs Audio Mode)
if (playlistModeSelect) {
  playlistModeSelect.addEventListener("change", (e) => {
    if (e.target.value === "video") {
      if (playlistVideoFormatCol) playlistVideoFormatCol.style.display = "block";
      if (playlistQualityCol) playlistQualityCol.style.display = "block";
      if (playlistFormatSelect) {
        playlistFormatSelect.innerHTML = `<option value="mp4">MP4</option><option value="mkv">MKV</option><option value="webm">WebM</option>`;
      }
    } else {
      if (playlistVideoFormatCol) playlistVideoFormatCol.style.display = "block";
      if (playlistQualityCol) playlistQualityCol.style.display = "none";
      if (playlistFormatSelect) {
        playlistFormatSelect.innerHTML = `<option value="mp3">MP3</option><option value="m4a">M4A</option><option value="wav">WAV (Lossless)</option>`;
      }
    }
  });
}

function updatePlaylistSelectedCount() {
  const count = selectedPlaylistIds.size;
  if (playlistDownloadSelectedBtn) {
    playlistDownloadSelectedBtn.innerText = `Download Selected (${count} item${count === 1 ? '' : 's'})`;
    playlistDownloadSelectedBtn.disabled = count === 0;
  }
}

function renderPlaylistEntries() {
  if (!playlistItemsContainer) return;
  playlistItemsContainer.innerHTML = "";

  currentPlaylistEntries.forEach((entry) => {
    const isChecked = selectedPlaylistIds.has(entry.id);
    const card = document.createElement("div");
    card.className = "card";
    card.style.cssText = "padding: 12px 15px; flex-direction: row; gap: 15px; align-items: center; max-width: 100%; width: 100%; border-radius: 12px; cursor: pointer;";

    const durationText = entry.duration ? formatDuration(entry.duration) : "";

    card.innerHTML = `
      <input type="checkbox" class="playlist-item-checkbox" data-id="${entry.id}" ${isChecked ? "checked" : ""} style="width: 18px; height: 18px; cursor: pointer; accent-color: var(--accent); flex-shrink: 0;" />
      <span style="font-size: 0.85rem; font-weight: bold; color: var(--text-muted); width: 28px; text-align: center; flex-shrink: 0;">#${entry.index}</span>
      <img src="${entry.thumbnail}" alt="Thumbnail" style="width: 90px; height: 50px; object-fit: cover; border-radius: 6px; flex-shrink: 0; background: #000;" onerror="if (this.src !== 'icon.ico') this.src='icon.ico';" />
      <div style="flex: 1; display: flex; flex-direction: column; gap: 4px; overflow: hidden;">
        <h3 style="font-size: 0.9rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin: 0; padding: 0; border: none;" title="${entry.title}">${entry.title}</h3>
        <div style="font-size: 0.78rem; color: var(--text-muted); display: flex; gap: 15px;">
          <span>${entry.uploader}</span>
          ${durationText ? `<span>⏱ ${durationText}</span>` : ''}
        </div>
      </div>
    `;

    // Checkbox click toggle
    const checkbox = card.querySelector(".playlist-item-checkbox");
    checkbox.addEventListener("click", (e) => {
      e.stopPropagation();
      if (checkbox.checked) {
        selectedPlaylistIds.add(entry.id);
      } else {
        selectedPlaylistIds.delete(entry.id);
      }
      updatePlaylistSelectedCount();
    });

    // Card row click toggle
    card.addEventListener("click", (e) => {
      if (e.target !== checkbox) {
        checkbox.checked = !checkbox.checked;
        if (checkbox.checked) {
          selectedPlaylistIds.add(entry.id);
        } else {
          selectedPlaylistIds.delete(entry.id);
        }
        updatePlaylistSelectedCount();
      }
    });

    playlistItemsContainer.appendChild(card);
  });

  updatePlaylistSelectedCount();
}

// Fetch Playlist Click Handler
if (playlistAnalyzeBtn) {
  playlistAnalyzeBtn.addEventListener("click", () => {
    const url = playlistUrlInput.value.trim();
    if (!url) {
      if (playlistStatus) {
        playlistStatus.innerText = "Error: Enter a valid Playlist or Channel link.";
        playlistStatus.style.color = "#ff4444";
      }
      return;
    }

    if (playlistStatus) {
      playlistStatus.innerText = "Fetching playlist items (this may take a few seconds)...";
      playlistStatus.style.color = "var(--text-muted)";
    }
    playlistAnalyzeBtn.disabled = true;
    playlistAnalyzeBtn.innerText = "Fetching...";

    window.api.getPlaylistMetadata(url, getCookieConfig());
  });
}

// Playlist Metadata IPC Listener
if (window.api.onPlaylistMetadata) {
  window.api.onPlaylistMetadata((data) => {
    if (playlistAnalyzeBtn) {
      playlistAnalyzeBtn.disabled = false;
      playlistAnalyzeBtn.innerText = "Fetch Playlist";
    }

    currentPlaylistEntries = data.entries || [];
    selectedPlaylistIds = new Set(currentPlaylistEntries.map((e) => e.id));

    if (playlistMetaBanner) playlistMetaBanner.style.display = "flex";
    if (playlistDownloadSelectedBtn) playlistDownloadSelectedBtn.style.display = "block";

    if (playlistTitleText) playlistTitleText.innerText = data.title || "Playlist";
    if (playlistSubText) {
      playlistSubText.innerText = `${data.uploader} • ${currentPlaylistEntries.length} items available`;
    }

    if (playlistStatus) {
      playlistStatus.innerText = `Successfully loaded ${currentPlaylistEntries.length} items. Select items to download.`;
      playlistStatus.style.color = "#4CAF50";
    }

    renderPlaylistEntries();
  });
}

if (window.api.onPlaylistError) {
  window.api.onPlaylistError((msg) => {
    if (playlistAnalyzeBtn) {
      playlistAnalyzeBtn.disabled = false;
      playlistAnalyzeBtn.innerText = "Fetch Playlist";
    }
    if (playlistStatus) {
      playlistStatus.innerText = msg || "Failed to fetch playlist.";
      playlistStatus.style.color = "#ff4444";
    }
  });
}

// Select All / Deselect All
if (playlistSelectAllBtn) {
  playlistSelectAllBtn.addEventListener("click", () => {
    selectedPlaylistIds = new Set(currentPlaylistEntries.map((e) => e.id));
    renderPlaylistEntries();
  });
}

if (playlistDeselectAllBtn) {
  playlistDeselectAllBtn.addEventListener("click", () => {
    selectedPlaylistIds.clear();
    renderPlaylistEntries();
  });
}

// Reset Handler
if (playlistResetBtn) {
  playlistResetBtn.addEventListener("click", () => {
    // Cancel active playlist extraction if currently running
    if (window.api.cancelPlaylistExtraction) {
      window.api.cancelPlaylistExtraction();
    }

    if (playlistAnalyzeBtn) {
      playlistAnalyzeBtn.disabled = false;
      playlistAnalyzeBtn.innerText = "Fetch Playlist";
    }

    currentPlaylistEntries = [];
    selectedPlaylistIds.clear();
    if (playlistUrlInput) playlistUrlInput.value = "";
    if (playlistMetaBanner) playlistMetaBanner.style.display = "none";
    if (playlistDownloadSelectedBtn) playlistDownloadSelectedBtn.style.display = "none";
    if (playlistItemsContainer) playlistItemsContainer.innerHTML = "";
    if (playlistStatus) {
      playlistStatus.innerText = "Playlist Engine Ready";
      playlistStatus.style.color = "var(--text-muted)";
    }
  });
}

// Download Selected Items Button Handler
if (playlistDownloadSelectedBtn) {
  playlistDownloadSelectedBtn.addEventListener("click", () => {
    const selectedEntries = currentPlaylistEntries.filter((e) => selectedPlaylistIds.has(e.id));
    if (selectedEntries.length === 0) return;

    const mode = playlistModeSelect ? playlistModeSelect.value : "video";
    const format = playlistFormatSelect ? playlistFormatSelect.value : (mode === "video" ? "mp4" : "mp3");
    const maxRes = playlistQualitySelect ? playlistQualitySelect.value : "";

    let addedCount = 0;
    selectedEntries.forEach((entry) => {
      const newItem = {
        id: "p_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
        url: entry.url,
        title: entry.title,
        thumbnail: entry.thumbnail,
        status: "downloading",
        statusText: "Queued for download...",
        percent: 0,
        config: {
          downloadPath: localStorage.getItem("downloadPath") || "",
          mode: mode,
          container: mode === "video" ? format : "mp4",
          maxRes: mode === "video" ? maxRes : "",
          fps: "",
          audioFormat: mode === "audio" ? format : "mp3",
          audioBitrate: "",
          useArchive: localStorage.getItem("enableArchive") === "true",
          speedLimit: localStorage.getItem("speedLimit") || "",
          cookieConfig: getCookieConfig()
        }
      };



      parallelSessionItems.push(newItem);
      window.api.sendParallelDownload(newItem);
      addedCount++;
    });

    if (typeof renderParallelItems === "function") {
      renderParallelItems();
    }

    // Switch view automatically to Parallel Download section
    const parallelNavBtn = document.querySelector('[data-target="view-parallel"]');
    if (parallelNavBtn) {
      parallelNavBtn.click();
    }

    if (parallelStatus) {
      parallelStatus.innerText = `Queued ${addedCount} items from Playlist. Downloading in parallel...`;
      parallelStatus.style.color = "#4CAF50";
    }
  });
}