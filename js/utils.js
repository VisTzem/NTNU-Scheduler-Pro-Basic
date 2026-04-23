// js/utils.js

import { PERIODS, COLORS } from './config.js';

/**
 * =========================================================================
 * 時間與格式解析工具 (Time & Format Parsers)
 * 處理原始字串轉換為結構化資料的邏輯
 * =========================================================================
 */

/**
 * 解析時間字串 (Time Parser)
 * 將原始課程時間字串轉換為可供渲染的陣列物件
 * * @param {string} s - 原始時間字串 (例如: "一 3-4 (教室A), 三 5")
 * @returns {Array<{day: number, period: string, location: string}>} 解析後的節次陣列
 * * 支援格式：
 * - 中文/英文星期: "一", "MON" -> 1
 * - 單節/範圍節次: "3", "3-4", "10-A"
 * - 自動提取地點: "一 3-4 普通101" -> location: "普通101"
 */
export function parseTime(s) {
    const slots = []; 
    
    // 星期映射表 (包含中文簡寫與英文縮寫)
    const map = { 
        "一": 1, "二": 2, "三": 3, "四": 4, "五": 5, "六": 6, 
        "MON": 1, "TUE": 2, "WED": 3, "THU": 4, "FRI": 5, "SAT": 6 
    };

    if (!s) return [];

    // 1. 依逗號分割多個時段 (處理 "一 3-4, 三 5" 的情況)
    s.split(/[,，]/).map(str => str.trim()).forEach(p => {
        
        /**
         * Regex 解析說明：
         * Group 1: 星期 ([一二...MON...])
         * Group 2: 節次範圍 ([0-9A-D] 或 [0-9A-D]-[0-9A-D])
         * Group 3: 地點 (剩餘的所有字串)
         */
        const m = p.match(/^([一二三四五六MONTUEWEDTHUFRISAT]+)\s*([0-9A-D]+(?:-[0-9A-D]+)?)\s*(.*)/i);
        
        if (m) {
            const day = map[m[1].toUpperCase()] || map[m[1]];
            let ps = [m[2]]; // 預設為單節次

            // 2. 處理節次範圍 (例如 "3-5" 轉為 ["3", "4", "5"])
            if (m[2].includes('-')) {
                const [st, en] = m[2].split('-');
                const sI = PERIODS.indexOf(st);
                const eI = PERIODS.indexOf(en);
                
                // 只有當開始與結束節次都在合法範圍內才展開
                if (sI !== -1 && eI !== -1) {
                    ps = PERIODS.slice(sI, eI + 1);
                }
            }

            // 3. 展開為個別的 slot 物件
            ps.forEach(x => slots.push({ 
                day, 
                period: x, 
                location: m[3] // 可能為空字串
            }));
        }
    });

    return slots;
}

/**
 * 解析學期標籤 (Semester Tag Formatter)
 * 將系統代碼轉換為易讀的中文格式
 * * @param {string} tag - 學期代碼 (例如: "112-1")
 * @returns {string} 格式化後的字串 (例如: "112學年 第1學期")
 */
export function parseSemText(tag) {
    if (!tag) return '未知';
    const parts = tag.split('-');
    if (parts.length === 2) return `${parts[0]}學年 第${parts[1]}學期`;
    return tag; // 若不符合格式則回傳原字串
}


/**
 * =========================================================================
 * 顯示邏輯與安全性 (Display Logic & Security)
 * =========================================================================
 */

/**
 * 取得課程對應顏色 (Color Logic)
 * 根據課程類型與使用者系所，決定顯示顏色
 * * 優先級順序：
 * 1. 特殊類別 (體育、共同、通識) - 固定顏色
 * 2. 使用者本系課程 (必修/選修) - 高亮顏色
 * 3. 外系課程/其他 - 預設顏色
 * * @param {Object} c - 課程物件 (需包含 dept, type 屬性)
 * @param {string} userDept - 使用者設定的主修系所 (用於判斷是否為本系)
 * @returns {string} 對應的 CSS var 色碼
 */
export function getCourseColor(c, userDept) {
    // Level 1: 全校性特殊課程 (優先權最高)
    if (c.dept && c.dept.includes('體育')) return COLORS.pe;
    if (c.dept && c.dept.includes('共同')) return COLORS.common;
    if (c.type.includes('通')) return COLORS.general;

    // Level 2: 根據使用者系所判斷
    if (userDept === 'all') {
        // 若未設定系所，僅區分必選修
        if (c.type.includes('必')) return COLORS.required;
        if (c.type.includes('選')) return COLORS.elective;
        return COLORS.default;
    } else {
        // 若為本系課程
        if (c.dept === userDept) {
            if (c.type.includes('必')) return COLORS.required;
            if (c.type.includes('選')) return COLORS.elective;
        }
        // 外系或無法辨識
        return COLORS.default;
    }
}

/**
 * HTML 轉義防禦 (XSS Sanitizer)
 * 將特殊字元轉換為 HTML Entity，防止惡意腳本注入
 * 用於渲染使用者輸入或外部來源字串之前
 * * @param {string} str - 原始字串
 * @returns {string} 安全的 HTML 字串
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