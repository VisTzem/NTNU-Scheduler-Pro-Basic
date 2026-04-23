// js/config.js

/**
 * =========================================================================
 * 系統核心設定 (System Core Config)
 * 包含列表渲染效能、節次定義等全域常數
 * =========================================================================
 */

/**
 * 列表渲染的批次處理數量
 * 用於分批載入課程列表以優化效能，避免一次渲染過多 DOM 導致卡頓
 */
export const BATCH_SIZE = 50;

/**
 * 課表顯示模式名稱列表
 * 對應 UI 上的色彩模式切換功能
 */
export const MODE_NAMES = ["極簡黑階", "背景填色", "字體填色"];

/**
 * 節次代碼定義
 * 包含標準節次 (0-10) 與特殊節次 (A, B, C, D 午休或晚間時段)
 */
export const PERIODS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "A", "B", "C", "D"];


/**
 * =========================================================================
 * 課程屬性色彩對照 (Color Mapping)
 * 將程式邏輯中的課程類別映射至 CSS 變數
 * =========================================================================
 */
export const COLORS = {
    required: 'var(--c-required)', // 必修
    elective: 'var(--c-elective)', // 選修
    general:  'var(--c-general)',  // 通識
    common:   'var(--c-common)',   // 一般/共同
    pe:       'var(--c-pe)',       // 體育
    default:  'var(--c-default)'   // 預設/其他
};


/**
 * =========================================================================
 * 新手教學導覽設定 (Tutorial Configuration)
 * 定義導覽步驟、目標元素、說明文字及手機版對應行為
 * =========================================================================
 * @property {string} target    - CSS 選擇器，指定要高亮的目標元素
 * @property {string} title     - 導覽視窗的標題
 * @property {string} desc      - 導覽視窗的說明內容 (支援 \n 換行)
 * @property {string} mobileTab - 手機版需切換到的分頁 ID (確保元素可見)
 */
export const TUTORIAL_STEPS = [
    // 步驟 1: 左側課程庫介紹
    { 
        target: '#left-sidebar', 
        title: '課程庫 (左側欄)', 
        desc: '這裡是所有課程的清單。\n您可以點擊「匯入」載入 Excel 課表，並使用上方的篩選器來尋找課程。\n拖曳課程到中間的課表即可排課\n(僅電腦版適用)。\n也可點擊課程檢視資訊、加入課表。', 
        mobileTab: 'left-sidebar' 
    },

    // 步驟 2: 中央課表主畫面
    { 
        target: '#main-content-wrapper', 
        title: '課表主畫面', 
        desc: '您排入的課程會顯示在這裡。\n點擊課程可以看到詳細資訊或刪除課程。', 
        mobileTab: 'main-area' 
    },

    // 步驟 3: 底部功能導覽列
    { 
        target: '#main-internal-nav', 
        title: '切換功能頁籤', 
        desc: '此欄位固定於畫面底部，方便隨時切換：\n・「課表」檢視狀況\n・「評價」搜尋心得\n・「找課」查詢學校系統、下載匯入此系統的Excel課程資訊。', 
        mobileTab: 'main-area' 
    },

    // 步驟 4: 復原與重做功能 [新增功能]
    { 
        target: '#floating-controls', 
        title: '↩️ 復原與重做', 
        desc: '排錯了不用怕！\n使用左下角的懸浮按鈕，\n隨時可以回到上一步或下一步。', 
        mobileTab: 'main-area' 
    },

    // 步驟 5: 雲端同步功能 [新增功能]
    { 
        target: '#cloud-control-group', 
        title: '☁️ 雲端同步 (新功能)', 
        desc: '登入 Google 帳號，\n將課表進度儲存在雲端！\n無論是手機、電腦都能隨時同步存取，\n再也不怕資料遺失。', 
        mobileTab: 'right-sidebar' 
    },

    // 步驟 6: 學分統計與系所設定
    { 
        target: '#stats-dept-wrapper', 
        title: '設定與統計', 
        desc: '設定主修系所，系統會自動計算各類學分。\n(包含必修、選修、通識等...)\n下方色塊可點擊查看外系詳細學分。', 
        mobileTab: 'right-sidebar' 
    },

    // 步驟 7: 排課工具箱 (匯出/備份/色彩)
    { 
        target: '#action-control-group', 
        title: '🛠️ 排課工具箱', 
        desc: '在此可以切換色彩模式、\n將課表匯出成 PDF 圖片，\n或是下載 JSON 專案檔進行備份。', 
        mobileTab: 'right-sidebar' 
    }
];