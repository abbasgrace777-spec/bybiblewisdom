const fs = require('fs');
const path = require('path');
const config = require('../config');
const { get, run } = require('../db/database');

class CleanupService {
  constructor() {
    this.intervalId = null;
  }

  /**
   * Calculate size of directory recursively
   */
  getDirSize(dirPath) {
    let totalSize = 0;
    if (!fs.existsSync(dirPath)) return 0;
    try {
      const items = fs.readdirSync(dirPath, { withFileTypes: true });
      for (const item of items) {
        const full = path.join(dirPath, item.name);
        try {
          if (item.isDirectory()) {
            totalSize += this.getDirSize(full);
          } else if (item.isFile()) {
            totalSize += fs.statSync(full).size;
          }
        } catch (_) {}
      }
    } catch (_) {}
    return totalSize;
  }

  /**
   * Get current storage statistics and settings
   */
  getStorageStats() {
    const storageDir = config.PATHS.STORAGE || path.join(config.PATHS.ROOT, 'storage');
    const projectsDir = path.join(storageDir, 'projects');
    const tempDir = path.join(storageDir, 'temp');
    const byBibleDir = path.join(config.PATHS.ROOT, 'ByBibleWisdom');

    const storageSize = this.getDirSize(storageDir);
    const projectsSize = this.getDirSize(projectsDir);
    const tempSize = this.getDirSize(tempDir);
    const byBibleSize = this.getDirSize(byBibleDir);

    const autoCleanRow = get(`SELECT value FROM settings WHERE key = 'STORAGE_AUTO_CLEANUP_ENABLED'`);
    const retentionRow = get(`SELECT value FROM settings WHERE key = 'STORAGE_RETENTION_DAYS'`);
    const cleanVideosRow = get(`SELECT value FROM settings WHERE key = 'STORAGE_CLEAN_VIDEOS_ENABLED'`);
    const lastCleanedRow = get(`SELECT value FROM settings WHERE key = 'STORAGE_LAST_CLEANED_AT'`);
    const lastFreedRow = get(`SELECT value FROM settings WHERE key = 'STORAGE_LAST_FREED_MB'`);

    const autoCleanupEnabled = autoCleanRow ? autoCleanRow.value === 'true' : true;
    const retentionDays = retentionRow ? parseInt(retentionRow.value, 10) || 5 : 5;
    const cleanVideosEnabled = cleanVideosRow ? cleanVideosRow.value === 'true' : false;

    return {
      storageSizeBytes: storageSize,
      storageSizeGB: (storageSize / 1024 / 1024 / 1024).toFixed(2),
      projectsSizeGB: (projectsSize / 1024 / 1024 / 1024).toFixed(2),
      tempSizeMB: (tempSize / 1024 / 1024).toFixed(1),
      byBibleSizeGB: (byBibleSize / 1024 / 1024 / 1024).toFixed(2),
      totalUsedGB: ((storageSize + byBibleSize) / 1024 / 1024 / 1024).toFixed(2),
      autoCleanupEnabled,
      retentionDays,
      cleanVideosEnabled,
      lastCleanedAt: lastCleanedRow ? lastCleanedRow.value : null,
      lastFreedMB: lastFreedRow ? parseFloat(lastFreedRow.value) || 0 : 0
    };
  }

  /**
   * Update storage cleanup settings
   */
  updateSettings({ autoCleanupEnabled, retentionDays, cleanVideosEnabled }) {
    if (autoCleanupEnabled !== undefined) {
      run(`INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES ('STORAGE_AUTO_CLEANUP_ENABLED', ?, CURRENT_TIMESTAMP)`, [String(autoCleanupEnabled)]);
    }
    if (retentionDays !== undefined) {
      const days = Math.max(1, parseInt(retentionDays, 10) || 5);
      run(`INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES ('STORAGE_RETENTION_DAYS', ?, CURRENT_TIMESTAMP)`, [String(days)]);
    }
    if (cleanVideosEnabled !== undefined) {
      run(`INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES ('STORAGE_CLEAN_VIDEOS_ENABLED', ?, CURRENT_TIMESTAMP)`, [String(cleanVideosEnabled)]);
    }
    return this.getStorageStats();
  }

