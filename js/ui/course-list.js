import { state } from '../state.js';
import { PERIODS, BATCH_SIZE } from '../config.js';
import { escapeHTML } from '../utils.js';

export function initFilter() {
    const select = document.getElementById('filter-period');
    PERIODS.forEach(p => {
        const option = document.createElement('option');
        option.value = p; option.textContent = `第 ${p} 節`;
        select.appendChild(option);
    });
}

export function initLazyLoading() {
    const desktopContainer = document.getElementById('course-list'); 
    const mobileContainer = document.getElementById('left-sidebar'); 
    const handleScroll = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        if (scrollTop + clientHeight >= scrollHeight - 100) { renderNextBatch(); }
    };
    if(desktopContainer) desktopContainer.addEventListener('scroll', handleScroll);
    if(mobileContainer) mobileContainer.addEventListener('scroll', handleScroll);
}

export function renderCourseList() {
    const list = document.getElementById('course-list');
    
    if (state.allCourses.length === 0) {
        document.getElementById('total-courses-count').innerText = '顯示 0 堂課';
        list.innerHTML = '<div style="text-align:center; color:#999; margin-top:30px;">請匯入檔案</div>';
        return;
    }

    const filterDept = document.getElementById('filter-dept').value;
    const filterDay = document.getElementById('filter-day').value;
    const filterType = document.getElementById('filter-type').value;
    const filterPeriod = document.getElementById('filter-period').value;
    const searchText = document.getElementById('filter-search').value.trim().toLowerCase();

    let filtered = state.allCourses.filter(c => {
        if (searchText) {
            const nameMatch = (c.name || '').toLowerCase().includes(searchText);
            const teacherMatch = (c.teacher || '').toLowerCase().includes(searchText);
            if (!nameMatch && !teacherMatch) return false;
        }
        if (filterDept !== 'all' && c.dept !== filterDept) return false;
        if (filterType !== 'all' && !c.type.includes(filterType)) return false;
        
        if (filterDay !== 'all' || filterPeriod !== 'all') {
            const targetDay = filterDay === 'all' ? null : parseInt(filterDay);
            const hasMatch = c.timeSlots.some(s => {
                const matchDay = (targetDay === null) || (s.day === targetDay);
                const matchPeriod = (filterPeriod === 'all') || (s.period === filterPeriod);
                return matchDay && matchPeriod;
            });
            if (!hasMatch) return false;
        }
        return true;
    });

    filtered.sort((a, b) => {
        const deptCompare = (a.dept || '').localeCompare(b.dept || '');
        if (deptCompare !== 0) return deptCompare;
        const dayA = a.timeSlots[0]?.day || 99;
        const dayB = b.timeSlots[0]?.day || 99;
        if (dayA !== dayB) return dayA - dayB;
        const pA = a.timeSlots[0]?.period || '0';
        const pB = b.timeSlots[0]?.period || '0';
        return PERIODS.indexOf(pA) - PERIODS.indexOf(pB);
    });

    state.filteredCoursesGlobal = filtered;
    state.renderedCount = 0;
    document.getElementById('total-courses-count').innerText = `篩選結果：共 ${filtered.length} 堂`;

    list.innerHTML = '';
    if (filtered.length === 0) {
        list.innerHTML = `<div style="text-align:center; color:#999; margin-top:30px;">無符合條件的課程</div>`; 
        return; 
    }
    
    list.scrollTop = 0;
    const sidebar = document.getElementById('left-sidebar');
    if(sidebar) sidebar.scrollTop = 0;

    renderNextBatch();
}

export function renderNextBatch() {
    if (state.renderedCount >= state.filteredCoursesGlobal.length) return;

    const list = document.getElementById('course-list');
    const isMobile = window.innerWidth <= 900;
    const nextBatch = state.filteredCoursesGlobal.slice(state.renderedCount, state.renderedCount + BATCH_SIZE);
    
    const html = nextBatch.map(c => {
        const isScheduled = state.scheduledCourses.some(sc => sc.id === c.id);
        const isHolding = state.holdingCourses.some(hc => hc.id === c.id);
        
        const classStr = (isScheduled || isHolding) ? 'course-card is-scheduled' : 'course-card';
        
        const isViewMode = state.interactionMode === 'view';
        const draggable = (isScheduled || isHolding || isMobile || isViewMode) ? 'false' : 'true';
        
        let statusHtml = '';
        if (isScheduled) {
            statusHtml = `<div style="margin-top:4px; font-size:0.75rem; color:var(--primary); font-weight:bold;"><i class="fas fa-check"></i> 已排課</div>`;
        } else if (isHolding) {
            statusHtml = `<div style="margin-top:4px; font-size:0.75rem; color:var(--warning); font-weight:bold;"><i class="fas fa-inbox"></i> 在暫存區</div>`;
        }

        return `<div class="${classStr}" draggable="${draggable}" 
                 data-id="${c.id}"
                 onclick="app.showDetail('${c.id}')">
            <div style="font-weight:bold; color:var(--text-main);">${escapeHTML(c.name)}</div>
            <div class="card-info-row">
                <span>${escapeHTML(c.dept)}</span>
                ${c.teacher ? `<span>• ${escapeHTML(c.teacher)}</span>` : ''}
                <span style="background:#eee; padding:2px 6px; border-radius:4px; margin-left:auto;">${escapeHTML(c.type)}</span>
            </div>
            <div style="font-size:0.75rem; color:var(--text-sub); margin-top:4px;">${escapeHTML(c.rawTime)}</div>
            ${statusHtml}
        </div>`;
    }).join('');

    list.insertAdjacentHTML('beforeend', html);
    state.renderedCount += nextBatch.length;
}