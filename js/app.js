import { state, addScheduledCourse, removeScheduledCourse, setScheduledCourses, setHoldingCourses, initHistory, undoState, redoState } from './state.js';
import * as Storage from './services/storage.js';
import * as Importer from './services/importer.js';
import * as Exporter from './services/exporter.js';
import * as Explosion from './services/explosion.js';

import * as UICommon from './ui/common.js';
import * as UISchedule from './ui/schedule.js';
import * as UIList from './ui/course-list.js';
import * as UIModal from './ui/modal.js';
import * as UIStats from './ui/stats.js';

let welcomeOpenedManually = false;

window.app = {
    switchTab: UICommon.switchTab,
    switchMainSubView: UICommon.switchMainSubView,
    
    undo: () => {
        const prevState = undoState();
        if (prevState) {
            setScheduledCourses(prevState, false); 
            UISchedule.renderSchedule();
            UIList.renderCourseList(); 
        }
    },
    redo: () => {
        const nextState = redoState();
        if (nextState) {
            setScheduledCourses(nextState, false); 
            UISchedule.renderSchedule();
            UIList.renderCourseList();
        }
    },

    toggleTutorialSection: () => toggleCollapsible('tutorial-content', 'tutorial-arrow'),

    showInstructionModal: UIModal.showInstructionModal,
    openTutorialSelection: UIModal.openTutorialSelection,
    showExcelGuide: UIModal.showExcelGuide,
    openImportModal: UIModal.openImportModal,
    openFileManager: UIModal.openFileManager,
    showClearExcelModal: UIModal.showClearExcelModal,
    showClearModal: UIModal.showClearModal,
    showSurprise: UIModal.showSurprise,
    closeModal: UICommon.closeModal,

    showOtherStats: UIStats.showOtherStats,
    showGenStats: UIStats.showGenStats, 
    
    nextWelcomeSlide: UIModal.nextWelcomeSlide,
    openWelcomeModal: (isManual) => openWelcomeModal(isManual),
    closeWelcome: closeWelcome, 
    openDisclaimerManual: () => openDisclaimerModal(true),
    handleCloseDisclaimer: handleCloseDisclaimer,

    handleFileChange: Importer.handleFileChange,
    triggerExcel: () => { document.getElementById('input-excel').click(); UICommon.closeModal('import-modal'); },
    triggerJson: () => { document.getElementById('input-json').click(); UICommon.closeModal('import-modal'); },
    
    clearFilesBySource: UIModal.clearFilesBySource,
    removeFile: UIModal.removeFile,
    toggleFileSection: UIModal.toggleFileSection,
    
    exportPDF: Exporter.exportPDF,
    exportJSON: Exporter.exportJSON,
    handleOverwriteDecision: Importer.handleOverwriteDecision,
    
    handleDeptChange: () => { UIStats.updateCredits(); UISchedule.renderSchedule(); UISchedule.updateLegend(); },
    resetFilters: () => { 
        document.getElementById('filter-search').value = ''; 
        document.getElementById('filter-dept').value = 'all';
        document.getElementById('filter-day').value = 'all';
        document.getElementById('filter-period').value = 'all';
        document.getElementById('filter-type').value = 'all';
        UIList.renderCourseList(); 
    },
    cycleColorMode: () => { 
        state.colorMode = (state.colorMode + 1) % 3; 
        UISchedule.updateLegend(); 
        UISchedule.renderSchedule(); 
    },
    toggleTheme: UICommon.toggleTheme,
    showDetail: UIModal.showDetail,
    
    confirmAddFromModal: confirmAddFromModal,
    confirmDeleteFromModal: confirmDeleteFromModal,
    executeDeleteSingle: executeDeleteSingle,
    confirmClear: confirmClear,
    
    resolveConflict: resolveConflict,
    cancelPendingConflict: cancelPendingConflict,
    
    handleSidebarDragOver: (e) => { 
        e.preventDefault(); 
        document.getElementById('left-sidebar').classList.add('delete-zone-active'); 
    },
    handleSidebarDragLeave: (e) => { 
        document.getElementById('left-sidebar').classList.remove('delete-zone-active'); 
    },
    handleSidebarDrop: handleSidebarDrop,
    
    toggleHoldingArea: UISchedule.toggleHoldingArea,
    clearHoldingArea: () => {
        if(state.holdingCourses.length === 0) return;
        UICommon.showConfirm('清空暫存區', '確定要移除暫存區的所有課程嗎？', () => {
            setHoldingCourses([]);
            UISchedule.renderHoldingArea();
            UIList.renderCourseList(); 
        });
    },
    addToHoldingFromModal: (id) => {
        const c = state.allCourses.find(x => x.id === id);
        if (!c) return;
        if (!state.holdingCourses.some(h => h.id === id)) {
             setHoldingCourses([...state.holdingCourses, c]);
        }
        if (state.scheduledCourses.some(sc => sc.id === id)) {
            removeScheduledCourse(id);
            UISchedule.renderSchedule();
        }
        UISchedule.renderHoldingArea();
        UIList.renderCourseList(); 
        UICommon.closeModal('detail-modal');
        UICommon.showAlert('成功', '已移動至暫存區');
    },
    removeFromHoldingFromModal: (id) => {
        setHoldingCourses(state.holdingCourses.filter(c => c.id !== id));
        UISchedule.renderHoldingArea();
        UIList.renderCourseList(); 
        UICommon.closeModal('detail-modal');
        UICommon.showAlert('成功', '已從暫存區移除');
    },

    toggleInteractionMode: () => {
        const container = document.getElementById('timetable-container');
        if(container) {
            container.scrollTo({ top: 0, left: 0, behavior: 'auto' }); 
        }
        state.interactionMode = state.interactionMode === 'edit' ? 'view' : 'edit';
        state.pan = { x: 0, y: 0 };
        state.zoomLevel = 1;
        UISchedule.updateInteractionMode();
        UISchedule.updateZoom();
    },

    startTutorial: startTutorial,
    nextStep: nextStep,
    searchReview: searchReview,
    
    confirmAddFromModalById: (id) => {
        const c = state.allCourses.find(x => x.id === id);
        if (c) checkConflictAndAdd(c, 'list');
    },

    toggleFab: () => {
        const fab = document.getElementById('floating-controls');
        if(fab) fab.classList.toggle('active');
    },

    triggerExplosion: Explosion.triggerExplosion,
    restoreExplosion: Explosion.restoreExplosion,
    togglePeriodTime: UISchedule.togglePeriodTime
};

