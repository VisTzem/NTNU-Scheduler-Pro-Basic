export const state = {
    allCourses: [],            
    scheduledCourses: [],      
    filteredCoursesGlobal: [], 
    loadedFiles: [],           
    holdingCourses: [],        

    history: [],               
    historyIndex: -1,          
    
    colorMode: 0,              
    currentTheme: 'light',     
    renderedCount: 0,          
    draggingCourseId: null,    
    currentDetailId: null,     
    currentTutorialStep: -1,   
    interactionMode: 'edit',   
    zoomLevel: 1,              
    pan: { x: 0, y: 0 },       
    isLocalDirty: false,       

    pendingConflictData: null, 
    justAddedCourseId: null,   
    
    tempJsonFile: null,        
    currentProject: {
        name: null,       
        timestamp: null,  
        isUnsaved: true   
    },

    showPeriodTime: true, 
};

const MAX_HISTORY = 25; 

function deepCopy(obj) {
    return JSON.parse(JSON.stringify(obj));
}

export function initHistory() {
    state.history = [[]]; 
    state.historyIndex = 0;
}

export function pushHistory() {
    const currentSnapshot = deepCopy(state.scheduledCourses);
    if (state.historyIndex < state.history.length - 1) {
        state.history = state.history.slice(0, state.historyIndex + 1);
    }
    state.history.push(currentSnapshot);
    state.historyIndex++;
    if (state.history.length > MAX_HISTORY + 1) {
        state.history.shift();
        state.historyIndex--;
    }
    state.isLocalDirty = true;
}

export function undoState() {
    if (state.historyIndex > 0) {
        state.historyIndex--;
        state.isLocalDirty = true; 
        return deepCopy(state.history[state.historyIndex]);
    }
    return null;
}

export function redoState() {
    if (state.historyIndex < state.history.length - 1) {
        state.historyIndex++;
        state.isLocalDirty = true; 
        return deepCopy(state.history[state.historyIndex]);
    }
    return null;
}

export function resetHistory() {
    state.history = [deepCopy(state.scheduledCourses)];
    state.historyIndex = 0;
    state.isLocalDirty = true;
}

export function setAllCourses(courses) { 
    state.allCourses = courses; 
    state.isLocalDirty = true;
}

export function setScheduledCourses(courses, recordHistory = true) { 
    state.scheduledCourses = courses;
    if (recordHistory) pushHistory();
    state.isLocalDirty = true;
}

export function addScheduledCourse(course) { 
    if(!state.scheduledCourses.some(sc => sc.id === course.id)) {
        state.scheduledCourses.push(course);
        state.justAddedCourseId = course.id; 
        pushHistory(); 
    }
}

export function removeScheduledCourse(id) { 
    state.scheduledCourses = state.scheduledCourses.filter(c => c.id !== id); 
    pushHistory(); 
}

export function setHoldingCourses(courses) {
    state.holdingCourses = courses;
    state.isLocalDirty = true;
}