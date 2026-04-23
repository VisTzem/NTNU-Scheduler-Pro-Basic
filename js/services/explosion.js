// js/services/explosion.js

let engine, render, runner, composite;
let originalData = new Map(); 
let isExploding = false;
let interactionOverlay = null;

export function triggerExplosion() {
    if (isExploding) return;
    if (typeof Matter === 'undefined') {
        alert('物理引擎尚未載入，請稍後再試或檢查網路連線。');
        return;
    }

    isExploding = true;
    const restoreBtn = document.getElementById('restore-physics-btn');
    if (restoreBtn) {
        restoreBtn.style.display = 'block';
        restoreBtn.style.zIndex = '2001'; // 確保按鈕在最上層
        restoreBtn.style.pointerEvents = 'auto';
    }

    // 1. 鎖定網頁捲動
    document.body.style.overflow = 'hidden';
    
    // 建立透明互動層
    interactionOverlay = document.createElement('div');
    Object.assign(interactionOverlay.style, {
        position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
        zIndex: '1500', 
        cursor: 'grab', 
        background: 'rgba(0,0,0,0)',
        touchAction: 'none'
    });
    document.body.appendChild(interactionOverlay);

    // 2. 初始化物理引擎
    const Engine = Matter.Engine,
          Runner = Matter.Runner,
          Bodies = Matter.Bodies,
          Composite = Matter.Composite,
          Mouse = Matter.Mouse,
          MouseConstraint = Matter.MouseConstraint;

    engine = Engine.create();
    const world = engine.world;

    // 3. 選擇目標
    const targets = [
        ...document.querySelectorAll('.course-card'),       
        ...document.querySelectorAll('.schedule-item'),     
        ...document.querySelectorAll('.control-group'),     
        ...document.querySelectorAll('.sidebar-header'),    
        document.querySelector('.search-hero'),             
        document.querySelector('#course-stats-bar'),        
    ].filter(el => el && el.offsetParent !== null); 

    // 4. 建立邊界
    const width = window.innerWidth;
    const height = window.innerHeight;
    const wallOptions = { isStatic: true, render: { visible: false } };
    
    const ground = Bodies.rectangle(width / 2, height + 150, width * 2, 300, wallOptions);
    const leftWall = Bodies.rectangle(-50, height / 2, 100, height * 4, wallOptions);
    const rightWall = Bodies.rectangle(width + 50, height / 2, 100, height * 4, wallOptions);

    Composite.add(world, [ground, leftWall, rightWall]);

    // 5. 處理每個目標元素
    targets.forEach(el => {
        const rect = el.getBoundingClientRect();
        
        // [修正邏輯] 建立佔位符 (Placeholder)
        // 在元素被移動前，先在其原位置插入一個標記，確保復原時能精準歸位
        const placeholder = document.createComment('explosion-placeholder');
        if (el.parentNode) {
            el.parentNode.insertBefore(placeholder, el);
        }

        // 紀錄原始狀態與佔位符
        originalData.set(el, {
            cssText: el.style.cssText,
            placeholder: placeholder // 儲存佔位符引用
        });

        // 將元素移到 body
        document.body.appendChild(el);

        // 設定物理樣式
        el.style.position = 'fixed';
        el.style.left = '0px';
        el.style.top = '0px';
        el.style.width = rect.width + 'px';
        el.style.height = rect.height + 'px';
        el.style.zIndex = '1000'; 
        el.style.pointerEvents = 'none'; 
        el.style.margin = '0';
        el.style.transformOrigin = 'center center';
        
        // 建立剛體
        const body = Bodies.rectangle(
            rect.left + rect.width / 2, 
            rect.top + rect.height / 2, 
            rect.width, 
            rect.height, 
            { 
                restitution: 0.6, 
                friction: 0.1,
                density: 0.001,
                render: { visible: false }
            }
        );
        body.domElement = el;
        
        const forceMagnitude = 0.02 * body.mass;
        Matter.Body.applyForce(body, body.position, {
            x: (Math.random() - 0.5) * forceMagnitude,
            y: -forceMagnitude 
        });

        Composite.add(world, body);
    });

    // 6. 加入滑鼠控制
    const mouse = Mouse.create(interactionOverlay);
    const mouseConstraint = MouseConstraint.create(engine, {
        mouse: mouse,
        constraint: { stiffness: 0.2, render: { visible: false } }
    });
    
    mouse.element.removeEventListener("mousewheel", mouse.mousewheel);
    mouse.element.removeEventListener("DOMMouseScroll", mouse.mousewheel);

    Composite.add(world, mouseConstraint);

    // 7. 啟動
    runner = Runner.create();
    
    Matter.Events.on(engine, 'afterUpdate', () => {
        const bodies = Composite.allBodies(world);
        bodies.forEach(body => {
            if (body.domElement) {
                const { x, y } = body.position;
                const angle = body.angle;
                body.domElement.style.transform = `translate3d(${x - body.domElement.offsetWidth/2}px, ${y - body.domElement.offsetHeight/2}px, 0) rotate(${angle}rad)`;
            }
        });
    });

    Runner.run(runner, engine);
}

export function restoreExplosion() {
    if (!isExploding) return;

    // 1. 停止物理引擎
    // [重要修正] 使用 Matter.Runner 而非未定義的 Runner
    if (runner) { Matter.Runner.stop(runner); runner = null; }
    if (engine) { Matter.World.clear(engine.world); Matter.Engine.clear(engine); engine = null; }
    
    // 2. 清理介面
    if (interactionOverlay) { interactionOverlay.remove(); interactionOverlay = null; }
    document.body.style.overflow = '';

    // 3. 還原 DOM 位置與樣式
    originalData.forEach((data, el) => {
        // 還原樣式
        el.style.cssText = data.cssText;
        el.style.transform = ''; // 強制清除物理引擎加上的 transform
        
        // [修正邏輯] 使用佔位符進行精確復原
        if (data.placeholder && data.placeholder.parentNode) {
            // 將元素換回佔位符的位置
            data.placeholder.parentNode.replaceChild(el, data.placeholder);
        } else {
            // 備用方案：如果找不到佔位符，至少先隱藏避免擋路
            el.style.display = 'none';
        }
    });

    // 4. 清理狀態
    originalData.clear();
    isExploding = false;
    document.getElementById('restore-physics-btn').style.display = 'none';
}