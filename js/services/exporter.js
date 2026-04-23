import { state } from '../state.js';
import { escapeHTML } from '../utils.js';
import * as UICommon from '../ui/common.js';

export function exportJSON() {
    if (state.scheduledCourses.length === 0) {
        UICommon.showConfirm(
            '確認匯出',
            '您的課表目前沒有任何課程，匯出的專案檔將不包含排課資料。<br>是否仍要繼續？',
            () => { _performExportJSON(); }
        );
        return;
    }
    _performExportJSON();
}

function _performExportJSON() {
    const data = {
        version: 2, 
        timestamp: new Date().toISOString(),
        sourceFiles: state.loadedFiles,
        allCourses: state.allCourses,
        scheduledIds: state.scheduledCourses.map(c => c.id),
        settings: {
            userDept: document.getElementById('user-dept-select').value,
        }
    };

    const fileName = `ntnu_project_${new Date().toISOString().slice(0,10)}.json`;
    const b = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const a = document.createElement('a'); 
    a.href = URL.createObjectURL(b); 
    a.download = fileName; 
    a.click();
    
    if (state.currentProject) {
        state.currentProject.name = fileName;
        state.currentProject.timestamp = new Date().toISOString();
        state.currentProject.isUnsaved = false;
    }
}

export function exportPDF() {
    if (state.scheduledCourses.length === 0) {
        UICommon.showConfirm(
            '確認匯出',
            '您的課表目前沒有任何課程，匯出的 PDF 將會是空白的。<br>是否仍要繼續？',
            () => { _performExportPDF(); }
        );
        return;
    }
    _performExportPDF();
}

