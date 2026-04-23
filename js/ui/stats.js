import { state } from '../state.js';
import { escapeHTML } from '../utils.js';

export function updateDeptOptions() {
    const filterSelect = document.getElementById('filter-dept');
    const userSelect = document.getElementById('user-dept-select');
    const currentUserSel = userSelect.value;

    filterSelect.innerHTML = '<option value="all">所有系所</option>';
    userSelect.innerHTML = '<option value="all">請選擇主修 (計算學分用)</option>';
    
    const depts = [...new Set(state.allCourses.map(c => c.dept).filter(d => d))].sort();
    const excludeDepts = ['共同科', '普通體育', '通識', 'AI聯盟', '國防教育', '校際臺大（學）', '校際臺科大（學）'];

    depts.forEach(d => {
        const opt1 = document.createElement('option');
        opt1.value = d; opt1.textContent = d;
        filterSelect.appendChild(opt1);
        
        if (!excludeDepts.includes(d)) {
            const opt2 = document.createElement('option');
            opt2.value = d; opt2.textContent = d;
            userSelect.appendChild(opt2);
        }
    });

    if([...userSelect.options].some(o => o.value === currentUserSel)) {
        userSelect.value = currentUserSel;
    }
}

export function updateCredits() {
    const userDept = document.getElementById('user-dept-select').value;
    let total = 0, req = 0, ele = 0, gen = 0, other = 0, common = 0, pe = 0;
    
    state.scheduledCourses.forEach(c => {
        let val = parseFloat(c.credits) || 0;
        total += val;
        
        if (c.dept && c.dept.includes('體育')) {
            pe += val;
        } else if (c.dept && c.dept.includes('共同')) {
            common += val;
        } else if (c.type.includes('通')) {
            gen += val;
        } else if (userDept !== 'all') {
            if (c.dept === userDept) {
                if (c.type === '必修') req += val;
                else ele += val;
            } else {
                if (c.type === '必修') other += val;
                else other += val;
            }
        } else {
            if (c.type === '必修') req += val;
            else if (c.type === '選修') ele += val;
            else other += val;
        }
    });

    animateValue('total-credits', total);
    animateValue('stat-req', req);
    animateValue('stat-ele', ele);
    animateValue('stat-gen', gen);
    animateValue('stat-common', common);
    animateValue('stat-pe', pe);
    animateValue('stat-other', other);
}

function animateValue(id, end) {
    const obj = document.getElementById(id);
    if (!obj) return;
    const start = parseFloat(obj.innerText);
    if (start === end) return;
    
    obj.innerText = end.toFixed(1);
    obj.style.opacity = 0.5;
    setTimeout(() => obj.style.opacity = 1, 200);
}

export function showGenStats() {
    const list = state.scheduledCourses.filter(c => c.type.includes('通'));
    let html = '';
    if (list.length === 0) {
        html = '<div style="text-align:center; color:#999;">無通識課程</div>';
    } else {
        html = '<ul class="stats-list">';
        list.forEach(c => {
            html += `<li class="stats-row">
                <span class="stats-dept">${escapeHTML(c.name)}</span>
                <span class="stats-credit">${c.credits}</span>
            </li>`;
        });
        html += '</ul>';
    }
    document.getElementById('stats-detail-list').innerHTML = html;
    document.querySelector('#stats-modal h3').innerText = '通識學分分佈';
    document.getElementById('stats-modal').style.display = 'flex';
}

export function showOtherStats() {
    const userDept = document.getElementById('user-dept-select').value;
    const list = state.scheduledCourses.filter(c => {
        if (userDept !== 'all') {
            return c.dept !== userDept && !c.dept.includes('共同') && !c.dept.includes('體育') && !c.type.includes('通');
        } else {
            return !['必修', '選修'].includes(c.type) && !c.type.includes('通');
        }
    });

    let html = '';
    if (list.length === 0) {
        html = '<div style="text-align:center; color:#999;">無外系/其他課程</div>';
    } else {
        html = '<ul class="stats-list">';
        list.forEach(c => {
            html += `<li class="stats-row">
                <span class="stats-dept">${escapeHTML(c.name)} (${escapeHTML(c.dept)})</span>
                <span class="stats-credit">${c.credits}</span>
            </li>`;
        });
        html += '</ul>';
    }
    document.getElementById('stats-detail-list').innerHTML = html;
    document.querySelector('#stats-modal h3').innerText = '外系/其他學分';
    document.getElementById('stats-modal').style.display = 'flex';
}