// js/ui/schedule.js
import { state } from '../state.js';
import { PERIODS, MODE_NAMES } from '../config.js';
import { getCourseColor, escapeHTML } from '../utils.js';
import * as UIStats from './stats.js';
import * as UICommon from './common.js';
import * as UIModal from './modal.js'; 

/**
 * =========================================================================
 * 課表網格渲染與互動 (Schedule Grid Logic)
 * =========================================================================
 */

/** 初始化網格 DOM */
export function initGrid() {
    const tbody = document.getElementById('timetable-body');
    let html = '';

    // 定義節次與時間的對照表 [根據使用者提供的圖片內容]
    const timeMapping = {
        "0": "07:10<br>~<br>08:00", "1": "08:10<br>~<br>09:00", "2": "09:10<br>~<br>10:00",
        "3": "10:20<br>~<br>11:10", "4": "11:20<br>~<br>12:10", "5": "12:20<br>~<br>13:10",
        "6": "13:20<br>~<br>14:10", "7": "14:20<br>~<br>15:10", "8": "15:30<br>~<br>16:20",
        "9": "16:30<br>~<br>17:20", "10": "17:30<br>~<br>18:20", "A": "18:40<br>~<br>19:30",
        "B": "19:35<br>~<br>20:25", "C": "20:30<br>~<br>21:20", "D": "21:25<br>~<br>22:15"
    };

    PERIODS.forEach(p => {
        const timeStr = timeMapping[p] || "";
        // 根據 state.showPeriodTime 決定是否加上時間文字
        const timeHtml = state.showPeriodTime ? `<div class="period-time">${timeStr}</div>` : '';
        
        html += `<tr>
            <td class="period-col">
                <div class="period-num">${p}</div>
                ${timeHtml}
            </td>`;
        for (let day = 1; day <= 6; day++) {
            html += `<td class="cell-droppable" data-day="${day}" data-period="${p}" 
                      ondragover="event.preventDefault()" 
                      ondrop="handleGridDrop(event, this)"></td>`;
        }
        html += `</tr>`;
    });
    tbody.innerHTML = html;
}

/** 切換時間顯示狀態 */
export function togglePeriodTime() {
    state.showPeriodTime = !state.showPeriodTime;
    initGrid();       // 重新建立網格結構
    renderSchedule(); // 重新填入課程卡片
}