async function _performExportPDF() {
    const btnExport = document.querySelector('.btn-export'); 
    const originalBtnText = btnExport ? btnExport.innerHTML : '';
    if(btnExport) btnExport.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 處理中...';

    const container = document.createElement('div');
    container.style.position = 'fixed'; 
    container.style.top = '0'; 
    container.style.left = '-10000px'; 
    container.style.width = '1100px'; 
    container.style.background = 'white'; 
    container.style.padding = '40px';
    container.style.zIndex = '-9999'; 
    container.style.color = '#000'; 
    container.style.fontFamily = "'Segoe UI', 'Microsoft JhengHei', sans-serif";
    
    document.body.appendChild(container);

    const title = document.createElement('h1');
    title.innerText = '我的課表 (NTNU Schedule)';
    title.style.textAlign = 'center';
    title.style.marginBottom = '15px';
    title.style.color = '#333';
    container.appendChild(title);

    const ids = ['stat-req', 'stat-ele', 'stat-gen', 'stat-common', 'stat-pe', 'stat-other', 'total-credits'];
    const labels = ['必修', '選修', '通識', '共同', '體育', '外系', '總學分'];
    let statsHtml = '';
    
    ids.forEach((id, idx) => {
        const el = document.getElementById(id);
        const val = el ? el.innerText : '0.0';
        statsHtml += `<span style="color:#000;"><b>${labels[idx]}:</b> ${val}</span>`;
    });

    const statsRow = document.createElement('div');
    statsRow.style.display = 'flex';
    statsRow.style.justifyContent = 'center';
    statsRow.style.gap = '20px';
    statsRow.style.marginBottom = '20px';
    statsRow.style.padding = '10px';
    statsRow.style.background = '#f0f2f5';
    statsRow.style.borderRadius = '8px';
    statsRow.style.border = '1px solid #ddd';
    statsRow.innerHTML = statsHtml;
    container.appendChild(statsRow);

    const timetableOriginal = document.getElementById('timetable-wrapper');
    const timetableClone = timetableOriginal.cloneNode(true);
    
    timetableClone.style.boxShadow = 'none';
    timetableClone.style.overflow = 'visible';
    timetableClone.style.height = 'auto';
    timetableClone.style.maxHeight = 'none';
    timetableClone.style.width = '100%';
    timetableClone.style.borderRadius = '0';
    timetableClone.style.border = 'none'; 
    timetableClone.style.background = 'white';
    timetableClone.style.transform = 'none';

    const headers = timetableClone.querySelectorAll('th');
    headers.forEach(th => {
        th.style.position = 'static'; 
        th.style.top = 'auto';
        th.style.border = '1px solid #999'; 
        th.style.background = '#f0f0f0';
        th.style.color = '#000';
    });

    const cells = timetableClone.querySelectorAll('td');
    cells.forEach(td => {
        td.style.border = '1px solid #999';
        td.style.height = '85px';        
        td.style.maxHeight = '85px';     
        td.style.width = '85px';       
        td.style.padding = '0';          
        td.style.verticalAlign = 'middle'; 
        td.style.overflow = 'hidden';    
        td.style.boxSizing = 'border-box';
        td.style.backgroundColor = 'transparent'; 
        
        if (td.classList.contains('period-col')) {
            td.style.backgroundColor = '#f8f9fa';
            td.style.color = '#6c757d';
        }
    });
    
    const items = timetableClone.querySelectorAll('.schedule-item');
    items.forEach(item => {
        item.style.position = 'relative'; 
        item.style.display = 'flex';
        item.style.flexDirection = 'column';
        item.style.justifyContent = 'center';
        item.style.alignItems = 'center';
        item.style.width = '100%';
        item.style.height = '100%';
        item.style.margin = '0 auto';     
        item.style.padding = '2px'; 
        item.style.boxSizing = 'border-box';
        item.style.border = 'none';
        item.style.borderRadius = '0';
        item.style.boxShadow = 'none';
        item.style.zIndex = '10';     
        
        if(window.getComputedStyle(item).backgroundColor === 'rgb(48, 48, 49)' || item.style.backgroundColor === '') {
             item.style.backgroundColor = 'white';
        }

        const children = item.children;
        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            child.style.color = '#000000'; 
            child.style.display = 'block'; 
            child.style.textAlign = 'center';
            child.style.width = '100%';
            child.style.margin = '0';
            child.style.padding = '0';
            child.style.visibility = 'visible';

            if (i === 0) {
                child.style.fontSize = '15px'; 
                child.style.fontWeight = 'bold';
                child.style.lineHeight = '1.1';   
                child.style.marginBottom = '2px'; 
                child.style.whiteSpace = 'normal'; 
                child.style.wordBreak = 'break-all'; 
                child.style.overflow = 'hidden';
                child.style.maxHeight = '42px';
            } else {
                child.style.fontSize = '13px';    
                child.style.lineHeight = '1.1';   
                child.style.whiteSpace = 'nowrap';
                child.style.overflow = 'hidden';
                child.style.textOverflow = 'ellipsis';
            }
        }
    });

    container.appendChild(timetableClone);

    const listTitle = document.createElement('h3');
    listTitle.innerText = '課程詳細列表';
    listTitle.style.marginTop = '30px';
    listTitle.style.borderBottom = '2px solid #333';
    listTitle.style.paddingBottom = '10px';
    container.appendChild(listTitle);

    const table = document.createElement('table');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    table.style.marginTop = '15px';
    table.style.fontSize = '12px';
    table.style.pageBreakInside = 'auto';

    const thead = `
        <tr style="background:#eee; color:#000;">
            <th style="border:1px solid #999; padding:6px; text-align:left;">課程名稱</th>
            <th style="border:1px solid #999; padding:6px; text-align:left;">系所</th>
            <th style="border:1px solid #999; padding:6px; text-align:left;">教師</th>
            <th style="border:1px solid #999; padding:6px; text-align:left;">時間/地點</th>
            <th style="border:1px solid #999; padding:6px; text-align:center;">學分</th>
            <th style="border:1px solid #999; padding:6px; text-align:center;">類別</th>
        </tr>`;
    
    const PERIODS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "A", "B", "C", "D"];
    const sortedCourses = [...state.scheduledCourses].sort((a, b) => {
        const sA = a.timeSlots[0] || {day:9, period:'0'};
        const sB = b.timeSlots[0] || {day:9, period:'0'};
        if(sA.day !== sB.day) return sA.day - sB.day;
        return PERIODS.indexOf(sA.period) - PERIODS.indexOf(sB.period);
    });

    const rows = sortedCourses.map(c => `
        <tr style="page-break-inside: avoid;"> 
            <td style="border:1px solid #ccc; padding:6px; font-weight:bold; color:#000;">${escapeHTML(c.name)}</td>
            <td style="border:1px solid #ccc; padding:6px; color:#000;">${escapeHTML(c.dept)}</td>
            <td style="border:1px solid #ccc; padding:6px; color:#000;">${escapeHTML(c.teacher || '-')}</td>
            <td style="border:1px solid #ccc; padding:6px; color:#000;">${escapeHTML(c.rawTime)}</td>
            <td style="border:1px solid #ccc; padding:6px; text-align:center; color:#000;">${escapeHTML(String(c.credits))}</td>
            <td style="border:1px solid #ccc; padding:6px; text-align:center; color:#000;">${c.type}</td>
        </tr>
    `).join('');

    table.innerHTML = `<thead>${thead}</thead><tbody>${rows}</tbody>`;
    container.appendChild(table);
    
    const footer = document.createElement('div');
    footer.innerHTML = 'Layout design: <strong>VisTzem</strong>';
    footer.style.textAlign = 'right';
    footer.style.marginTop = '20px';
    footer.style.fontSize = '10px';
    footer.style.color = '#555';
    container.appendChild(footer);

    await new Promise(resolve => setTimeout(resolve, 100));

    const canvas = await window.html2canvas(container, { 
        scale: 2, 
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false
    });
    
    const imgData = canvas.toDataURL('image/jpeg', 1.0);
    const pdf = new window.jspdf.jsPDF('p', 'mm', 'a4'); 
    const imgWidth = 210; 
    const pageHeight = 297; 
    
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight; 
    let position = 0; 

    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
        position -= pageHeight; 
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
    }

    pdf.save('NTNU_Schedule_Full.pdf');
    document.body.removeChild(container); 

    if(btnExport) {
        btnExport.innerHTML = originalBtnText;
    }
}