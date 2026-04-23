import { state, resetHistory } from '../state.js'; 
import { TUTORIAL_STEPS } from '../config.js';
import { escapeHTML, parseSemText } from '../utils.js';
import * as UICommon from './common.js';

export function showInstructionModal() { document.getElementById('instruction-modal').style.display = 'flex'; }
export function openTutorialSelection() { document.getElementById('tutorial-selection-modal').style.display = 'flex'; }
export function openImportModal() { document.getElementById('import-modal').style.display = 'flex'; }
export function showClearModal() { document.getElementById('clear-modal').style.display = 'flex'; }
export function showSurprise() { document.getElementById('surprise-modal').style.display = 'flex'; }
export function showSemesterConflictModal(current, newTag) {
    document.getElementById('sem-current-val').innerText = parseSemText(current);
    document.getElementById('sem-new-val').innerText = parseSemText(newTag);
    document.getElementById('semester-modal').style.display = 'flex';
}

export function showExcelGuide() {
    UICommon.showAlert('操作指引', 
        `請到主界面的「找課選單」<br>→ 找到 「當學期課程查詢」<br>→ 點擊 「開課和課程大綱查詢」<br>→ 點選 「開課資料匯出」`
    );
    const msgEl = document.getElementById('alert-msg');
    if (msgEl) msgEl.style.textAlign = 'left';
}

export function showDetail(id) {
    const c = state.allCourses.find(x=>x.id===id); if(!c)return;
    state.currentDetailId = id;
    
    let h=''; 
    Object.keys(c.rawRow).forEach(k => {
        h += `<div style="margin-bottom:5px;"><b>${escapeHTML(k)}:</b> ${escapeHTML(String(c.rawRow[k]))}</div>`;
    });
    document.getElementById('detail-content').innerHTML = h;
    
    const isScheduled = state.scheduledCourses.some(sc => sc.id === id);
    const isInHolding = state.holdingCourses.some(sc => sc.id === id);
    const btnGroup = document.getElementById('detail-btn-group');
    
    if (btnGroup) {
        let buttonsHtml = '';
        if (state.interactionMode === 'view') {
            buttonsHtml = `<div style="text-align:center; color:#999; font-size:0.9rem;">(檢視模式：僅供瀏覽)</div>`;
        } else {
            if (isScheduled) {
                buttonsHtml += `<button class="btn-action btn-outline" style="color:var(--danger); border-color:var(--danger);" onclick="app.confirmDeleteFromModal()"><i class="fas fa-trash-alt"></i> 從課表移除</button>`;
            } else {
                buttonsHtml += `<button class="btn-action btn-primary" onclick="app.confirmAddFromModal()"><i class="fas fa-plus"></i> 排入課表</button>`;
            }
            if (isInHolding) {
                buttonsHtml += `<button class="btn-action btn-outline" onclick="app.removeFromHoldingFromModal('${id}')"><i class="fas fa-box-open"></i> 取消暫存</button>`;
            } else {
                buttonsHtml += `<button class="btn-action btn-outline" style="color:var(--warning); border-color:var(--warning);" onclick="app.addToHoldingFromModal('${id}')"><i class="fas fa-inbox"></i> 加入暫存</button>`;
            }
        }
        btnGroup.innerHTML = buttonsHtml;
    }
    document.getElementById('detail-modal').style.display='flex';
}

export function openFileManager() {
    renderFileList();
    document.getElementById('file-modal').style.display = 'flex';
}

export function showClearExcelModal() { 
    document.getElementById('clear-excel-modal').style.display = 'flex'; 
}

