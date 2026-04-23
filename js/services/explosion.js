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
        restoreBtn.style.zIndex = '2001';
        restoreBtn.style.pointerEvents = 'auto';
    }

    document.body.style.overflow = 'hidden';
    
    interactionOverlay = document.createElement('div');
    Object.assign(interactionOverlay.style, {
        position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
        zIndex: '1500', 
        cursor: 'grab', 
        background: 'rgba(0,0,0,0)',
        touchAction: 'none'
    });
    document.body.appendChild(interactionOverlay);

    const Engine = Matter.Engine,
          Runner = Matter.Runner,
          Bodies = Matter.Bodies,
          Composite = Matter.Composite,
          Mouse = Matter.Mouse,
          MouseConstraint = Matter.MouseConstraint;

    engine = Engine.create();
    const world = engine.world;

    const targets = [
        ...document.querySelectorAll('.course-card'),       
        ...document.querySelectorAll('.schedule-item'),     
        ...document.querySelectorAll('.control-group'),     
        ...document.querySelectorAll('.sidebar-header'),    
        document.querySelector('.search-hero'),             
        document.querySelector('#course-stats-bar'),        
    ].filter(el => el && el.offsetParent !== null); 

    const width = window.innerWidth;
    const height = window.innerHeight;
    const wallOptions = { isStatic: true, render: { visible: false } };
    
    const ground = Bodies.rectangle(width / 2, height + 150, width * 2, 300, wallOptions);
    const leftWall = Bodies.rectangle(-50, height / 2, 100, height * 4, wallOptions);
    const rightWall = Bodies.rectangle(width + 50, height / 2, 100, height * 4, wallOptions);

    Composite.add(world, [ground, leftWall, rightWall]);

    targets.forEach(el => {
        const rect = el.getBoundingClientRect();
        
        const placeholder = document.createComment('explosion-placeholder');
        if (el.parentNode) {
            el.parentNode.insertBefore(placeholder, el);
        }

        originalData.set(el, {
            cssText: el.style.cssText,
            placeholder: placeholder
        });

        document.body.appendChild(el);

        el.style.position = 'fixed';
        el.style.left = '0px';
        el.style.top = '0px';
        el.style.width = rect.width + 'px';
        el.style.height = rect.height + 'px';
        el.style.zIndex = '1000'; 
        el.style.pointerEvents = 'none'; 
        el.style.margin = '0';
        el.style.transformOrigin = 'center center';
        
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

    const mouse = Mouse.create(interactionOverlay);
    const mouseConstraint = MouseConstraint.create(engine, {
        mouse: mouse,
        constraint: { stiffness: 0.2, render: { visible: false } }
    });
    
    mouse.element.removeEventListener("mousewheel", mouse.mousewheel);
    mouse.element.removeEventListener("DOMMouseScroll", mouse.mousewheel);

    Composite.add(world, mouseConstraint);

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

    if (runner) { Matter.Runner.stop(runner); runner = null; }
    if (engine) { Matter.World.clear(engine.world); Matter.Engine.clear(engine); engine = null; }
    
    if (interactionOverlay) { interactionOverlay.remove(); interactionOverlay = null; }
    document.body.style.overflow = '';

    originalData.forEach((data, el) => {
        el.style.cssText = data.cssText;
        el.style.transform = '';
        
        if (data.placeholder && data.placeholder.parentNode) {
            data.placeholder.parentNode.replaceChild(el, data.placeholder);
        } else {
            el.style.display = 'none';
        }
    });

    originalData.clear();
    isExploding = false;
    document.getElementById('restore-physics-btn').style.display = 'none';
}