document.addEventListener('DOMContentLoaded', () => {
    UISchedule.initGrid();          
    UIList.initFilter();            
    initListeners();                
    UIList.initLazyLoading();       
    initHistory();                  
    UISchedule.initZoomPan();       
    
    const restored = Storage.loadFromLocalStorage();
    
    UISchedule.updateInteractionMode(); 
    UISchedule.updateZoom(); 
    UISchedule.updateLegend();
    UICommon.updateUndoRedoButtons();
    
    if (restored) {
        UISchedule.renderSchedule();
        UIList.renderCourseList();
        UIStats.updateCredits();
    } else {
        initWelcome();
    }
    
    setInterval(Storage.saveToLocalStorage, 1000);

    window.addEventListener('resize', () => {
        UIList.renderCourseList();
        UISchedule.renderSchedule();
        if(state.currentTutorialStep >= 0) endTutorial(); 
    });
});

document.addEventListener('click', (e) => {
    const fab = document.getElementById('floating-controls');
    const fabMain = document.getElementById('btn-fab-main');
    if(fab && fab.classList.contains('active') && !fab.contains(e.target) && e.target !== fabMain) {
        fab.classList.remove('active');
    }
});

function toggleCollapsible(contentId, arrowId) {
    const content = document.getElementById(contentId);
    const arrow = document.getElementById(arrowId);
    if (!content || !arrow) return;
    const header = arrow.closest('.collapsible-header'); 
    if (content.classList.contains('show')) {
        content.classList.remove('show');
        if(header) header.classList.remove('active');
        arrow.style.transform = 'rotate(0deg)';
    } else {
        content.classList.add('show');
        if(header) header.classList.add('active');
        arrow.style.transform = 'rotate(180deg)';
    }
}

