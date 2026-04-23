// js/services/importer.js
import { state, setAllCourses, setScheduledCourses, resetHistory } from '../state.js';
import { parseTime } from '../utils.js'; 

import * as UICommon from '../ui/common.js';
import * as UIList from '../ui/course-list.js';
import * as UISchedule from '../ui/schedule.js';
import * as UIStats from '../ui/stats.js';

const XLSX = window.XLSX;

export function handleFileChange(e, type) {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const inputElement = e.target;

    if (type === 'json') {
        const file = files[0];
        if (state.currentJsonFileId || state.scheduledCourses.length > 0) {
            state.tempJsonFile = file;
            inputElement.value = ''; 
            UICommon.showConfirm(
                '確認覆蓋專案？', 
                `系統偵測到目前已有課程或專案。<br>
                 匯入新專案將<b>「強制清空」</b>目前的排課進度與資料。<br>
                 此動作無法復原，確定要繼續嗎？`,
                () => {
                    setTimeout(() => readJsonFile(file), 50);
                }
            );
            return;
        }
        setTimeout(() => readJsonFile(file), 50);

    } else {
        if (typeof XLSX === 'undefined') {
            UICommon.showAlert('系統錯誤', 'Excel 解析元件尚未載入，請檢查網路。', false);
            return;
        }

        const duplicates = [];
        const errorDetails = []; 
        let processedCount = 0;
        const totalFiles = files.length;
        let successCount = 0;

        setTimeout(() => {
            files.forEach(f => {
                const isDuplicate = state.loadedFiles.some(lf => lf.originalName === f.name && lf.size === f.size);
                
                if (isDuplicate) {
                    duplicates.push(f.name);
                    processedCount++;
                    checkAllDone();
                } else {
                    const r = new FileReader();
                    r.onload = (ev) => {
                        try {
                            const data = new Uint8Array(ev.target.result);
                            let wb;
                            try { wb = XLSX.read(data, { type: 'array' }); } 
                            catch (e1) {
                                const decoder = new TextDecoder('big5');
                                const str = decoder.decode(data);
                                wb = XLSX.read(str, { type: 'string' });
                            }

                            if (!wb || !wb.SheetNames || wb.SheetNames.length === 0) { throw new Error("檔案內容為空或無法識別"); }
                            const jsonData = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
                            if (!validateExcelFormat(jsonData)) { throw new Error("檔案格式不符，請再次確認來源是否正確"); }

                            preProcessExcel(jsonData, f.name, f.size);
                            successCount++;

                        } catch (err) {
                            console.error("Import Failed:", f.name, err);
                            errorDetails.push({ name: f.name, msg: err.message || '未知錯誤' });
                        } finally {
                            processedCount++;
                            checkAllDone();
                        }
                    };
                    r.readAsArrayBuffer(f);
                }
            });
        }, 50);

        function checkAllDone() {
            if (processedCount === totalFiles) {
                let reportMsg = `
                    <div style="text-align: left; padding-left: 10px;">
                        <div style="margin-bottom: 5px;">處理結束！</div>
                        <div style="color: var(--success); font-weight: bold;">✅ 成功：${successCount}</div>
                        <div style="color: var(--warning); font-weight: bold;">⚠️ 重複：${duplicates.length}</div>
                        <div style="color: var(--danger); font-weight: bold;">❌ 失敗：${totalFiles - successCount - duplicates.length}</div>
                `;
                if (duplicates.length > 0) reportMsg += `<br><div style="margin-top:5px; font-size:0.8rem; color:#666;">(重複檔案已略過)</div>`;

                const showFinalResult = () => {
                    UICommon.showAlert('匯入結果', reportMsg, true);
                    const iconDiv = document.getElementById('alert-icon');
                    if (iconDiv) {
                        iconDiv.innerHTML = '<i class="fas fa-clipboard-list"></i>';
                        iconDiv.style.color = 'var(--primary)';
                    }
                };
                
                if (errorDetails.length > 0) {
                    const errorHtml = errorDetails.map(e => 
                        `<div style="margin-bottom:8px;">
                            <b>${_escapeHTML(e.name)}</b><br>
                            <span style="color:var(--danger); font-size:0.9rem;">${_escapeHTML(e.msg)}</span>
                         </div>`
                    ).join('');
                    UICommon.showAlert('匯入發生錯誤', `<div style="text-align:left; max-height:200px; overflow-y:auto;">${errorHtml}</div>`, false, () => { showFinalResult(); });
                } else {
                    setTimeout(showFinalResult, 300);
                }
                inputElement.value = '';
            }
        }
    }
}