function renderFileList() {
    const localList = document.getElementById('local-files-list');
    const projectList = document.getElementById('project-files-list');
    const localHeader = document.querySelector("div[onclick*='local-files-list']");
    const projectHeader = document.querySelector("div[onclick*='project-files-list']");

    if (!localList || !projectList) return;

    const locals = state.loadedFiles.filter(f => f.source === 'local');
    const projects = state.loadedFiles.filter(f => f.source === 'project');

    const generateHtml = (files) => {
        if(files.length === 0) return '<div class="file-item-placeholder" style="padding:10px; color:#999; text-align:center;">無檔案</div>';
        return files.map(f => `
            <li class="file-item">
                <div class="file-info">
                    <div class="file-name" style="font-weight:bold;">${escapeHTML(f.name)}</div>
                    <div class="file-meta" style="font-size:0.8rem; color:#888;">${f.originalName} (${Math.round(f.size/1024)} KB)</div>
                </div>
                <button class="btn-delete-file" onclick="app.removeFile('${f.id}')" title="移除此檔案" style="background:transparent; border:none;">
                    <i class="fas fa-trash"></i>
                </button>
            </li>
        `).join('');
    };

    localList.innerHTML = generateHtml(locals);
    projectList.innerHTML = generateHtml(projects);

    if(localHeader) {
        const span = localHeader.querySelector('span');
        if(span) span.innerHTML = `<i class="fas fa-user-upload" style="color:#27ae60;"></i> 自行匯入資料庫 (${locals.length})`;
    }
    if(projectHeader) {
        const span = projectHeader.querySelector('span');
        if(span) span.innerHTML = `<i class="fas fa-project-diagram" style="color:#e67e22;"></i> 專案連結資料庫 (${projects.length})`;
    }
}

export function removeFile(fid) {
    const file = state.loadedFiles.find(f => f.id === fid);
    if (!file) return;

    UICommon.showConfirm('移除檔案', `確定要移除 <b>${escapeHTML(file.name)}</b> 嗎？<br>相關的課程將會從列表中消失。`, () => {
        state.loadedFiles = state.loadedFiles.filter(f => f.id !== fid);
        state.allCourses = state.allCourses.filter(c => c.fileId !== fid);
        state.scheduledCourses = state.scheduledCourses.filter(c => c.fileId !== fid);
        state.holdingCourses = state.holdingCourses.filter(c => c.fileId !== fid);

        resetHistory();
        UICommon.updateUndoRedoButtons();
        renderFileList();
        if(window.app && window.app.resetFilters) window.app.resetFilters();
    });
}

export function clearFilesBySource(source) {
    const targetFiles = state.loadedFiles.filter(f => f.source === source);
    if(targetFiles.length === 0) return;

    const name = source === 'local' ? '自行匯入' : '專案內建';
    UICommon.showConfirm(`清空${name}檔案`, `確定要移除所有 <b>${name}</b> 的檔案嗎？`, () => {
        const idsToRemove = targetFiles.map(f => f.id);
        
        state.loadedFiles = state.loadedFiles.filter(f => f.source !== source);
        state.allCourses = state.allCourses.filter(c => !idsToRemove.includes(c.fileId));
        state.scheduledCourses = state.scheduledCourses.filter(c => !idsToRemove.includes(c.fileId));
        state.holdingCourses = state.holdingCourses.filter(c => !idsToRemove.includes(c.fileId));

        resetHistory();
        UICommon.updateUndoRedoButtons();
        renderFileList();
        if(window.app && window.app.resetFilters) window.app.resetFilters();
    });
}

export function toggleFileSection(listId, headerEl) {
    const list = document.getElementById(listId);
    if (list.style.display === 'none') {
        list.style.display = 'block';
        headerEl.classList.add('active');
    } else {
        list.style.display = 'none';
        headerEl.classList.remove('active');
    }
}

