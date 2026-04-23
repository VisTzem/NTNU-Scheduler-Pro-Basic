import { state, setAllCourses, setScheduledCourses, setHoldingCourses, resetHistory } from '../state.js';
import * as UIStats from '../ui/stats.js'; 

const STORAGE_KEY = 'ntnu_scheduler_cache_v1';

export function saveToLocalStorage() {
    if (!state.isLocalDirty) return; 

    try {
        const cacheData = {
            timestamp: Date.now(),
            version: 2,
            allCourses: state.allCourses,
            scheduledIds: state.scheduledCourses.map(c => c.id),
            holdingIds: state.holdingCourses.map(c => c.id),
            loadedFiles: state.loadedFiles,
            currentProject: state.currentProject,
            settings: {
                userDept: document.getElementById('user-dept-select')?.value || 'all',
                colorMode: state.colorMode,
                theme: state.currentTheme
            }
        };

        const jsonString = JSON.stringify(cacheData);
        localStorage.setItem(STORAGE_KEY, jsonString);
        state.isLocalDirty = false;
        
        const statusEl = document.getElementById('local-save-status');
        if (statusEl) {
            const timeStr = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'});
            statusEl.innerText = `已自動備份 ${timeStr}`;
            statusEl.style.color = 'var(--text-sub)';
        }

    } catch (e) {
        console.error("Local Save Failed:", e);
        const statusEl = document.getElementById('local-save-status');
        if (statusEl) {
            statusEl.innerText = '備份失敗 (容量不足)';
            statusEl.style.color = 'var(--danger)';
        }
    }
}

export function loadFromLocalStorage() {
    try {
        const jsonString = localStorage.getItem(STORAGE_KEY);
        if (!jsonString) return false;

        const cacheData = JSON.parse(jsonString);
        
        state.loadedFiles = cacheData.loadedFiles || [];
        setAllCourses(cacheData.allCourses || []);
        
        const scheduledIds = cacheData.scheduledIds || [];
        setScheduledCourses(state.allCourses.filter(c => scheduledIds.includes(c.id)), false); 
        
        const holdingIds = cacheData.holdingIds || [];
        setHoldingCourses(state.allCourses.filter(c => holdingIds.includes(c.id)));
        
        if (cacheData.currentProject) {
            state.currentProject = cacheData.currentProject;
        }

        if (cacheData.settings) {
            if (cacheData.settings.userDept) {
                setTimeout(() => {
                    const sel = document.getElementById('user-dept-select');
                    if(sel) sel.value = cacheData.settings.userDept;
                    if(UIStats && UIStats.updateCredits) UIStats.updateCredits();
                }, 100);
            }
            if (cacheData.settings.colorMode !== undefined) state.colorMode = cacheData.settings.colorMode;
            if (cacheData.settings.theme) {
                if (state.currentTheme !== cacheData.settings.theme) {
                    const themeBtn = document.getElementById('theme-btn');
                    if(themeBtn) themeBtn.click();
                }
            }
        }
        
        resetHistory(); 
        return true;

    } catch (e) {
        console.error("Local Load Failed:", e);
        return false;
    }
}