function initListeners() {
    ['filter-dept', 'filter-day', 'filter-period', 'filter-type'].forEach(id => {
        document.getElementById(id).addEventListener('change', UIList.renderCourseList);
    });
    document.getElementById('filter-search').addEventListener('input', UIList.renderCourseList);
    
    document.getElementById('course-list').addEventListener('dragstart', (e) => {
        const card = e.target.closest('.course-card');
        if(card && card.draggable) {
            const id = card.dataset.id;
            if(id) handleDragStart(e, id, 'list');
        }
    });

    document.getElementById('timetable-body').addEventListener('dragstart', (e) => {
        const item = e.target.closest('.schedule-item');
        if(item) {
            const id = item.dataset.id;
            if(id) handleDragStart(e, id, 'grid');
        }
    });

    const holdingArea = document.getElementById('holding-area');
    holdingArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        holdingArea.classList.add('drag-hover-target');
    });
    holdingArea.addEventListener('dragleave', () => {
        holdingArea.classList.remove('drag-hover-target');
    });
    holdingArea.addEventListener('drop', handleHoldingDrop);
    
    holdingArea.addEventListener('dragstart', (e) => {
        const item = e.target.closest('.holding-item');
        if (item) {
            const id = item.dataset.id;
            if (id) handleDragStart(e, id, 'holding');
        }
    });

    document.addEventListener('dragend', (e) => {
        state.draggingCourseId = null;
        UISchedule.clearHints(); 
        document.getElementById('holding-area').classList.remove('drag-hover-target');
        if (e.target.classList.contains('is-dragging')) e.target.classList.remove('is-dragging');
        UIList.renderCourseList(); 
    });
    
    window.onclick = function(e) { 
        if(e.target.classList.contains('modal-overlay') && 
           !['confirm-modal', 'clear-modal', 'overwrite-modal', 'semester-modal', 'clear-excel-modal', 'disclaimer-modal'].includes(e.target.id)) { 
            e.target.style.display='none';
        }
    }
}

function confirmAddFromModal() {
    if(!state.currentDetailId) return;
    const c = state.allCourses.find(x => x.id === state.currentDetailId);
    if(!c) return;
    UICommon.closeModal('detail-modal');
    checkConflictAndAdd(c, 'list');
}

function confirmDeleteFromModal() {
    if(!state.currentDetailId) return;
    const c = state.allCourses.find(x => x.id === state.currentDetailId);
    if(!c) return;
    UICommon.closeModal('detail-modal');
    document.getElementById('delete-course-name').innerText = c.name;
    document.getElementById('delete-single-modal').style.display = 'flex';
}

function executeDeleteSingle() {
    if(state.currentDetailId) {
        removeScheduledCourse(state.currentDetailId);
        UICommon.closeModal('delete-single-modal');
        state.currentDetailId = null;
        UISchedule.renderSchedule();
        UIList.renderCourseList();
    }
}

function confirmClear() {
    setScheduledCourses([]);
    UISchedule.renderSchedule();
    UIList.renderCourseList();
    UICommon.closeModal('clear-modal');
}

function checkConflictAndAdd(course, src = 'list') {
    const conflicts = [];
    course.timeSlots.forEach(ns => {
        const exist = state.scheduledCourses.find(old => old.id !== course.id && old.timeSlots.some(os => os.day === ns.day && os.period === ns.period));
        if(exist && !conflicts.includes(exist)) conflicts.push(exist);
    });

    if (conflicts.length > 0) {
        if (src === 'grid') removeScheduledCourse(course.id);
        
        state.pendingConflictData = { newCourse: course, conflictingIds: conflicts.map(c => c.id), src: src };
        const conflictNames = conflicts.map(c => c.name).join(', ');
        document.getElementById('confirm-msg').innerHTML = `此時段已有課程：<br><b>${conflictNames}</b><br><br>是否確定要覆蓋？`;
        document.getElementById('confirm-modal').style.display = 'flex';
        UISchedule.renderConflictVisuals(); 
    } else {
        if (src === 'grid') removeScheduledCourse(course.id);
        if (state.holdingCourses.some(h => h.id === course.id)) {
             const newHolding = state.holdingCourses.filter(c => c.id !== course.id);
             setHoldingCourses(newHolding);
             UISchedule.renderHoldingArea();
        }
        addScheduledCourse(course);
        UISchedule.renderSchedule();
        UIList.renderCourseList();
    }
}