/** 初始化縮放平移事件 (Zoom & Pan) */
export function initZoomPan() {
    const container = document.getElementById('timetable-container');
    
    // --- 電腦版滑鼠事件 ---
    let isDragging = false;
    let startX, startY;

    container.addEventListener('wheel', (e) => {
        if (state.interactionMode !== 'view') return;
        e.preventDefault();
        const zoomSpeed = 0.1;
        if (e.deltaY < 0) {
            state.zoomLevel = Math.min(state.zoomLevel + zoomSpeed, 3);
        } else {
            state.zoomLevel = Math.max(state.zoomLevel - zoomSpeed, 0.5);
        }
        updateZoom();
    });

    container.addEventListener('mousedown', (e) => {
        if (state.interactionMode !== 'view') return;
        isDragging = true;
        startX = e.clientX - state.pan.x;
        startY = e.clientY - state.pan.y;
        container.style.cursor = 'grabbing';
        container.style.overflow = 'hidden';
    });

    window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        e.preventDefault();
        state.pan.x = e.clientX - startX;
        state.pan.y = e.clientY - startY;
        updateZoom();
    });

    window.addEventListener('mouseup', () => {
        isDragging = false;
        if (state.interactionMode === 'view') {
            container.style.cursor = 'grab';
        } else {
            container.style.overflow = 'auto';
            container.style.cursor = 'default';
        }
    });

    // --- 手機版觸控事件 (單指拖曳 + 雙指縮放) ---
    let initialPinchDist = null; 
    let initialZoom = 1;         
    let lastCenter = null;       
    let lastTouchX = null;       
    let lastTouchY = null;       

    container.addEventListener('touchstart', (e) => {
        if (state.interactionMode !== 'view') return;

        if (e.touches.length === 1) {
            lastTouchX = e.touches[0].clientX;
            lastTouchY = e.touches[0].clientY;
        }

        if (e.touches.length === 2) {
            e.preventDefault(); 
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            initialPinchDist = Math.hypot(dx, dy); 
            initialZoom = state.zoomLevel;

            const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
            const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2;
            lastCenter = { x: cx, y: cy };
        }
    }, { passive: false });

    container.addEventListener('touchmove', (e) => {
        if (state.interactionMode !== 'view') return;

        // 單指拖曳
        if (e.touches.length === 1 && lastTouchX !== null) {
            if (e.cancelable) e.preventDefault(); 
            const currX = e.touches[0].clientX;
            const currY = e.touches[0].clientY;
            const dx = currX - lastTouchX;
            const dy = currY - lastTouchY;
            state.pan.x += dx;
            state.pan.y += dy;
            lastTouchX = currX;
            lastTouchY = currY;
            updateZoom();
        }

        // 雙指縮放與移動
        if (e.touches.length === 2 && initialPinchDist && lastCenter) {
            if (e.cancelable) e.preventDefault();
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            const currentDist = Math.hypot(dx, dy);

            if (initialPinchDist > 0) {
                const scale = currentDist / initialPinchDist;
                state.zoomLevel = Math.min(Math.max(initialZoom * scale, 0.5), 3);
            }

            const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
            const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2;
            const moveX = cx - lastCenter.x;
            const moveY = cy - lastCenter.y;

            state.pan.x += moveX;
            state.pan.y += moveY;
            lastCenter = { x: cx, y: cy };
            updateZoom();
        }
    }, { passive: false });

    container.addEventListener('touchend', (e) => {
        if (e.touches.length < 2) {
            initialPinchDist = null;
            lastCenter = null;
        }
        if (e.touches.length === 0) {
            lastTouchX = null;
            lastTouchY = null;
        }
        if (e.touches.length === 1) {
            lastTouchX = e.touches[0].clientX;
            lastTouchY = e.touches[0].clientY;
        }
    });
}

/** 渲染課表 */
export function renderSchedule() {
    document.querySelectorAll('.cell-droppable').forEach(td => { 
        td.innerHTML = ''; 
        td.classList.remove('hint-valid', 'hint-invalid', 'conflict-pending-zone');
    });

    const isMobile = window.innerWidth <= 900;
    const userDept = document.getElementById('user-dept-select').value;
    const isViewMode = state.interactionMode === 'view';

    state.scheduledCourses.forEach(c => {
        const color = getCourseColor(c, userDept);
        const sortedSlots = [...c.timeSlots].sort((a, b) => {
            if (a.day !== b.day) return a.day - b.day;
            return PERIODS.indexOf(a.period) - PERIODS.indexOf(b.period);
        });

        sortedSlots.forEach(slot => {
            const cell = document.querySelector(`td[data-day="${slot.day}"][data-period="${slot.period}"]`);
            if (cell) {
                const div = document.createElement('div');
                div.className = 'schedule-item';
                div.dataset.id = c.id;
                
                if (c.id === state.justAddedCourseId) div.classList.add('pop-in-effect');
                
                div.draggable = !isMobile && !isViewMode;
                
                div.onclick = (e) => { 
                    e.stopPropagation(); 
                    if(window.app && window.app.showDetail) window.app.showDetail(c.id);
                };
                
                let subTitle = c.dept;
                if (userDept !== 'all' && c.dept === userDept) { subTitle = c.type; }

                const currentPIndex = PERIODS.indexOf(slot.period);
                const prevP = currentPIndex > 0 ? PERIODS[currentPIndex - 1] : null;
                const prevSlot = sortedSlots.find(s => s.day === slot.day && s.period === prevP);
                const showLocation = slot.location && (!prevSlot || prevSlot.location !== slot.location);
                
                let contentHtml = `<div style="font-weight:bold; line-height:1.2; margin-bottom:2px;">${escapeHTML(c.name)}</div>`;
                contentHtml += `<div style="font-size:0.75rem; opacity:0.85; font-weight:normal;">${escapeHTML(subTitle || '')}</div>`;
                const locHtml = showLocation ? `<div class="location-badge"><i class="fas fa-map-marker-alt"></i> ${escapeHTML(slot.location)}</div>` : '';
            
                div.innerHTML = contentHtml + locHtml;
                applyStyleToItem(div, color);
                
                if (!isViewMode) { div.style.cursor = 'grab'; }
                
                cell.appendChild(div);
            }
        });
    });

    state.justAddedCourseId = null;
    if (state.pendingConflictData) renderConflictVisuals();
    renderHoldingArea();
    UIStats.updateCredits();
    UICommon.updateUndoRedoButtons();
}

