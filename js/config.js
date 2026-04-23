export const BATCH_SIZE = 50;

export const MODE_NAMES = ["極簡黑階", "背景填色", "字體填色"];

export const PERIODS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "A", "B", "C", "D"];

export const COLORS = {
    required: 'var(--c-required)',
    elective: 'var(--c-elective)',
    general:  'var(--c-general)',
    common:   'var(--c-common)',
    pe:       'var(--c-pe)',
    default:  'var(--c-default)'
};


/**
 * @property {string} target
 * @property {string} title
 * @property {string} desc
 * @property {string} mobileTab
 */
export const TUTORIAL_STEPS = [
    { 
        target: '#left-sidebar', 
        title: '課程庫 (左側欄)', 
        desc: '這裡是所有課程的清單。\n您可以點擊「匯入」載入 Excel 課表，並使用上方的篩選器來尋找課程。\n拖曳課程到中間的課表即可排課\n(僅電腦版適用)。\n也可點擊課程檢視資訊、加入課表。', 
        mobileTab: 'left-sidebar' 
    },

    { 
        target: '#main-content-wrapper', 
        title: '課表主畫面', 
        desc: '您排入的課程會顯示在這裡。\n點擊課程可以看到詳細資訊或刪除課程。', 
        mobileTab: 'main-area' 
    },

    { 
        target: '#main-internal-nav', 
        title: '切換功能頁籤', 
        desc: '此欄位固定於畫面底部，方便隨時切換：\n・「課表」檢視狀況\n・「評價」搜尋心得\n・「找課」查詢學校系統、下載匯入此系統的Excel課程資訊。', 
        mobileTab: 'main-area' 
    },

    { 
        target: '#floating-controls', 
        title: '↩️ 復原與重做', 
        desc: '排錯了不用怕！\n使用左下角的懸浮按鈕，\n隨時可以回到上一步或下一步。', 
        mobileTab: 'main-area' 
    },

    { 
        target: '#cloud-control-group', 
        title: '☁️ 雲端同步 (新功能)', 
        desc: '登入 Google 帳號，\n將課表進度儲存在雲端！\n無論是手機、電腦都能隨時同步存取，\n再也不怕資料遺失。', 
        mobileTab: 'right-sidebar' 
    },

    { 
        target: '#stats-dept-wrapper', 
        title: '設定與統計', 
        desc: '設定主修系所，系統會自動計算各類學分。\n(包含必修、選修、通識等...)\n下方色塊可點擊查看外系詳細學分。', 
        mobileTab: 'right-sidebar' 
    },

    { 
        target: '#action-control-group', 
        title: '🛠️ 排課工具箱', 
        desc: '在此可以切換色彩模式、\n將課表匯出成 PDF 圖片，\n或是下載 JSON 專案檔進行備份。', 
        mobileTab: 'right-sidebar' 
    }
];