function validateExcelFormat(data) {
    if (!data || data.length === 0) return false;
    const row = data[0];
    const hasName = Object.prototype.hasOwnProperty.call(row, '中文課程名稱') || Object.prototype.hasOwnProperty.call(row, 'Course Name');
    const hasTime = Object.prototype.hasOwnProperty.call(row, '地點時間');
    return hasName && hasTime;
}

function preProcessExcel(jsonData, fname, fsize) {
    const tempFid = Date.now().toString(36) + Math.random().toString(36).substr(2);
    processData(jsonData, tempFid, fname, fsize, 'local'); 
}

export function processData(data, fid, fname, fsize, source = 'local') {
    let displayFileName = fname || '未命名檔案';
    if (data && data.length > 0) {
        const rowWithDept = data.find(r => {
            const d = r['系所'] || r['開課系所'];
            return d && d.trim() !== '';
        });
        if (rowWithDept) displayFileName = (rowWithDept['系所'] || rowWithDept['開課系所']);
    }

    const existingSignatures = new Set();
    state.allCourses.forEach(c => {
        const sig = (c.rawRow && c.rawRow['開課序號']) 
            ? 'SN:' + c.rawRow['開課序號'] 
            : `KEY:${c.name}|${c.dept}|${c.teacher}|${c.rawTime}`;
        existingSignatures.add(sig);
    });

    const nc = data.map((r, i) => {
        let rawName = r['中文課程名稱'] || r['Course Name'] || '?';
        let cleanName = rawName;
        let genCategory = null;
        if (rawName.includes('[') && rawName.includes(']')) {
            const match109 = rawName.match(/109起入學[：:]\s*([^；\]]+)/);
            if (match109 && match109[1]) genCategory = match109[1].trim();
            cleanName = rawName.replace(/\s*\[.*?\]/g, '').trim();
        }
        let typeRaw = r['必/選'] || '其他';
        let typeNormalized = typeRaw;
        if (typeRaw === '必') typeNormalized = '必修';
        else if (typeRaw === '選') typeNormalized = '選修';
        else if (typeRaw === '通') typeNormalized = '通識';

        return {
            id: `${fid}_${i}`, fileId: fid, name: cleanName, dept: r['系所'] || r['開課系所'] || '',
            teacher: r['教師'] || r['Instructor'] || '', credits: parseFloat(r['學分'] || 0),
            type: typeNormalized, rawTime: r['地點時間'] || '', rawRow: r, 
            timeSlots: parseTime(r['地點時間'] || ''), genCategory: genCategory 
        };
    }).filter(c => {
        if (c.name === '?') return false;
        const sig = (c.rawRow && c.rawRow['開課序號']) 
            ? 'SN:' + c.rawRow['開課序號'] 
            : `KEY:${c.name}|${c.dept}|${c.teacher}|${c.rawTime}`;
        if (existingSignatures.has(sig)) return false; 
        return true; 
    });

    state.loadedFiles.push({ id: fid, name: displayFileName, originalName: fname, size: fsize, source: source });
    setAllCourses([...state.allCourses, ...nc]);
    state.holdingCourses = state.holdingCourses.filter(h => state.allCourses.some(c => c.id === h.id));

    resetHistory();
    UICommon.updateUndoRedoButtons();
    UIStats.updateDeptOptions();
    UIList.renderCourseList();
}

