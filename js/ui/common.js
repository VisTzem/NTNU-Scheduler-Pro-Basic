// js/ui/common.js
import { state } from '../state.js';
import { MODE_NAMES } from '../config.js';
import * as UISchedule from './schedule.js';

export function showConfirm(title, msg, onConfirm) {
    document.getElementById('generic-confirm-title').innerText = title;
    document.getElementById('generic-confirm-msg').innerHTML = msg;
    
    const btn = document.getElementById('generic-confirm-btn');
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    
    newBtn.onclick = () => {
        closeModal('generic-confirm-modal');
        if (onConfirm) onConfirm();
    };
    
    document.getElementById('generic-confirm-modal').style.display = 'flex';
}

export function showAlert(title, msg, isSuccess = true, callback = null) {
    const modal = document.getElementById('alert-modal');
    const iconDiv = document.getElementById('alert-icon');
    const msgDiv = document.getElementById('alert-msg'); 
    
    document.getElementById('alert-title').innerText = title;
    msgDiv.innerHTML = msg;
    msgDiv.style.textAlign = ''; 
    
    if(isSuccess) {
        iconDiv.innerHTML = '<i class="fas fa-check-circle"></i>';
        iconDiv.style.color = 'var(--success)';
    } else {
        iconDiv.innerHTML = '<i class="fas fa-times-circle"></i>';
        iconDiv.style.color = 'var(--danger)';
    }

    const btn = modal.querySelector('.btn-action');
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    newBtn.innerText = '我知道了';

    newBtn.onclick = () => {
        closeModal('alert-modal');
        if (callback && typeof callback === 'function') callback();
    };

    modal.style.display = 'flex';
}

export function closeModal(id) { 
    const el = document.getElementById(id);
    if(el) el.style.display='none'; 
}

export function switchTab(targetId, navEl) {
    document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
    document.getElementById(targetId).classList.add('active');
    
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    if(navEl) navEl.classList.add('active');
}

export function switchMainSubView(viewName, el) {
    document.querySelectorAll('.main-subview').forEach(div => {
        div.style.display = 'none';
        div.classList.remove('active');
    });

    const targetId = 'subview-' + viewName;
    const target = document.getElementById(targetId);
    if(target) {
        target.style.display = (viewName === 'official-query') ? 'block' : 'flex';
        target.classList.add('active');
    }

    if (el) {
        document.querySelectorAll('.internal-nav-item').forEach(item => item.classList.remove('active'));
        el.classList.add('active');
    }

    if (viewName === 'official-query') {
        document.body.classList.add('iframe-mode');
    } else {
        document.body.classList.remove('iframe-mode');
    }
}

export function toggleTheme() {
    state.currentTheme = state.currentTheme === 'light' ? 'dark' : 'light';
    document.body.setAttribute('data-theme', state.currentTheme);
    const btnText = document.getElementById('theme-text');
    const btnIcon = document.getElementById('theme-icon');
    
    if (state.currentTheme === 'dark') {
        if(btnText) btnText.innerText = "背景：深色模式";
        if(btnIcon) btnIcon.className = "fas fa-sun";
    } else {
        if(btnText) btnText.innerText = "背景：淺色模式";
        if(btnIcon) btnIcon.className = "fas fa-moon";
    }
    
    UISchedule.renderSchedule();
    UISchedule.updateLegend();
}

export function updateUndoRedoButtons() {
    const undoBtn = document.getElementById('btn-undo');
    const redoBtn = document.getElementById('btn-redo');
    if(!undoBtn || !redoBtn) return;

    const canUndo = state.historyIndex > 0;
    const canRedo = state.historyIndex < state.history.length - 1;

    undoBtn.disabled = !canUndo;
    undoBtn.style.opacity = canUndo ? '1' : '0.5';
    undoBtn.style.cursor = canUndo ? 'pointer' : 'not-allowed';

    redoBtn.disabled = !canRedo;
    redoBtn.style.opacity = canRedo ? '1' : '0.5';
    redoBtn.style.cursor = canRedo ? 'pointer' : 'not-allowed';
}