export function showStep(stepIndex) {
    document.getElementById('tutorial-mask').style.display = 'none';
    const highlight = document.getElementById('tutorial-highlight');
    const dialog = document.getElementById('tutorial-dialog');
    
    if (stepIndex >= TUTORIAL_STEPS.length) {
        endTutorial();
        return;
    }

    const step = TUTORIAL_STEPS[stepIndex];
    const target = document.querySelector(step.target);

    if (target) {
        let parent = target.parentElement;
        while (parent && parent !== document.body) {
            if (parent.classList.contains('collapsible-content')) {
                if (!parent.classList.contains('show')) {
                    parent.classList.add('show');
                    const header = parent.previousElementSibling;
                    if (header && header.classList.contains('collapsible-header')) {
                        header.classList.add('active');
                        const arrow = header.querySelector('.arrow-icon') || header.querySelector('.fa-chevron-down');
                        if (arrow) {
                            arrow.style.transform = 'rotate(180deg)';
                        }
                    }
                }
            }
            parent = parent.parentElement;
        }

        target.scrollIntoView({ behavior: 'auto', block: 'center', inline: 'nearest' });

        document.getElementById('tutorial-mask').style.display = 'block';
        const rect = target.getBoundingClientRect();
        const padding = 5;
        
        highlight.style.width = (rect.width + padding * 2) + 'px';
        highlight.style.height = (rect.height + padding * 2) + 'px';
        highlight.style.top = (rect.top - padding) + 'px';
        highlight.style.left = (rect.left - padding) + 'px';

        document.getElementById('tut-title').innerText = step.title;
        document.getElementById('tut-desc').innerHTML = step.desc;
        document.getElementById('tut-step-display').innerText = `${stepIndex + 1} / ${TUTORIAL_STEPS.length}`;
        document.getElementById('tut-next-btn').innerText = (stepIndex === TUTORIAL_STEPS.length - 1) ? '完成' : '下一步';

        const dialogHeight = dialog.offsetHeight || 150; 
        const viewportHeight = window.innerHeight;
        if (rect.top > viewportHeight / 2) {
            dialog.style.top = Math.max(10, rect.top - dialogHeight - 30) + 'px';
        } else {
            dialog.style.top = Math.min(viewportHeight - dialogHeight - 10, rect.bottom + 20) + 'px';
        }
        
        let left = rect.left + (rect.width / 2) - 150; 
        if (left < 10) left = 10;
        if (left + 300 > window.innerWidth) left = window.innerWidth - 310;
        dialog.style.left = left + 'px';
    } else {
        showStep(stepIndex + 1);
    }
}

export function endTutorial() {
    state.currentTutorialStep = -1;
    document.getElementById('tutorial-mask').style.display = 'none';
    UICommon.showAlert('教學完成', '您現在可以開始排課了！<br>若需要再次查看，請至「說明與教學」區塊。');
}

let currentWelcomeIndex = 0;
const totalWelcomeSlides = 3;

export function openWelcomeModal(isManual) {
    const modal = document.getElementById('welcome-modal');
    const checkboxContainer = document.getElementById('welcome-checkbox-container');
    const checkbox = document.getElementById('welcome-dont-show');
    resetWelcomeSlide();
    if(checkbox) checkbox.checked = false;
    if (isManual) { if(checkboxContainer) checkboxContainer.style.display = 'none'; } 
    else { if(checkboxContainer) checkboxContainer.style.display = 'block'; }
    modal.style.display = 'flex';
}

export function resetWelcomeSlide() { currentWelcomeIndex = 0; updateWelcomeSlideUI(); }

export function updateWelcomeSlideUI() {
    const track = document.getElementById('welcome-track');
    const dots = document.querySelectorAll('.welcome-dot');
    const slides = document.querySelectorAll('.welcome-slide');
    const nextBtn = document.getElementById('btn-welcome-next');
    const skipBtn = document.getElementById('btn-welcome-skip');

    if(!track) return;

    track.style.transform = `translateX(-${currentWelcomeIndex * 100}%)`;
    dots.forEach((dot, idx) => { if(idx === currentWelcomeIndex) dot.classList.add('active'); else dot.classList.remove('active'); });
    slides.forEach((slide, idx) => { if(idx === currentWelcomeIndex) slide.classList.add('active'); else slide.classList.remove('active'); });

    if (currentWelcomeIndex === totalWelcomeSlides - 1) {
        nextBtn.innerHTML = '<i class="fas fa-check"></i> 開始使用';
        nextBtn.style.background = 'var(--success)';
        if(skipBtn) skipBtn.style.display = 'none';
    } else {
        nextBtn.innerHTML = '下一步 <i class="fas fa-arrow-right"></i>';
        nextBtn.style.background = 'var(--primary)';
        if(skipBtn) skipBtn.style.display = 'block';
    }
}

export function nextWelcomeSlide() {
    if (currentWelcomeIndex < totalWelcomeSlides - 1) { currentWelcomeIndex++; updateWelcomeSlideUI(); } 
    else { if(window.app && window.app.closeWelcome) window.app.closeWelcome(); }
}