function resolveConflict(confirmed) {
    document.getElementById('confirm-modal').style.display = 'none';
    const data = state.pendingConflictData;
    state.pendingConflictData = null; 
    if (!data) return;

    if (confirmed) {
        const { newCourse, conflictingIds, src } = data;
        conflictingIds.forEach(id => removeScheduledCourse(id)); 
        if (src === 'grid') removeScheduledCourse(newCourse.id);
        
        if (state.holdingCourses.some(h => h.id === newCourse.id)) {
            const newHolding = state.holdingCourses.filter(c => c.id !== newCourse.id);
            setHoldingCourses(newHolding);
            UISchedule.renderHoldingArea();
        }
        addScheduledCourse(newCourse); 
        UISchedule.renderSchedule();
        UIList.renderCourseList();
    } else {
        UISchedule.renderSchedule(); 
        UIList.renderCourseList();
    }
}

function cancelPendingConflict(e) {
    if (state.pendingConflictData && !e.target.closest('.central-modal')) {
        state.pendingConflictData = null;
        document.getElementById('confirm-modal').style.display = 'none';
        UISchedule.renderSchedule();
        UIList.renderCourseList();
    }
}

function handleDragStart(e, id, src) { 
    if (state.pendingConflictData) {
        state.pendingConflictData = null;
        document.getElementById('confirm-modal').style.display = 'none';
        UISchedule.renderSchedule();
    }

    e.dataTransfer.setData('id', id); 
    e.dataTransfer.setData('src', src);
    state.draggingCourseId = id; 
    
    if (src === 'grid') setTimeout(() => e.target.classList.add('is-dragging'), 0);
    
    const course = state.allCourses.find(c => c.id === id);
    if (course) UISchedule.highlightHints(course);
}

window.handleGridDrop = function(e, cell) {
    e.preventDefault();
    UISchedule.clearHints(); 
    if(!cell) return;

    const id = e.dataTransfer.getData('id');
    const src = e.dataTransfer.getData('src');
    const course = state.allCourses.find(c => c.id === id);
    if(!course) return;

    const day = parseInt(cell.dataset.day), period = cell.dataset.period;
    const isValidSlot = course.timeSlots.some(s => s.day === day && s.period === period);
    
    if(isValidSlot) {
        checkConflictAndAdd(course, src);
    } else {
        cell.classList.add('shake-animation');
        setTimeout(() => cell.classList.remove('shake-animation'), 400);
        if (src === 'grid') UISchedule.renderSchedule(); 
    }
    state.draggingCourseId = null; 
}

function handleHoldingDrop(e) {
    e.preventDefault();
    document.getElementById('holding-area').classList.remove('drag-hover-target');
    UISchedule.clearHints();

    const id = e.dataTransfer.getData('id');
    const src = e.dataTransfer.getData('src');
    const course = state.allCourses.find(c => c.id === id);
    if (!course) return;

    if (state.holdingCourses.some(c => c.id === id)) return;

    const newHolding = [...state.holdingCourses, course];
    setHoldingCourses(newHolding);

    if (src === 'grid') {
        removeScheduledCourse(id);
        UISchedule.renderSchedule();
    }
    
    UISchedule.renderHoldingArea();
    UIList.renderCourseList();
}

function handleSidebarDrop(e) {
    e.preventDefault();
    document.getElementById('left-sidebar').classList.remove('delete-zone-active');
    UISchedule.clearHints();
    
    const src = e.dataTransfer.getData('src');
    const id = e.dataTransfer.getData('id');

    if(src === 'grid') {
        removeScheduledCourse(id);
        UIList.renderCourseList();
        UISchedule.renderSchedule();
    }
    else if (src === 'holding') {
        const newHolding = state.holdingCourses.filter(c => c.id !== id);
        setHoldingCourses(newHolding);
        UISchedule.renderHoldingArea();
        UIList.renderCourseList(); 
    }
}

function startTutorial() {
    state.currentTutorialStep = 0;
    document.getElementById('tutorial-mask').style.display = 'block';
    const timetableNavBtn = document.querySelector('.internal-nav-item[onclick*="timetable"]');
    if (timetableNavBtn) { UICommon.switchMainSubView('timetable', timetableNavBtn); } 
    else { UICommon.switchMainSubView('timetable'); }
    setTimeout(() => { UIModal.showStep(state.currentTutorialStep); }, 100);
}

