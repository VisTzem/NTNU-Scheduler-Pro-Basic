// js/utils.js

import { PERIODS, COLORS } from './config.js';


/**
 * @param {string} s
 * @returns {Array<{day: number, period: string, location: string}>}
 */
export function parseTime(s) {
    const slots = []; 
    
    const map = { 
        "一": 1, "二": 2, "三": 3, "四": 4, "五": 5, "六": 6, 
        "MON": 1, "TUE": 2, "WED": 3, "THU": 4, "FRI": 5, "SAT": 6 
    };

    if (!s) return [];

    s.split(/[,，]/).map(str => str.trim()).forEach(p => {
        const m = p.match(/^([一二三四五六MONTUEWEDTHUFRISAT]+)\s*([0-9A-D]+(?:-[0-9A-D]+)?)\s*(.*)/i);
        
        if (m) {
            const day = map[m[1].toUpperCase()] || map[m[1]];
            let ps = [m[2]];

            if (m[2].includes('-')) {
                const [st, en] = m[2].split('-');
                const sI = PERIODS.indexOf(st);
                const eI = PERIODS.indexOf(en);
                
                if (sI !== -1 && eI !== -1) {
                    ps = PERIODS.slice(sI, eI + 1);
                }
            }

            ps.forEach(x => slots.push({ 
                day, 
                period: x, 
                location: m[3]
            }));
        }
    });

    return slots;
}

/**
 * @param {string} tag
 * @returns {string}
 */
export function parseSemText(tag) {
    if (!tag) return '未知';
    const parts = tag.split('-');
    if (parts.length === 2) return `${parts[0]}學年 第${parts[1]}學期`;
    return tag;
}



/**
 * @param {Object} c
 * @param {string} userDept
 * @returns {string}
 */
export function getCourseColor(c, userDept) {
    if (c.dept && c.dept.includes('體育')) return COLORS.pe;
    if (c.dept && c.dept.includes('共同')) return COLORS.common;
    if (c.type.includes('通')) return COLORS.general;

    if (userDept === 'all') {
        if (c.type.includes('必')) return COLORS.required;
        if (c.type.includes('選')) return COLORS.elective;
        return COLORS.default;
    } else {
        if (c.dept === userDept) {
            if (c.type.includes('必')) return COLORS.required;
            if (c.type.includes('選')) return COLORS.elective;
        }
        return COLORS.default;
    }
}

/**
 * @param {string} str
 * @returns {string}
 */
export function escapeHTML(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag]));
}