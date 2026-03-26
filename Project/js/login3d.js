/* ================================================================
   ThiranMitra — login3d.js  (v7 — Cinematic Transformation Story)
   "Unemployed → Skilled → Interview Ready → Employed"
   Style: Soft cinematic lighting, realistic silhouette, warm sunrise
   No neon/gaming aesthetics. Human. Inspiring. National portal feel.
   ================================================================ */

'use strict';

(function () {

    /* ── Floating keyword overlay (CSS-based, zero GPU cost) ──────── */
    function injectFloatingKeywords() {
        const panel = document.getElementById('animPanel');
        if (!panel) return;

        const words = [
            { text: 'Skill', x: 8, y: 28, delay: 0 },
            { text: 'Opportunity', x: 72, y: 18, delay: 1.4 },
            { text: 'Confidence', x: 15, y: 62, delay: 2.8 },
            { text: 'Placement', x: 65, y: 55, delay: 0.7 },
            { text: 'Growth', x: 40, y: 78, delay: 2.1 },
            { text: 'Employment', x: 5, y: 45, delay: 3.5 },
            { text: 'Future', x: 78, y: 38, delay: 1.0 },
            { text: 'Training', x: 50, y: 12, delay: 4.2 },
        ];

        const style = document.createElement('style');
        style.textContent = `
            .wm-float-word {
                position: absolute;
                font-family: 'Inter', sans-serif;
                font-size: 0.68rem;
                font-weight: 600;
                letter-spacing: 0.12em;
                text-transform: uppercase;
                color: rgba(255,255,255,0.07);
                pointer-events: none;
                user-select: none;
                animation: wmWordFloat 14s ease-in-out infinite;
                z-index: 2;
            }
            @keyframes wmWordFloat {
                0%, 100% { opacity: 0.05; transform: translateY(0px); }
                25%       { opacity: 0.18; transform: translateY(-6px); }
                50%       { opacity: 0.10; transform: translateY(-12px); }
                75%       { opacity: 0.22; transform: translateY(-6px); }
            }
            /* Scene subtitle card */
            #wmSceneCard {
                position: absolute;
                left: 50%;
                top: 50%;
                transform: translate(-50%, -50%);
                text-align: center;
                z-index: 8;
                pointer-events: none;
                transition: opacity 0.8s ease;
            }
            #wmSceneTitle {
                font-family: 'Orbitron', sans-serif;
                font-size: 0.72rem;
                font-weight: 600;
                letter-spacing: 0.18em;
                color: rgba(255,255,255,0.45);
                text-transform: uppercase;
                margin-bottom: 0.4rem;
                display: block;
            }
            #wmSceneDesc {
                font-family: 'Inter', sans-serif;
                font-size: 0.62rem;
                font-weight: 400;
                letter-spacing: 0.08em;
                color: rgba(255,255,255,0.22);
                text-transform: uppercase;
                display: block;
            }
            /* Sunrise horizon overlay */
            #wmHorizon {
                position: absolute;
                bottom: 0; left: 0; right: 0;
                height: 35%;
                pointer-events: none;
                z-index: 3;
                transition: opacity 2s ease;
                opacity: 0;
                background: linear-gradient(to top,
                    rgba(255, 140, 30, 0.0) 0%,
                    transparent 100%);
            }
            /* Light ray bursting from centre */
            #wmLightRay {
                position: absolute;
                top: 0; left: 0; right: 0; bottom: 0;
                pointer-events: none;
                z-index: 4;
                opacity: 0;
                transition: opacity 2s ease;
                background: radial-gradient(ellipse 45% 60% at 50% 58%,
                    rgba(255, 200, 80, 0.12) 0%,
                    rgba(255, 140, 0, 0.04) 40%,
                    transparent 70%);
            }
            /* Office building silhouette */
            #wmBuilding {
                position: absolute;
                bottom: 8%;
                left: 0; right: 0;
                display: flex;
                align-items: flex-end;
                justify-content: center;
                gap: 3px;
                z-index: 5;
                pointer-events: none;
                opacity: 0;
                transition: opacity 2.5s ease;
            }
            .wm-bld-block {
                background: rgba(255,255,255,0.055);
                border-top: 1px solid rgba(255,255,255,0.06);
            }
            /* Resume paper scatter */
            .wm-paper {
                position: absolute;
                width: 28px; height: 20px;
                background: rgba(255,255,255,0.06);
                border: 1px solid rgba(255,255,255,0.08);
                border-radius: 2px;
                pointer-events: none;
                z-index: 6;
                transition: opacity 1.2s ease, transform 1.5s ease;
            }
            /* Digital resume (glow version) */
            #wmDigiResume {
                position: absolute;
                width: 50px; height: 65px;
                border-radius: 4px;
                background: rgba(79, 70, 229, 0.10);
                border: 1px solid rgba(99, 102, 241, 0.35);
                box-shadow: 0 0 24px rgba(99, 102, 241, 0.25), 0 0 60px rgba(99, 102, 241, 0.08);
                left: 50%; top: 58%;
                transform: translate(-50%, -50%) scale(0.4);
                opacity: 0;
                z-index: 7;
                pointer-events: none;
                transition: opacity 1.5s ease, transform 1.5s cubic-bezier(0.34,1.56,0.64,1);
            }
            #wmDigiResume::after {
                content: '';
                position: absolute;
                inset: 6px;
                border-top: 1.5px solid rgba(99,102,241,0.5);
                border-bottom: 1.5px solid rgba(99,102,241,0.5);
            }
            #wmDigiResume::before {
                content: '';
                position: absolute;
                top: 50%; left: 50%;
                transform: translate(-50%,-50%);
                width: 60%; height: 1.5px;
                background: rgba(99,102,241,0.6);
                box-shadow: 0 8px 0 rgba(99,102,241,0.4), 0 16px 0 rgba(99,102,241,0.3);
            }
        `;
        document.head.appendChild(style);

        words.forEach(w => {
            const el = document.createElement('span');
            el.className = 'wm-float-word';
            el.textContent = w.text;
            el.style.left = w.x + '%';
            el.style.top = w.y + '%';
            el.style.animationDelay = w.delay + 's';
            panel.appendChild(el);
        });

        // Scene card
        const card = document.createElement('div');
        card.id = 'wmSceneCard';
        card.innerHTML = `<span id="wmSceneTitle">Scene 1</span><span id="wmSceneDesc">The journey begins</span>`;
        panel.appendChild(card);

        // Horizon glow
        const horizon = document.createElement('div');
        horizon.id = 'wmHorizon';
        panel.appendChild(horizon);

        // Light ray
        const ray = document.createElement('div');
        ray.id = 'wmLightRay';
        panel.appendChild(ray);

        // Office building silhouette
        const bldg = document.createElement('div');
        bldg.id = 'wmBuilding';
        const bldgData = [
            [22, 55], [16, 78], [28, 95], [20, 62], [14, 42],
            [24, 110], [18, 80], [12, 38], [26, 88], [20, 65],
            [22, 55], [16, 78]
        ];
        bldgData.forEach(([w, h]) => {
            const b = document.createElement('div');
            b.className = 'wm-bld-block';
            b.style.width = w + 'px';
            b.style.height = h + 'px';
            bldg.appendChild(b);
        });
        panel.appendChild(bldg);

        // Paper scatter (scene 1)
        const paperPositions = [
            { left: '35%', top: '70%', rot: '-12deg' },
            { left: '42%', top: '73%', rot: '6deg' },
            { left: '55%', top: '68%', rot: '-4deg' },
            { left: '48%', top: '75%', rot: '20deg' },
        ];
        paperPositions.forEach((pos, i) => {
            const p = document.createElement('div');
            p.className = 'wm-paper';
            p.id = 'wmPaper' + i;
            p.style.left = pos.left;
            p.style.top = pos.top;
            p.style.transform = `rotate(${pos.rot})`;
            p.style.opacity = '0.7';
            panel.appendChild(p);
        });

        // Digital resume
        const dr = document.createElement('div');
        dr.id = 'wmDigiResume';
        panel.appendChild(dr);
    }

    /* ── Main Three.js Scene ──────────────────────────────────────── */
    function initScene() {
        try {
            const canvas = document.getElementById('bgCanvas');
            if (!canvas || typeof THREE === 'undefined') return;

            const panel = document.getElementById('animPanel');

            function getPanelSize() {
                if (panel && panel.offsetWidth > 0) {
                    return { w: panel.offsetWidth, h: panel.offsetHeight };
                }
                return { w: Math.max(300, window.innerWidth - 480), h: window.innerHeight };
            }

            const { w: initW, h: initH } = getPanelSize();

            /* ── Renderer ────────────────────────────────── */
            const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
            renderer.setSize(initW, initH);
            renderer.setClearColor(0x060c1a, 1);

            const scene = new THREE.Scene();
            const camera = new THREE.PerspectiveCamera(58, initW / initH, 0.1, 300);
            camera.position.set(0, 2.5, 18);
            camera.lookAt(0, 3, 0);

            let clock = 0;

            /* ── Phase system (12 seconds total cycle) ───── */
            // Phase 0: Unemployed (0–3s)  — grey-blue, slumped
            // Phase 1: Transformation    (3–6s)  — resume glows, stands
            // Phase 2: Interview Ready   (6–9s)  — upright, confident
            // Phase 3: Employed          (9–12s) — sunrise, building, laptop
            const CYCLE = 13; // seconds
            const phaseTimes = [0, 3.2, 6.5, 9.8]; // phase start seconds
            let currentPhase = 0;

            const PHASE_LABELS = ['UNEMPLOYED', 'SKILLED CANDIDATE', 'INTERVIEW READY', '\u2713 EMPLOYED \u2713'];
            const PHASE_COLORS = ['#a0aec0', '#f6ad55', '#818cf8', '#68d391'];
            const PHASE_DESCS = [
                'Searching for direction',
                'Building skills with ThiranMitra',
                'Interview-ready professional',
                'Gainfully employed \u2014 dream achieved'
            ];

            /* ── Background — cinematic gradient shader ────────── */
            const bgGeo = new THREE.PlaneGeometry(300, 200);
            const bgMat = new THREE.ShaderMaterial({
                uniforms: {
                    uTime: { value: 0 },
                    uPhase: { value: 0.0 },  // 0=grey 1=warm
                    uSunrise: { value: 0.0 }
                },
                vertexShader: `
                    varying vec2 vUv;
                    void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }
                `,
                fragmentShader: `
                    uniform float uTime;
                    uniform float uPhase;
                    uniform float uSunrise;
                    varying vec2 vUv;

                    void main(){
                        vec2 c = vUv - 0.5;
                        float d = length(c);

                        /* Base: muted blue-grey at phase 0, deep navy at phase 3 */
                        vec3 coldTop = vec3(0.04, 0.06, 0.12);
                        vec3 coldBot = vec3(0.02, 0.03, 0.06);
                        vec3 warmTop = vec3(0.04, 0.08, 0.16);
                        vec3 warmBot = vec3(0.06, 0.04, 0.02);

                        vec3 top = mix(coldTop, warmTop, uPhase);
                        vec3 bot = mix(coldBot, warmBot, uPhase);

                        float yFac = vUv.y;
                        vec3 col = mix(bot, top, yFac);

                        /* Sunrise glow from bottom centre */
                        float sunY = 1.0 - smoothstep(0.0, 0.55, vUv.y);
                        float sunX = 1.0 - smoothstep(0.0, 0.35, abs(vUv.x - 0.5));
                        vec3 sunColor = vec3(1.0, 0.60, 0.15);
                        col += sunColor * uSunrise * sunY * sunX * 0.45;

                        /* Faint grid — only in first half of cycle */
                        float gridAlpha = max(0.0, 1.0 - uPhase * 2.0);
                        float gx = step(0.985, fract(vUv.x * 22.0));
                        float gy = step(0.985, fract(vUv.y * 18.0));
                        col += (gx + gy) * 0.008 * gridAlpha * vec3(0.4, 0.5, 0.9);

                        /* Soft vignette */
                        col *= (1.0 - smoothstep(0.35, 0.75, d) * 0.5);

                        gl_FragColor = vec4(col, 1.0);
                    }
                `,
                depthWrite: false
            });
            const bgMesh = new THREE.Mesh(bgGeo, bgMat);
            bgMesh.position.z = -30;
            scene.add(bgMesh);

            /* ── Lighting ─────────────────────────────────────────── */
            // Ambient — cool, muted start
            const ambient = new THREE.AmbientLight(0xc8d4e8, 0.55);
            scene.add(ambient);

            // Key light — cool blue-grey
            const keyLight = new THREE.DirectionalLight(0xb0c4de, 1.2);
            keyLight.position.set(-4, 10, 8);
            scene.add(keyLight);

            // Fill — subtle warm for later phases
            const fillLight = new THREE.PointLight(0xffd4a0, 0, 50);
            fillLight.position.set(5, 4, 6);
            scene.add(fillLight);

            // Rim — subtle backlight
            const rimLight = new THREE.DirectionalLight(0x8899cc, 0.4);
            rimLight.position.set(6, 3, -5);
            scene.add(rimLight);

            /* ── Ground plane (simple dark surface) ──────────────── */
            const groundGeo = new THREE.PlaneGeometry(60, 40);
            const groundMat = new THREE.MeshLambertMaterial({
                color: 0x05090f,
                transparent: true,
                opacity: 0.8
            });
            const ground = new THREE.Mesh(groundGeo, groundMat);
            ground.rotation.x = -Math.PI / 2;
            ground.position.y = -2.3;
            scene.add(ground);

            // Soft grid on ground (very subtle)
            const gridHelper = new THREE.GridHelper(36, 20, 0x1a2440, 0x0d1520);
            gridHelper.position.y = -2.28;
            gridHelper.material.transparent = true;
            gridHelper.material.opacity = 0.35;
            scene.add(gridHelper);

            /* ── Human silhouette figure ──────────────────────────── */
            function makeMat(col, emissiveCol, emissInt) {
                return new THREE.MeshPhongMaterial({
                    color: col,
                    emissive: emissiveCol || col,
                    emissiveIntensity: emissInt || 0.15,
                    shininess: 20,
                    transparent: true,
                    opacity: 0.92
                });
            }

            const figGroup = new THREE.Group();
            figGroup.position.set(0, -1.8, 0);
            scene.add(figGroup);

            // BODY COLOR tracks phase — starts muted, ends warm
            const bodyColor = new THREE.Color(0x4a5568); // muted grey-blue

            // Head
            const head = new THREE.Mesh(
                new THREE.SphereGeometry(0.6, 22, 22),
                makeMat(bodyColor.clone(), new THREE.Color(0x2d3748), 0.2)
            );
            head.position.y = 4.3;
            figGroup.add(head);

            // Neck
            const neck = new THREE.Mesh(
                new THREE.CylinderGeometry(0.18, 0.22, 0.4, 12),
                makeMat(bodyColor.clone())
            );
            neck.position.y = 3.65;
            figGroup.add(neck);

            // Torso
            const torso = new THREE.Mesh(
                new THREE.CylinderGeometry(0.5, 0.42, 2.0, 16),
                makeMat(bodyColor.clone())
            );
            torso.position.y = 2.6;
            figGroup.add(torso);

            // Shoulders span
            const shoulderBar = new THREE.Mesh(
                new THREE.CylinderGeometry(0.15, 0.15, 1.3, 10),
                makeMat(bodyColor.clone())
            );
            shoulderBar.rotation.z = Math.PI / 2;
            shoulderBar.position.y = 3.55;
            figGroup.add(shoulderBar);

            // Left arm
            const lArm = new THREE.Mesh(
                new THREE.CylinderGeometry(0.17, 0.13, 1.6, 12),
                makeMat(bodyColor.clone())
            );
            lArm.position.set(-1.0, 2.7, 0);
            lArm.rotation.z = Math.PI / 4; // drooped
            figGroup.add(lArm);

            // Right arm
            const rArm = new THREE.Mesh(
                new THREE.CylinderGeometry(0.17, 0.13, 1.6, 12),
                makeMat(bodyColor.clone())
            );
            rArm.position.set(1.0, 2.7, 0);
            rArm.rotation.z = -Math.PI / 4; // drooped
            figGroup.add(rArm);

            // Left leg
            const lLeg = new THREE.Mesh(
                new THREE.CylinderGeometry(0.2, 0.16, 2.0, 12),
                makeMat(bodyColor.clone())
            );
            lLeg.position.set(-0.38, 0.5, 0);
            figGroup.add(lLeg);

            // Right leg
            const rLeg = new THREE.Mesh(
                new THREE.CylinderGeometry(0.2, 0.16, 2.0, 12),
                makeMat(bodyColor.clone())
            );
            rLeg.position.set(0.38, 0.5, 0);
            figGroup.add(rLeg);

            // Laptop prop (visible in phases 2 & 3)
            const laptopGroup = new THREE.Group();
            laptopGroup.position.set(0.5, 3.0, 0.5);
            laptopGroup.scale.set(0, 0, 0);
            figGroup.add(laptopGroup);

            const laptopBase = new THREE.Mesh(
                new THREE.BoxGeometry(0.9, 0.05, 0.65),
                new THREE.MeshPhongMaterial({ color: 0x2d3748, shininess: 80 })
            );
            laptopGroup.add(laptopBase);

            const laptopScreen = new THREE.Mesh(
                new THREE.BoxGeometry(0.85, 0.58, 0.04),
                new THREE.MeshPhongMaterial({
                    color: 0x1a365d,
                    emissive: 0x2b6cb0,
                    emissiveIntensity: 0.4
                })
            );
            laptopScreen.position.set(0, 0.32, -0.3);
            laptopScreen.rotation.x = -Math.PI / 9;
            laptopGroup.add(laptopScreen);

            const allFigMeshes = [head, neck, torso, shoulderBar, lArm, rArm, lLeg, rLeg];

            // Soft shadow circle under figure
            const shadowGeo = new THREE.CircleGeometry(1.2, 32);
            const shadowMat = new THREE.MeshBasicMaterial({
                color: 0x000000,
                transparent: true,
                opacity: 0.35
            });
            const shadowCircle = new THREE.Mesh(shadowGeo, shadowMat);
            shadowCircle.rotation.x = -Math.PI / 2;
            shadowCircle.position.set(0, -2.28, 0);
            scene.add(shadowCircle);

            /* ── Soft aura glow around figure ─────────────────────── */
            const auraMat = new THREE.MeshBasicMaterial({
                color: 0x718096,
                transparent: true,
                opacity: 0.06,
                blending: THREE.AdditiveBlending,
                side: THREE.BackSide
            });
            const auraGlow = new THREE.Mesh(new THREE.SphereGeometry(3.5, 16, 16), auraMat);
            auraGlow.position.y = 2.6;
            figGroup.add(auraGlow);

            /* ── Very subtle ambient particles (motes, not neon) ──── */
            const NPART = 300;
            const pData = new Float32Array(NPART * 3);
            const pSpeed = new Float32Array(NPART);
            for (let i = 0; i < NPART; i++) {
                pData[i * 3] = (Math.random() - 0.5) * 30;
                pData[i * 3 + 1] = (Math.random() - 0.5) * 22;
                pData[i * 3 + 2] = (Math.random() - 0.5) * 8 - 2;
                pSpeed[i] = 0.004 + Math.random() * 0.005;
            }
            const pGeo = new THREE.BufferGeometry();
            pGeo.setAttribute('position', new THREE.BufferAttribute(pData, 3));
            const pMat = new THREE.PointsMaterial({
                color: 0xaabbcc,
                size: 0.06,
                transparent: true,
                opacity: 0.25,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            });
            scene.add(new THREE.Points(pGeo, pMat));

            /* ── DOM refs ─────────────────────────────────────────── */
            const stageEl = document.getElementById('stageLabel');
            const stageTrack = document.getElementById('stageTrack');
            const sceneTitle = document.getElementById('wmSceneTitle');
            const sceneDesc = document.getElementById('wmSceneDesc');
            const horizonEl = document.getElementById('wmHorizon');
            const rayEl = document.getElementById('wmLightRay');
            const buildingEl = document.getElementById('wmBuilding');
            const digiResume = document.getElementById('wmDigiResume');
            const papers = [0, 1, 2, 3].map(i => document.getElementById('wmPaper' + i));

            /* ── Update stage label + track ───────────────────────── */
            function updatePhaseDOM(phase) {
                if (stageEl) {
                    stageEl.textContent = PHASE_LABELS[phase];
                    stageEl.style.color = PHASE_COLORS[phase];
                    stageEl.style.textShadow = `0 0 20px ${PHASE_COLORS[phase]}55`;
                }
                if (stageTrack) {
                    stageTrack.querySelectorAll('.stage-dot').forEach((dot, i) => {
                        dot.classList.toggle('active', i === phase);
                        dot.classList.toggle('done', i < phase);
                    });
                }
                if (sceneTitle) sceneTitle.textContent = `Phase ${phase + 1}`;
                if (sceneDesc) sceneDesc.textContent = PHASE_DESCS[phase];
            }

            /* ── Smoothly update figure body color ────────────────── */
            const targetBodyColor = new THREE.Color(0x4a5568);
            function setTargetColor(hex) {
                targetBodyColor.set(hex);
            }

            /* ── Animation loop ───────────────────────────────────── */
            const mouse = { x: 0, y: 0 };

            function animate() {
                requestAnimationFrame(animate);
                clock += 0.016;

                const cycleT = clock % CYCLE;

                // Determine phase
                let phase = 0;
                if (cycleT >= phaseTimes[3]) phase = 3;
                else if (cycleT >= phaseTimes[2]) phase = 2;
                else if (cycleT >= phaseTimes[1]) phase = 1;

                if (phase !== currentPhase) {
                    currentPhase = phase;
                    updatePhaseDOM(phase);
                }

                // Phase transition progress [0..1] within current phase
                const phaseStart = phaseTimes[phase];
                const phaseEnd = phase < 3 ? phaseTimes[phase + 1] : CYCLE;
                const phaseP = Math.min(1, (cycleT - phaseStart) / (phaseEnd - phaseStart));

                bgMat.uniforms.uTime.value = clock;

                /* ── PHASE 0: Unemployed — slumped, grey-blue ─────── */
                if (phase === 0) {
                    setTargetColor(0x4a5568);
                    bgMat.uniforms.uPhase.value *= 0.95; // fade to cold
                    bgMat.uniforms.uSunrise.value *= 0.92;
                    fillLight.intensity *= 0.95;

                    // Slumped posture — arms drooped, breathing
                    const breathe = Math.sin(clock * 0.8) * 0.04;
                    lArm.rotation.z = Math.PI / 4 + breathe;
                    rArm.rotation.z = -Math.PI / 4 - breathe;
                    figGroup.position.y = -1.8 + Math.sin(clock * 0.8) * 0.06;
                    figGroup.rotation.y = Math.sin(clock * 0.12) * 0.06;

                    // Papers visible
                    papers.forEach(p => { if (p) p.style.opacity = '0.65'; });
                    if (digiResume) { digiResume.style.opacity = '0'; digiResume.style.transform = 'translate(-50%, -50%) scale(0.4)'; }
                    if (buildingEl) buildingEl.style.opacity = '0';
                    if (horizonEl) horizonEl.style.opacity = '0';
                    if (rayEl) rayEl.style.opacity = '0';

                    laptopGroup.scale.lerp(new THREE.Vector3(0, 0, 0), 0.08);
                    auraMat.color.set(0x718096);
                    auraMat.opacity = 0.05 + Math.sin(clock * 0.6) * 0.02;
                    ambient.color.set(0xb0bec8);
                    ambient.intensity = 0.5;
                    keyLight.color.set(0x9aafc8);
                }

                /* ── PHASE 1: Transformation — stands up, resume glows */
                if (phase === 1) {
                    setTargetColor(0x5a6f9a);
                    const warm = Math.min(1, phaseP * 1.5);
                    bgMat.uniforms.uPhase.value = phaseP * 0.35;

                    // Stand up — arms lift, posture improves
                    const standAmt = Math.min(1, phaseP * 2.2);
                    lArm.rotation.z = Math.PI / 4 - standAmt * (Math.PI / 4 - Math.PI / 8);
                    rArm.rotation.z = -(Math.PI / 4 - standAmt * (Math.PI / 4 - Math.PI / 8));
                    figGroup.position.y = -1.8 + standAmt * 0.3 + Math.sin(clock * 0.7) * 0.05;
                    figGroup.rotation.y = Math.sin(clock * 0.15) * 0.08;

                    // Papers fade as digital resume appears
                    const paperFade = Math.max(0, 1.0 - phaseP * 2.5);
                    papers.forEach(p => { if (p) p.style.opacity = paperFade.toString(); });
                    if (digiResume && phaseP > 0.35) {
                        const dr = Math.min(1, (phaseP - 0.35) / 0.5);
                        digiResume.style.opacity = dr.toFixed(3);
                        digiResume.style.transform = `translate(-50%, -50%) scale(${0.4 + dr * 0.7})`;
                    }

                    // Light ray starts
                    if (rayEl) rayEl.style.opacity = (phaseP * 0.5).toFixed(3);
                    fillLight.intensity = phaseP * 1.2;
                    fillLight.color.set(0xffc07a);
                    ambient.intensity = 0.5 + phaseP * 0.25;
                    keyLight.color.set(0xb8c8e0);
                    auraMat.color.set(0x5a6f9a);
                    auraMat.opacity = 0.06 + phaseP * 0.04;
                }

                /* ── PHASE 2: Interview Ready ─────────────────────── */
                if (phase === 2) {
                    setTargetColor(0x5c7cfa);
                    bgMat.uniforms.uPhase.value = 0.35 + phaseP * 0.3;
                    bgMat.uniforms.uSunrise.value = phaseP * 0.35;

                    // Confident upright posture, minimal sway
                    lArm.rotation.z = Math.PI / 8 + Math.sin(clock * 0.9) * 0.05;
                    rArm.rotation.z = -(Math.PI / 8 + Math.sin(clock * 0.9) * 0.05);
                    figGroup.position.y = -1.5 + Math.sin(clock * 0.65) * 0.04;
                    figGroup.rotation.y = Math.sin(clock * 0.18) * 0.09;

                    // Laptop appears
                    laptopGroup.scale.lerp(new THREE.Vector3(1, 1, 1), 0.05);

                    papers.forEach(p => { if (p) { p.style.opacity = '0'; } });
                    if (digiResume) digiResume.style.opacity = (1 - phaseP * 0.8).toFixed(3);
                    if (rayEl) rayEl.style.opacity = (0.5 - phaseP * 0.3).toFixed(3);

                    fillLight.intensity = 1.2 + phaseP * 0.8;
                    fillLight.color.set(0xffd080);
                    ambient.intensity = 0.75;
                    ambient.color.set(0xd4e0f0);
                    auraMat.color.set(0x4a7cf0);
                    auraMat.opacity = 0.08 + Math.sin(clock * 1.2) * 0.03;
                    if (horizonEl) horizonEl.style.opacity = (phaseP * 0.55).toFixed(3);
                }

                /* ── PHASE 3: Employed — sunrise, building ────────── */
                if (phase === 3) {
                    setTargetColor(0x68d391);
                    bgMat.uniforms.uPhase.value = 0.65 + phaseP * 0.35;
                    bgMat.uniforms.uSunrise.value = 0.35 + phaseP * 0.65;

                    // Triumphant — arms slightly raised, confident
                    const triumph = Math.min(1, phaseP * 2.0);
                    lArm.rotation.z = Math.PI / 8 - triumph * Math.PI / 16;
                    rArm.rotation.z = -(Math.PI / 8 - triumph * Math.PI / 16);
                    figGroup.position.y = -1.45 + Math.sin(clock * 0.55) * 0.05;
                    figGroup.rotation.y = Math.sin(clock * 0.22) * 0.1;

                    laptopGroup.scale.lerp(new THREE.Vector3(1, 1, 1), 0.06);
                    papers.forEach(p => { if (p) p.style.opacity = '0'; });
                    if (digiResume) digiResume.style.opacity = '0';
                    if (buildingEl) buildingEl.style.opacity = (Math.min(1, phaseP * 2.0)).toFixed(3);
                    if (horizonEl) horizonEl.style.opacity = '0.65';
                    if (rayEl) rayEl.style.opacity = (0.2 + phaseP * 0.5).toFixed(3);

                    fillLight.intensity = 2.2 + Math.sin(clock * 0.8) * 0.3;
                    fillLight.color.set(0xffa040);
                    ambient.intensity = 0.9;
                    ambient.color.set(0xffecd8);
                    keyLight.color.set(0xffd4a0);
                    auraMat.color.set(0x48bb78);
                    auraMat.opacity = 0.1 + Math.sin(clock * 1.5) * 0.04;
                }

                /* ── Smooth body color lerp ─────────────────────── */
                allFigMeshes.forEach(m => {
                    m.material.color.lerp(targetBodyColor, 0.025);
                    m.material.emissive.copy(m.material.color).multiplyScalar(0.18);
                });
                auraMat.color.lerp(targetBodyColor, 0.02);

                /* ── Particles drift ────────────────────────────── */
                const pa = pGeo.attributes.position.array;
                for (let i = 0; i < NPART; i++) {
                    pa[i * 3 + 1] += pSpeed[i];
                    pa[i * 3] += Math.sin(clock * 0.25 + i * 0.08) * 0.001;
                    if (pa[i * 3 + 1] > 12) pa[i * 3 + 1] = -11;
                }
                pGeo.attributes.position.needsUpdate = true;
                pMat.opacity = 0.15 + (currentPhase / 3) * 0.15;

                /* ── Grid fades out toward employed phase ────────── */
                gridHelper.material.opacity = Math.max(0.05, 0.35 - currentPhase * 0.1);

                /* ── Subtle camera parallax ─────────────────────── */
                camera.position.x += (mouse.x * 1.8 - camera.position.x) * 0.03;
                camera.position.y += (-mouse.y * 1.2 + 2.5 - camera.position.y) * 0.03;
                camera.lookAt(0, 3, 0);

                renderer.render(scene, camera);
            }

            animate();

            // Initial DOM update
            updatePhaseDOM(0);

            // Resize
            window.addEventListener('resize', () => {
                const { w, h } = getPanelSize();
                camera.aspect = w / h;
                camera.updateProjectionMatrix();
                renderer.setSize(w, h);
            });

        } catch (err) {
            console.error('[ThiranMitra login3d] Scene error:', err);
        }
    }

    /* ── Parallax mouse tracking ────────────────────────────────── */
    const mouse = { x: 0, y: 0 };
    document.addEventListener('mousemove', e => {
        const panel = document.getElementById('animPanel');
        if (!panel) return;
        const rect = panel.getBoundingClientRect();
        mouse.x = (e.clientX - rect.left) / rect.width - 0.5;
        mouse.y = (e.clientY - rect.top) / rect.height - 0.5;
    });

    /* ── Boot ───────────────────────────────────────────────────── */
    function boot() {
        injectFloatingKeywords();
        initScene();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }

})();