function nextStep() {
    state.currentTutorialStep++;
    UIModal.showStep(state.currentTutorialStep);
}

function endTutorial() {
    state.currentTutorialStep = -1;
    document.getElementById('tutorial-mask').style.display = 'none';
    UICommon.showAlert('教學完成', '您現在可以開始排課了！');
}

function initWelcome() {
    const hideWelcome = localStorage.getItem('ntnu_scheduler_welcome_hidden');
    const hideDisclaimer = localStorage.getItem('ntnu_scheduler_disclaimer_hidden');
    if (!hideWelcome) { openWelcomeModal(false); } 
    else if (!hideDisclaimer) { setTimeout(() => { openDisclaimerModal(false); }, 300); }
}

function openWelcomeModal(isManual) {
    welcomeOpenedManually = isManual;
    const modal = document.getElementById('welcome-modal');
    const checkboxContainer = document.getElementById('welcome-checkbox-container');
    const checkbox = document.getElementById('welcome-dont-show');
    
    UIModal.resetWelcomeSlide(); 
    if(checkbox) checkbox.checked = false;
    
    if (isManual) { if(checkboxContainer) checkboxContainer.style.display = 'none'; } 
    else { if(checkboxContainer) checkboxContainer.style.display = 'block'; }
    modal.style.display = 'flex';
}

function closeWelcome() {
    const checkbox = document.getElementById('welcome-dont-show');
    const checkboxContainer = document.getElementById('welcome-checkbox-container');
    
    if (checkboxContainer && checkboxContainer.style.display !== 'none' && checkbox && checkbox.checked) {
        localStorage.setItem('ntnu_scheduler_welcome_hidden', 'true');
    }
    UICommon.closeModal('welcome-modal');
    
    if (welcomeOpenedManually) return;
    const hideDisclaimer = localStorage.getItem('ntnu_scheduler_disclaimer_hidden');
    if (!hideDisclaimer) { setTimeout(() => { openDisclaimerModal(false); }, 400); }
}

function openDisclaimerModal(isManual) {
    const modal = document.getElementById('disclaimer-modal');
    const wrapper = document.getElementById('disclaimer-checkbox-wrapper');
    const checkbox = document.getElementById('hide-disclaimer-checkbox');
    if(checkbox) checkbox.checked = false;
    if (wrapper) { wrapper.style.display = isManual ? 'none' : 'flex'; }
    modal.style.display = 'flex';
}

function handleCloseDisclaimer() {
    const checkbox = document.getElementById('hide-disclaimer-checkbox');
    const wrapper = document.getElementById('disclaimer-checkbox-wrapper');
    if (wrapper && wrapper.style.display !== 'none' && checkbox && checkbox.checked) {
        localStorage.setItem('ntnu_scheduler_disclaimer_hidden', 'true');
    }
    UICommon.closeModal('disclaimer-modal');
}

function searchReview() {
    const input = document.getElementById('review-search-input');
    const query = input.value.trim();
    if (!query) { UICommon.showAlert('提示', '請輸入關鍵字', false); return; }
    document.getElementById('review-placeholder').style.display = 'none';
    const platform = document.querySelector('input[name="search-platform"]:checked').value;
    
    const fbArea = document.getElementById('fb-result-area');
    const optArea = document.getElementById('opt-result-area');
    const fbLink = document.getElementById('fb-search-link');
    const fbText = document.getElementById('fb-query-text');
    const optIframe = document.getElementById('opt-iframe');
    const optExtLink = document.getElementById('opt-external-link');

    if (platform === 'facebook') {
        optArea.style.display = 'none'; fbArea.style.display = 'block';
        const url = `https://www.facebook.com/groups/143704482352660/search/?q=${encodeURIComponent(query)}&locale=zh_TW`;
        fbLink.href = url; fbText.innerText = query;
    } else {
        fbArea.style.display = 'none'; optArea.style.display = 'flex'; 
        const jsonParams = JSON.stringify({ keyword: query, type: 0, order: "-modify_time" });
        let base64Params = btoa(encodeURIComponent(jsonParams)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        const url = `https://www.1111opt.com.tw/search-result/${base64Params}`;
        optIframe.src = url; optExtLink.href = url; 
    }
}