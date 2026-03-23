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

if (localStorage.getItem("theme") === "light") {
  document.body.classList.add("light-mode");
  themeIcon.innerHTML = `<path d="${sunPath}"/>`;
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

function triggerAnalysis(url) {
  if (!url) {
    statusDiv.innerText = "Error: Please enter a link.";
    statusDiv.style.color = "#ff4444";
    advStatus.innerText = "Error: Please enter a link.";
    advStatus.style.color = "#ff4444";
    return;
  }

  if (url.includes("youtube.com/") || url.includes("youtu.be/")) {
    statusDiv.innerText = "Analyzing video...";
    statusDiv.style.color = "var(--text-muted)";
    analyzeBtn.disabled = true;
    analyzeBtn.innerText = "Please wait...";
    
    advStatus.innerText = "Analyzing video...";
    advStatus.style.color = "var(--text-muted)";
    advAnalyzeBtn.disabled = true;
    advAnalyzeBtn.innerText = "Please wait...";
    
    window.api.getMetadata(url);
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
  thumbnail.style.display = "none";
  advMetaHeader.style.display = "none";
  
  videoTitle.innerText = "Paste a link to begin";
  statusDiv.innerText = "Ready";
  statusDiv.style.color = "var(--text-muted)";
  
  advStatus.innerText = "Advanced Engine Ready";
  advStatus.style.color = "var(--text-muted)";
}

urlInput.addEventListener("input", (e) => {
  if (advUrlInput.value !== e.target.value) {
    advUrlInput.value = e.target.value;
  }
  resetUIs();
});

advUrlInput.addEventListener("input", (e) => {
  if (urlInput.value !== e.target.value) {
    urlInput.value = e.target.value;
  }
  resetUIs();
});

/* --- SECTION: METADATA SUCCESS HANDLER --- */
window.api.onMetadata((data) => {
  analyzeBtn.style.display = "none";
  advAnalyzeBtn.style.display = "none";
  downloadSection.style.display = "flex";
  advConfigSection.style.display = "flex";

  videoTitle.innerText = data.title;
  thumbnail.src = data.thumbnail;
  thumbnail.style.display = "block";

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

  window.api.sendDownload(
    url,
    isAudio ? "audio" : "video",
    selection,
    localStorage.getItem("downloadPath") || "",
    currentSpeedLimit
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
    speedLimit: localStorage.getItem("speedLimit") || ""
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
const downloadPathInput = document.getElementById("downloadPathInput");
const settingDefaultVideo = document.getElementById("settingDefaultVideo");
const settingDefaultAudio = document.getElementById("settingDefaultAudio");
const settingSpeedLimit = document.getElementById("settingSpeedLimit");

// Initialize values from localStorage
if (downloadPathInput) downloadPathInput.value = localStorage.getItem("downloadPath") || "Default Directory (System Downloads)";
if (settingDefaultVideo) settingDefaultVideo.value = localStorage.getItem("defaultVideo") || "";
if (settingDefaultAudio) settingDefaultAudio.value = localStorage.getItem("defaultAudio") || "mp3";
if (settingSpeedLimit) settingSpeedLimit.value = localStorage.getItem("speedLimit") || "";

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

if (settingDefaultVideo) settingDefaultVideo.addEventListener("change", (e) => localStorage.setItem("defaultVideo", e.target.value));
if (settingDefaultAudio) settingDefaultAudio.addEventListener("change", (e) => localStorage.setItem("defaultAudio", e.target.value));
if (settingSpeedLimit) settingSpeedLimit.addEventListener("input", (e) => localStorage.setItem("speedLimit", e.target.value));

document.getElementById("openFolderBtn").addEventListener("click", () => {
  window.api.openFolder(localStorage.getItem("downloadPath") || "");
});

document.getElementById("advOpenFolderBtn").addEventListener("click", () => {
  window.api.openFolder(localStorage.getItem("downloadPath") || "");
});

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