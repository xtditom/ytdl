# YTDL - Advanced Media Extraction Engine

A lightweight, universal desktop client for `yt-dlp` and `FFmpeg`, built with Electron. Designed for maximum extraction efficiency with zero bloat.

## 🚀 Core Features
* **Dynamic Architecture Routing:** Automatically detects host OS architecture (x64, ia32) and injects the optimized native binaries at runtime.
* **Thin Client Bootloader:** Keeps the initial application size under 150MB by downloading media codecs dynamically during the first launch.
* **Advanced Extraction Engine:** Isolated video and audio extraction protocols with custom caps for framerate, resolution, and audio bitrate.
* **Garbage Collection:** Automatically sweeps and purges fragmented `.part` and `.ytdl` files upon forceful termination.

## ⚙️ Technical Architecture
* **Frontend:** Vanilla HTML/CSS/JS (Zero-Touch UI Protocol)
* **Backend:** Node.js / Electron
* **Engines:** `yt-dlp` (Core), `FFmpeg` (Codec Merging), `ffprobe` (Metadata)

## 📦 Installation
Download the latest Universal Setup executable from the [Releases](../../releases) page. The installer will automatically configure the correct 32-bit or 64-bit dependencies for your system.

## 🛡️ Security Note
This build forces `devTools: false` and removes the default application menu to prevent Chromium inspector injections and shortcut overrides in production environments.