/** 渲染暫存區 */
export function renderHoldingArea() {
    const container = document.getElementById('holding-area');
    if(!container) return;

    if (state.holdingCourses.length === 0) {
        container.innerHTML = '<div class="holding-placeholder">暫存區為空 (將課程拖曳至此)</div>';
        return;
    }

    const isViewMode = state.interactionMode === 'view';

    container.innerHTML = state.holdingCourses.map(c => {
        // [修正] 檢視模式下禁止暫存區拖曳
        const draggable = !isViewMode;
        return `
            <div class="holding-item" draggable="${draggable}" data-id="${c.id}" onclick="app.showDetail('${c.id}')">
                <div style="font-weight:bold; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${escapeHTML(c.name)}</div>
                <div style="font-size:0.75rem; color:var(--text-sub);">${escapeHTML(c.teacher || '')}</div>
                <div style="font-size:0.75rem; color:var(--text-sub);">${escapeHTML(c.rawTime || '')}</div>
            </div>
        `;
    }).join('');
}

/** 切換暫存區收合 */
export function toggleHoldingArea() {
    const content = document.getElementById('holding-content');
    const arrow = document.getElementById('holding-arrow');
    if (!content || !arrow) return;

    if (content.style.display === 'none') {
        content.style.display = 'block';
        arrow.style.transform = 'rotate(0deg)';
    } else {
        content.style.display = 'none';
        arrow.style.transform = 'rotate(-90deg)';
    }
}

/** 更新縮放 UI 狀態 */
export function updateZoom() {
    const wrapper = document.getElementById('timetable-wrapper');
    const container = document.getElementById('timetable-container');
    if (!wrapper || !container) return;
    
    if (state.interactionMode === 'view') {
        container.style.overflow = 'hidden';
        wrapper.style.transformOrigin = 'top left';
        wrapper.style.transform = `translate(${state.pan.x}px, ${state.pan.y}px) scale(${state.zoomLevel})`;
    } else {
        container.style.overflow = 'auto';
        wrapper.style.transform = 'none';
        state.zoomLevel = 1;
        state.pan = { x: 0, y: 0 };
    }
}

/** 更新互動模式 (編輯/檢視) */
export function updateInteractionMode() {
    const btn = document.getElementById('btn-mode-switch');
    const hint = document.getElementById('zoom-hint');
    const isView = state.interactionMode === 'view';

    if (isView) {
        document.body.classList.add('view-mode');
        btn.innerHTML = '<i class="fas fa-edit"></i>'; 
        btn.title = '切換回編輯模式';
        if(hint) {
            hint.innerHTML = '<i class="fas fa-hand-pointer"></i> 檢視模式：可拖曳、縮放 (編輯功能已鎖定)';
            hint.style.display = 'block';
        }
    } else {
        document.body.classList.remove('view-mode');
        btn.innerHTML = '<i class="fas fa-hand-paper"></i>';
        btn.title = '切換至檢視/縮放模式';
        if(hint) hint.style.display = 'none';
        updateZoom();
    }
    renderSchedule();
}