export function readJsonFile(file) {
    const r = new FileReader();
    r.onload = (ev) => {
        try {
            const content = JSON.parse(ev.target.result);
            processJsonImport(content, file.name);
        } catch (err) {
            console.error(err);
            UICommon.showAlert('匯入失敗', 'JSON 格式錯誤無法讀取', false);
        }
    };
    r.readAsText(file);
}

function processJsonImport(data, fileName) {
    let keptFiles = state.loadedFiles.filter(f => f.source === 'local');
    state.loadedFiles = [];
    setAllCourses([]);
    setScheduledCourses([]);
    state.currentJsonFileId = null;

    let projectFiles = [];
    if (data.sourceFiles && Array.isArray(data.sourceFiles)) {
        projectFiles = data.sourceFiles;
    } else {
        const importedCourses = data.allCourses || [];
        const coursesByDept = {};
        importedCourses.forEach(c => {
            const dept = c.dept || '其他';
            if (!coursesByDept[dept]) coursesByDept[dept] = [];
            coursesByDept[dept].push(c);
        });
        Object.keys(coursesByDept).forEach(dept => {
            const newFid = `restored_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
            projectFiles.push({ id: newFid, name: `還原資料庫 (${dept})`, originalName: "embedded_data", source: 'project', size: 0 });
            coursesByDept[dept].forEach(c => c.fileId = newFid);
        });
    }
    projectFiles.forEach(f => f.source = 'project');

    let mergedCount = 0;
    keptFiles = keptFiles.filter(localF => {
        const isDuplicate = projectFiles.some(projF => 
            projF.originalName === localF.originalName && 
            (projF.size === localF.size || (projF.size === 0 && localF.size === 0))
        );
        if (isDuplicate) { mergedCount++; return false; }
        return true;
    });

    const keptFileIds = keptFiles.map(f => f.id);
    const keptCourses = state.allCourses.filter(c => keptFileIds.includes(c.fileId)); 
    
    state.loadedFiles = [...keptFiles, ...projectFiles];
    const projectCourses = data.allCourses || [];
    setAllCourses([...keptCourses, ...projectCourses]);

    const scheduledIds = data.scheduledIds || [];
    setScheduledCourses(state.allCourses.filter(c => scheduledIds.includes(c.id)));

    state.holdingCourses = state.holdingCourses.filter(h => state.allCourses.some(c => c.id === h.id));

    resetHistory();
    UICommon.updateUndoRedoButtons();

    state.currentProject = {
        name: fileName,
        timestamp: data.timestamp || new Date().toISOString(),
        isUnsaved: false
    };

    if (data.settings && data.settings.userDept) {
        setTimeout(() => {
            const sel = document.getElementById('user-dept-select');
            if(sel) sel.value = data.settings.userDept;
            UIStats.updateCredits();
        }, 100);
    }

    UIStats.updateDeptOptions();
    UIList.renderCourseList();
    UISchedule.renderSchedule();

    let msg = `已載入專案。<br>• 專案連結來源：${projectFiles.length} 個`;
    if (keptFiles.length > 0) msg += `<br>• 保留自行匯入：${keptFiles.length} 個`;
    if (mergedCount > 0) msg += `<br><span style="color:var(--text-sub); font-size:0.85rem;">(已自動整合 ${mergedCount} 個重複的檔案來源)</span>`;
    
    UICommon.showAlert('專案匯入成功', msg);
}

export function handleOverwriteDecision(confirmed) {
    document.getElementById('overwrite-modal').style.display = 'none';
    if (confirmed && state.tempJsonFile) { readJsonFile(state.tempJsonFile); }
    state.tempJsonFile = null;
}

function _escapeHTML(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/[&<>'"]/g, tag => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'}[tag]));
}