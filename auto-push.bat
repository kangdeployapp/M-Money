@echo off
title M-Money GitHub Auto Push Watcher
chcp 65001 >nul
cd /d "%~dp0"
node scripts/auto-push.mjs
pause