/** 更新圖例 (Legend) */
export function updateLegend() {
    const legend = document.getElementById('legend-bar');
    if(!legend) return;
    legend.classList.add('show');
    
    const currentLabel = MODE_NAMES[state.colorMode];
    const modeBtnText = document.getElementById('mode-text');
    if (modeBtnText) modeBtnText.innerText = `課程：${currentLabel}`;
    
    const types = [
        { label: '必修', color: 'var(--c-required)' }, 
        { label: '選修', color: 'var(--c-elective)' }, 
        { label: '通識', color: 'var(--c-general)' }, 
        { label: '共同', color: 'var(--c-common)' }, 
        { label: '體育', color: 'var(--c-pe)' }, 
        { label: '其他', color: 'var(--c-default)' }
    ];
    
    let itemsHtml = '';
    types.forEach(t => {
        if (state.colorMode === 0) {
            const textColor = (state.currentTheme === 'dark') ? '#e4e6eb' : '#333';
            itemsHtml += `<div class="legend-item" style="color:${textColor};">${t.label}</div>`;
        } else if (state.colorMode === 1) { 
            const textColor = (state.currentTheme === 'dark') ? '#e4e6eb' : '#333';
            itemsHtml += `<div class="legend-item" style="color:${textColor};"><div class="dot" style="background:${t.color};"></div> ${t.label}</div>`;
        } else { 
            itemsHtml += `<div class="legend-item" style="color:${t.color};">${t.label}</div>`;
        }
    });

    legend.innerHTML = `
        <div class="legend-label">${currentLabel}</div>
        <div class="legend-content">${itemsHtml}</div>
    `;
}

/** 渲染衝突視覺效果 */
export function renderConflictVisuals() {
    if (!state.pendingConflictData) return;
    const { newCourse, conflictingIds } = state.pendingConflictData;
    
    state.scheduledCourses.forEach(c => {
        if (conflictingIds.includes(c.id)) {
            document.querySelectorAll(`.schedule-item[data-id="${c.id}"]`).forEach(el => el.classList.add('conflict-old-item'));
        } else {
            document.querySelectorAll(`.schedule-item[data-id="${c.id}"]`).forEach(el => el.classList.add('conflict-old-item-dimmed'));
        }
    });

    newCourse.timeSlots.forEach(slot => {
        const cell = document.querySelector(`td[data-day="${slot.day}"][data-period="${slot.period}"]`);
        if (cell) {
            cell.classList.add('conflict-pending-zone');
            const previewDiv = document.createElement('div');
            previewDiv.className = 'conflict-preview-item';
            previewDiv.innerHTML = `<div style="font-weight:bold; color:#d63031;">${escapeHTML(newCourse.name)}</div>`;
            previewDiv.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
            cell.appendChild(previewDiv);
        }
    });
}

export function highlightHints(course) {
    course.timeSlots.forEach(slot => {
        const cell = document.querySelector(`td[data-day="${slot.day}"][data-period="${slot.period}"]`);
        if(cell) {
            const hasConflict = state.scheduledCourses.some(c => 
                c.id !== course.id && 
                c.timeSlots.some(s => s.day === slot.day && s.period === slot.period)
            );
            cell.classList.add(hasConflict ? 'hint-invalid' : 'hint-valid');
        }
    });
}

export function clearHints() {
    document.querySelectorAll('td').forEach(td => {
        td.classList.remove('hint-valid', 'hint-invalid', 'drag-hover-target', 'shake-animation');
    });
}

function applyStyleToItem(el, color) {
    el.style.backgroundColor = ''; el.style.color = ''; el.style.border = '1px solid transparent';
    
    if (state.colorMode === 0) { // 極簡黑階
        if (state.currentTheme === 'dark') {
            el.style.backgroundColor = '#303031'; 
            el.style.color = '#e4e6eb'; 
            el.style.border = '1px solid #3e4042'; 
        } else {
            el.style.backgroundColor = '#e9ecef'; 
            el.style.color = '#333'; 
            el.style.border = '1px solid #ced4da'; 
        }
    }
    else if (state.colorMode === 1) { // 背景填色
        el.style.backgroundColor = color; 
        el.style.color = 'black'; 
    }
    else if (state.colorMode === 2) { // 字體填色
        el.style.backgroundColor = (state.currentTheme === 'dark') ? '#242526' : 'white'; 
        el.style.color = color; 
        el.style.border = `2px solid ${color}`; 
    }
}