  /**
   * Safely delete a file and return freed bytes
   */
  safeDeleteFile(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        const size = fs.statSync(filePath).size;
        fs.unlinkSync(filePath);
        return size;
      }
    } catch (_) {}
    return 0;
  }

  /**
   * Safely delete a directory recursively and return freed bytes
   */
  safeDeleteDir(dirPath) {
    let freed = 0;
    try {
      if (fs.existsSync(dirPath)) {
        freed = this.getDirSize(dirPath);
        fs.rmSync(dirPath, { recursive: true, force: true });
      }
    } catch (_) {}
    return freed;
  }

  /**
   * Execute cleanup according to retention policy
   * @param {Object} options Override retention settings
   */
  executeCleanup(options = {}) {
    const stats = this.getStorageStats();
    const retentionDays = options.retentionDays !== undefined ? options.retentionDays : stats.retentionDays;
    const cleanVideos = options.cleanVideosEnabled !== undefined ? options.cleanVideosEnabled : stats.cleanVideosEnabled;

    const now = Date.now();
    const cutoffTime = now - retentionDays * 24 * 60 * 60 * 1000;
    const tempCutoffTime = now - 2 * 24 * 60 * 60 * 1000; // Temp files older than 2 days

    let totalBytesFreed = 0;
    let filesDeleted = 0;
    let dirsDeleted = 0;

    const storageDir = config.PATHS.STORAGE || path.join(config.PATHS.ROOT, 'storage');
    const projectsDir = path.join(storageDir, 'projects');
    const tempDir = path.join(storageDir, 'temp');
    const byBibleDir = path.join(config.PATHS.ROOT, 'ByBibleWisdom');

    console.log(`[CleanupService] Starting cleanup with retention: ${retentionDays} days (cutoff: ${new Date(cutoffTime).toISOString()})...`);

    // 1. Clean storage/temp (older than 2 days)
    if (fs.existsSync(tempDir)) {
      try {
        const tempItems = fs.readdirSync(tempDir);
        for (const item of tempItems) {
          const itemPath = path.join(tempDir, item);
          try {
            const stat = fs.statSync(itemPath);
            if (stat.mtimeMs < tempCutoffTime) {
              if (stat.isDirectory()) {
                totalBytesFreed += this.safeDeleteDir(itemPath);
                dirsDeleted++;
              } else {
                totalBytesFreed += this.safeDeleteFile(itemPath);
                filesDeleted++;
              }
            }
          } catch (_) {}
        }
      } catch (err) {
        console.warn(`[CleanupService] Notice cleaning temp dir:`, err.message);
      }
    }

    // 2. Clean storage/projects (raw intermediate render files older than retentionDays)
    if (fs.existsSync(projectsDir)) {
      try {
        const projDirs = fs.readdirSync(projectsDir);
        for (const pName of projDirs) {
          const pPath = path.join(projectsDir, pName);
          try {
            const stat = fs.statSync(pPath);
            if (!stat.isDirectory()) continue;

            // Clean audit folders older than retentionDays
            if (pName.startsWith('audit_') && stat.mtimeMs < cutoffTime) {
              totalBytesFreed += this.safeDeleteDir(pPath);
              dirsDeleted++;
              continue;
            }

            // For project folders older than retentionDays:
            if (stat.mtimeMs < cutoffTime) {
              // Delete heavy intermediate folders: clips, audio scene cuts, wav files, intermediate mp4s
              const clipsDir = path.join(pPath, 'clips');
              if (fs.existsSync(clipsDir)) {
                totalBytesFreed += this.safeDeleteDir(clipsDir);
                dirsDeleted++;
              }

              const qcDir = path.join(pPath, 'qc_frames');
              if (fs.existsSync(qcDir)) {
                totalBytesFreed += this.safeDeleteDir(qcDir);
                dirsDeleted++;
              }

              // In output: delete heavy WAV files and redundant intermediate mp4s
              const outDir = path.join(pPath, 'output');
              if (fs.existsSync(outDir)) {
                const outFiles = fs.readdirSync(outDir);
                for (const ofile of outFiles) {
                  if (ofile.endsWith('.wav') || ofile.startsWith('temp_') || ofile === 'final_video.mp4') {
                    const fPath = path.join(outDir, ofile);
                    totalBytesFreed += this.safeDeleteFile(fPath);
                    filesDeleted++;
                  }
                }
              }

              // In audio: delete intermediate scene_* cuts and wavs
              const audioDir = path.join(pPath, 'audio');
              if (fs.existsSync(audioDir)) {
                const audioItems = fs.readdirSync(audioDir);
                for (const aItem of audioItems) {
                  const aPath = path.join(audioDir, aItem);
                  try {
                    const aStat = fs.statSync(aPath);
                    if (aStat.isDirectory() && aItem.startsWith('scene_')) {
                      totalBytesFreed += this.safeDeleteDir(aPath);
                      dirsDeleted++;
                    } else if (aItem.endsWith('.wav')) {
                      totalBytesFreed += this.safeDeleteFile(aPath);
                      filesDeleted++;
                    }
                  } catch (_) {}
                }
              }
            }
          } catch (_) {}
        }
      } catch (err) {
        console.warn(`[CleanupService] Notice cleaning projects dir:`, err.message);
      }
    }

    // 3. Optional: Clean ByBibleWisdom Final_Video.mp4 files older than retentionDays (if enabled)
    if (cleanVideos && fs.existsSync(byBibleDir)) {
      try {
        const findMp4s = (dir) => {
          let list = [];
          for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
            const full = path.join(dir, item.name);
            if (item.isDirectory()) {
              list = list.concat(findMp4s(full));
            } else if (item.isFile() && item.name === 'Final_Video.mp4') {
              list.push(full);
            }
          }
          return list;
        };

        const mp4Files = findMp4s(byBibleDir);
        for (const mp4 of mp4Files) {
          try {
            const mStat = fs.statSync(mp4);
            if (mStat.mtimeMs < cutoffTime) {
              totalBytesFreed += this.safeDeleteFile(mp4);
              filesDeleted++;
              console.log(`[CleanupService] Purged aged final video: ${mp4}`);
            }
          } catch (_) {}
        }
      } catch (err) {
        console.warn(`[CleanupService] Notice cleaning ByBibleWisdom videos:`, err.message);
      }
    }

    const freedMB = (totalBytesFreed / 1024 / 1024).toFixed(1);
    const freedGB = (totalBytesFreed / 1024 / 1024 / 1024).toFixed(2);
    const nowIso = new Date().toISOString();

    run(`INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES ('STORAGE_LAST_CLEANED_AT', ?, CURRENT_TIMESTAMP)`, [nowIso]);
    run(`INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES ('STORAGE_LAST_FREED_MB', ?, CURRENT_TIMESTAMP)`, [freedMB]);

    console.log(`[CleanupService] Completed cleanup: Freed ${freedGB} GB (${freedMB} MB) across ${filesDeleted} files and ${dirsDeleted} directories.`);

    const updatedStats = this.getStorageStats();
    return {
      success: true,
      freedBytes: totalBytesFreed,
      freedMB,
      freedGB,
      filesDeleted,
      dirsDeleted,
      retentionDays,
      ...updatedStats
    };
  }

  /**
   * Start scheduled background cleaner (runs every 12 hours)
   */
  startScheduledCleanup() {
    if (this.intervalId) return;

    // Run 1 minute after server boot to avoid startup congestion
    setTimeout(() => {
      const stats = this.getStorageStats();
      if (stats.autoCleanupEnabled) {
        console.log(`[CleanupService] Running scheduled startup cleanup...`);
        this.executeCleanup();
      }
    }, 60000);

    // Schedule check every 12 hours
    const TWELVE_HOURS = 12 * 60 * 60 * 1000;
    this.intervalId = setInterval(() => {
      const stats = this.getStorageStats();
      if (stats.autoCleanupEnabled) {
        console.log(`[CleanupService] Running recurring 12-hour background storage cleanup...`);
        this.executeCleanup();
      }
    }, TWELVE_HOURS);
  }
}

module.exports = new CleanupService();
