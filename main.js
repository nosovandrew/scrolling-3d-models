// TODO: scroll runs camera jump to next 3D model

// Common funcs

function waitAfter(func, wait) {
    let waiting = false;
    return function() {
        if (waiting) {
            return;
        }

        func.apply(this, arguments);
        waiting = true;
        setTimeout(() => {
            waiting = false;
        }, wait);
    };
}

// Getting container for 3D

const root = document.querySelector('html'); // html tag
const container = document.querySelector('div.samurais'); // 3d models container

// Creating scene

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({
    alpha: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
container.appendChild(renderer.domElement);

// Add light

const ambient = new THREE.AmbientLight(0x404040);
scene.add(ambient);

const light = new THREE.DirectionalLight(0xffffff, 0.5);
light.position.set(0, 0, 6);
scene.add(light);

// Add cubes (3D models)

const geometry = new THREE.BoxGeometry(1, 1, 1);
const material1 = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
const material2 = new THREE.MeshLambertMaterial({ color: 0x00ffff });
const material3 = new THREE.MeshLambertMaterial({ color: 0xffff00 });
const cube1 = new THREE.Mesh(geometry, material1);
const cube2 = new THREE.Mesh(geometry, material2);
const cube3 = new THREE.Mesh(geometry, material3);

const cubes = [cube1, cube2, cube3];

const objectsDistance = 6;
for (let i = 0; i < cubes.length; i++) {
    cubes[i].position.y = - objectsDistance * i;
}

scene.add(cube1, cube2, cube3);

// Camera

camera.position.z = 3;
camera.position.y = 0;

// Clock

const clock = new THREE.Clock();

// Scrolling related logic

const scrollDownBtn = document.querySelector('.scroll-down'); // go to next model btn
let idx = 0; // model is in scope at the moment
let canScroll = true; // variable for controlling scrolling possibility

// func for disabling scroll/swipe models
const disableScroll = () => {
    canScroll = false;
    root.classList.add('is-disabling-scroll');
}

// func for enabling scroll/swipe models
const enableScroll = () => {
    canScroll = true;
    root.classList.remove('is-disabling-scroll');
}

// check if bound is crossed
const checkBound = (idx) => {
    if (idx > cubes.length - 1) {
        return 1; // upper bound
    } else if (idx < 0) {
        return -1; // lower bound
    } else {
        return false; // not crossed
    }
}

// moving models beyond the crossed bound
const updateBound = () => {
    const bound = checkBound(idx);
    if (!bound) return; // do not move if bound not crossed
    if (bound === 1) {
        // Crossing upper bound
        const movingPart = cubes.splice(0, cubes.length - 1); // get tail
        cubes.splice(1, 0, ...movingPart); // move tail beyond the upper limit
        // upd position for each model in tail
        for (const c of movingPart) {
            gsap.set(c.position, { y: `-=${objectsDistance * cubes.length}` });
        }
        idx = 1; // upd current position idx (now we are on the 2nd model)
    } else {
        // Crossing lower bound
        const movingPart = cubes.splice(1, cubes.length - 1); // get tail
        cubes.splice(0, 0, ...movingPart); // move tail beyond the lower limit
        // upd position for each model in tail
        for (const c of movingPart) {
            gsap.set(c.position, { y: `+=${objectsDistance * cubes.length}` });
        }
        idx = cubes.length - 2; // upd current position idx (now we are on the penultimate model)
    }
}

const shiftModels = (direction, idx) => {
    if (!direction) return; // don't shift if no scroll event

    const prevIdx = idx + direction; // calc prev model in scope (idx +/- 1)

    // upd position of all models
    for (let i = 0; i < cubes.length; i++) {
        gsap.to(cubes[i].position, { y: `${direction > 0 ? '-' : '+'}=${objectsDistance}`, duration: 1 });

        // run animation for prev and current model in scope
        if ([idx, prevIdx].includes(i)) {
            gsap.to(
                cubes[i].rotation,
                {
                    duration: 1,
                    ease: 'Power2.inOut',
                    y: `+=${3.14 * 0.5}`
                }
            );
        }
    }

    // wait for shifting and rotating are complete (1 sec), then allow scrolling
    setTimeout(() => {
        enableScroll();
    }, 1000);
}

const handleScroll = (sd) => {
    if (sd && canScroll) {
        // if scroll direction is not falsy && canScroll is true

        disableScroll(); // disable scrolling models

        idx = sd > 0 ? idx - 1 : idx + 1; // upd idx based on scroll direction
        updateBound(); // move models beyond the bound if this one crossed
        shiftModels(sd, idx); // animated scroll to next model
    }
}

// handle desktop scroll

window.addEventListener('wheel', waitAfter((e) => {
    const s = e.deltaY > 0 ? -1 : 1; // get scroll direction

    handleScroll(s);
}, 1000)); // don't handle event for 1 sec after last fired

// handle mobile scrolling

let ts; // variable for touch start coords

window.addEventListener('touchstart', (e) => {
    ts = e.changedTouches[0].clientY; // get touch start coords
});

window.addEventListener('touchend', (e) => {
    const te = e.changedTouches[0].clientY; // get touch end coords
    const delta = te - ts; // calc delta for detecting direction
    if (delta === 0) {
        return;
    } else if (delta > 0) {
        // Swiping to prev
        handleScroll(1);
    } else {
        // Swiping to next
        handleScroll(-1);
    }
});

// handle click/tap on scroll down btn

scrollDownBtn.addEventListener('click', () => {
    handleScroll(-1); // go to next model
})

// Custom cursor related logic

// rotating a model based on cursor position

const cursor = {}; // cursor coords
cursor.x = 0;
cursor.y = 0;

const constrain = 2250; // limit rotation amplitude

const rotateScene = (cursorX, cursorY) => {
    // get viewport size
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // calc degs for rotation
    const degX = (cursorX - (vw / 2)) / constrain;
    const degY = (cursorY - (vh / 2)) / constrain;

    gsap.to(scene.rotation, {
        // ease: 'Power0.easeIn',
        y: degX,
        x: degY,
    });
}

// custom cursor look

// get necessary html elements
const samuraiArea = document.querySelector('.samurai-area');
const btnArea = document.querySelector('.js-btn');
const customCursor = document.querySelector('.cursor');

const moveCustomCursor = (x, y) => {
    customCursor.style.transform = `translate(${x}px, ${y}px)`;
}

// handle cursor moving

window.addEventListener('mousemove', (e) => {
    cursor.x = e.clientX;
    cursor.y = e.clientY;

    rotateScene(cursor.x, cursor.y);

    moveCustomCursor(cursor.x, cursor.y);
});

// modifying cursor style

// 3d model area
samuraiArea.addEventListener('mouseover', () => {
    root.classList.add('is-hovering-samurai');
})
samuraiArea.addEventListener('mouseout', () => {
    root.classList.remove('is-hovering-samurai');
})

// btn area
btnArea.addEventListener('mouseover', () => {
    root.classList.add('is-hovering-btn');
})
btnArea.addEventListener('mouseout', () => {
    root.classList.remove('is-hovering-btn');
})

// Rendering scene

function animate() {
    requestAnimationFrame(animate);

    // const elapsedTime = clock.getElapsedTime(); // time of viewport in scope

    // // permanent rotation for models
    // gsap.to(cubes[idx].rotation, {
    //     delay: 1,
    //     duration: 4,
    //     x: '+=' + Math.sin(elapsedTime) * 0.2,
    //     y: '+=' + Math.cos(elapsedTime) * 0.2,
    // })
    // cubes[idx].rotation.x = Math.sin(elapsedTime * 0.4) * 0.3;
    // cubes[idx].rotation.y = Math.cos(elapsedTime * 0.4) * 0.3;

    renderer.render(scene, camera);
}
animate();
