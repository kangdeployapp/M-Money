import { execSync } from 'child_process';

const CHECK_INTERVAL_MS = 5000; // ตรวจสอบทุก 5 วินาที
const DEBOUNCE_MS = 3000;       // หน่วงเวลารอเขียนไฟล์เสร็จ 3 วินาที

let isPushing = false;
let pendingPush = false;
let debounceTimer = null;

function runGit(cmd) {
  try {
    return execSync(cmd, { stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf-8' }).trim();
  } catch (err) {
    if (err.stderr) {
      console.error(`[Git Error] ${err.stderr.toString().trim()}`);
    }
    return null;
  }
}

async function doCommitAndPush() {
  if (isPushing) {
    pendingPush = true;
    return;
  }

  isPushing = true;
  try {
    const status = runGit('git status --porcelain');
    if (!status) {
      isPushing = false;
      return;
    }

    const now = new Date();
    const timeStr = now.toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' });
    console.log(`\n[${timeStr}] ตรวจพบการแก้ไขไฟล์:`);
    const changedFiles = status.split('\n').slice(0, 5).join('\n  ');
    console.log(`  ${changedFiles}${status.split('\n').length > 5 ? '\n  ...' : ''}`);

    console.log(' กำลัง Git Add & Commit...');
    runGit('git add -A');
    
    const commitMsg = `Auto update: ${now.toISOString().replace('T', ' ').substring(0, 19)}`;
    const commitResult = runGit(`git commit -m "${commitMsg}"`);
    if (commitResult) {
      console.log(` Commit สำเร็จ: ${commitMsg}`);
    }

    console.log(' กำลัง Push ขึ้น GitHub (origin/main)...');
    const pushResult = runGit('git push origin main');
    console.log(' อัปโหลดขึ้น GitHub สำเร็จเรียบร้อยแล้ว!');
  } catch (err) {
    console.error(' เกิดข้อผิดพลาดในการ Push:', err.message);
  } finally {
    isPushing = false;
    if (pendingPush) {
      pendingPush = false;
      setTimeout(doCommitAndPush, 1000);
    }
  }
}

function checkChanges() {
  try {
    const status = runGit('git status --porcelain');
    if (status && !isPushing) {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(doCommitAndPush, DEBOUNCE_MS);
    }
  } catch (err) {
    // ignore
  }
}

console.log('====================================================');
console.log(' 🚀 ระบบ Auto-Push ไปยัง GitHub ทำงานอยู่...');
console.log(' 📦 Remote: https://github.com/kangdeployapp/M-Money');
console.log(' 🌿 Branch: main');
console.log(' 💡 แก้ไขไฟล์ใดๆ ระบบจะทำการ Commit และ Push ให้อัตโนมัติ');
console.log(' (กด Ctrl + C เพื่อหยุดการทำงาน)');
console.log('====================================================\n');

setInterval(checkChanges, CHECK_INTERVAL_MS);
