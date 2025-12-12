// chatbot-threejs-integrado.js
// Chatbot con Avatar 3D usando Three.js (sin conflictos)

// ==================== CONFIGURACIÓN GLOBAL ====================
// Verificar si Three.js ya está cargado
let THREE_LOADED = false;

// ==================== CLASE AVATAR 3D CON THREE.JS ====================
class Avatar3DThreeJS {
    constructor(containerId) {
        this.containerId = containerId;
        this.container = null;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.avatar = null;
        this.mixer = null;
        this.mouthMorph = null;
        this.eyeMorphs = {};
        this.isTalking = false;
        this.isReady = false;
        this.idleInterval = null;
        this.talkAnimation = null;

        // Configuración
        this.modelUrl = 'https://models.readyplayer.me/693807c878f65986cc81521f.glb?morphTargets=ARKit';
        this.talkIntensity = 0.3;
        this.idleIntensity = 0.05;

        this.init();
    }

    async init() {
        console.log('🔄 Inicializando Avatar 3D con Three.js...');

        try {
            // Cargar Three.js dinámicamente
            await this.loadThreeJS();

            // Crear contenedor
            this.createContainer();

            // Configurar Three.js
            this.setupThreeJS();

            // Cargar modelo
            await this.loadModel();

            // Iniciar animaciones
            this.startIdleAnimations();
            this.animate();

            this.isReady = true;
            console.log('✅ Avatar 3D listo');

        } catch (error) {
            console.error('❌ Error inicializando avatar 3D:', error);
            this.showFallback();
        }
    }

    loadThreeJS() {
        return new Promise((resolve, reject) => {
            // Si Three.js ya está cargado
            if (window.THREE) {
                console.log('✅ Three.js ya cargado');
                THREE_LOADED = true;
                resolve();
                return;
            }

            console.log('📦 Cargando Three.js...');

            // Cargar Three.js principal
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';

            script.onload = () => {
                console.log('✅ Three.js cargado');
                THREE_LOADED = true;

                // Ahora cargar GLTFLoader
                const loaderScript = document.createElement('script');
                loaderScript.src = 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.min.js';

                loaderScript.onload = () => {
                    console.log('✅ GLTFLoader cargado');
                    resolve();
                };

                loaderScript.onerror = (error) => {
                    console.error('❌ Error cargando GLTFLoader:', error);
                    reject(error);
                };

                document.head.appendChild(loaderScript);
            };

            script.onerror = (error) => {
                console.error('❌ Error cargando Three.js:', error);
                reject(error);
            };

            document.head.appendChild(script);
        });
    }

    createContainer() {
        let container = document.getElementById(this.containerId);
        if (!container) {
            container = document.createElement('div');
            container.id = this.containerId;
            container.className = 'avatar-3d-container';
            document.body.appendChild(container);
        }

        // Limpiar contenedor
        container.innerHTML = '';
        this.container = container;

        // Estilos básicos
        container.style.width = '100%';
        container.style.height = '200px'; // Altura fija para el chatbot
        container.style.position = 'relative';
        container.style.overflow = 'hidden';
        container.style.background = 'radial-gradient(circle at center, rgba(0,50,100,0.2) 0%, rgba(0,0,20,0.8) 100%)';
    }

    setupThreeJS() {
        if (!window.THREE) {
        throw new Error('Three.js no está cargado');
    }

        // 1. ESCENA
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x001122);
        this.scene.fog = new THREE.Fog(0x001122, 5, 15);

        // 2. CÁMARA - AJUSTADA PARA ENFOQUE FACIAL
        this.camera = new THREE.PerspectiveCamera(
            40, // Reducir FOV para menos distorsión
            this.container.clientWidth / this.container.clientHeight,
            0.1,
            1000
        );
        // Posición para enfoque en la cara
        this.camera.position.set(0, 0., 1.5); // Más cerca y centrado en la cara

        // 3. RENDERER
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            preserveDrawingBuffer: true
        });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.container.appendChild(this.renderer.domElement);

        // 4. LUCES
        // Luz ambiente
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        // Luz direccional principal
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 10, 7);
        this.scene.add(directionalLight);

        // Luz holográfica azul
        const hologramLight = new THREE.PointLight(0x00aaff, 0.5, 10);
        hologramLight.position.set(0, 2, 0);
        this.scene.add(hologramLight);

        // Luz de relleno
        const fillLight = new THREE.DirectionalLight(0x0044aa, 0.3);
        fillLight.position.set(-5, 5, 5);
        this.scene.add(fillLight);

        // 5. EFECTO HOLOGRÁFICO EN MATERIALES
        this.applyHologramEffect();

        // 6. MANEJAR REDIMENSIONAMIENTO
        window.addEventListener('resize', () => this.onResize());
    }

    applyHologramEffect() {
        const style = document.createElement('style');
        style.textContent = `
            .avatar-3d-container canvas {
                filter:
                    brightness(1.2)
                    contrast(1.1)
                    saturate(1.3)
                    hue-rotate(180deg)
                    drop-shadow(0 0 10px rgba(0, 255, 255, 0.3));
            }

            .avatar-3d-container::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: linear-gradient(
                    0deg,
                    transparent 0%,
                    rgba(0, 255, 255, 0.03) 10%,
                    transparent 20%,
                    rgba(0, 255, 255, 0.03) 30%,
                    transparent 40%,
                    rgba(0, 255, 255, 0.03) 50%,
                    transparent 60%,
                    rgba(0, 255, 255, 0.03) 70%,
                    transparent 80%,
                    rgba(0, 255, 255, 0.03) 90%,
                    transparent 100%
                );
                animation: hologramScan 4s linear infinite;
                pointer-events: none;
                z-index: 10;
            }

            .avatar-3d-container::after {
                content: '';
                position: absolute;
                top: -50%;
                left: -50%;
                width: 200%;
                height: 200%;
                background: conic-gradient(
                    from 0deg,
                    transparent 0%,
                    rgba(0, 255, 255, 0.1) 10%,
                    transparent 20%,
                    rgba(0, 100, 255, 0.1) 30%,
                    transparent 40%,
                    rgba(0, 255, 255, 0.1) 50%,
                    transparent 60%,
                    rgba(0, 100, 255, 0.1) 70%,
                    transparent 80%,
                    rgba(0, 255, 255, 0.1) 90%,
                    transparent 100%
                );
                animation: rotate 20s linear infinite;
                pointer-events: none;
                z-index: 5;
                opacity: 0.3;
            }

            @keyframes hologramScan {
                0% { transform: translateY(-100%); }
                100% { transform: translateY(100%); }
            }

            @keyframes rotate {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }

    async loadModel() {
        return new Promise((resolve, reject) => {
            if (!window.THREE || !window.THREE.GLTFLoader) {
                reject(new Error('Three.js o GLTFLoader no disponibles'));
                return;
            }

            const loader = new THREE.GLTFLoader();

            loader.load(
                this.modelUrl,
                (gltf) => {
                    console.log('✅ Modelo GLB cargado');

                    this.avatar = gltf.scene;

                    // Ajustar tamaño y posición
                    this.avatar.scale.set(2.2, 2.2, 2.2);
                    this.avatar.position.set(0, -3.7, 0);




                    // Añadir a la escena
                    this.scene.add(this.avatar);

                    // Configurar animaciones
                    if (gltf.animations && gltf.animations.length > 0) {
                        this.mixer = new THREE.AnimationMixer(this.avatar);
                        // Reproducir animación idle si existe
                        const idleAnim = gltf.animations.find(anim =>
                            anim.name.toLowerCase().includes('idle') ||
                            anim.name.toLowerCase().includes('breathing')
                        );
                        if (idleAnim) {
                            this.mixer.clipAction(idleAnim).play();
                            console.log('✅ Animación idle iniciada');
                        }
                    }

                    // Buscar morph targets para boca y ojos
                    this.findMorphTargets();

                    resolve();
                },
                // Progreso
                (xhr) => {
                    const percent = (xhr.loaded / xhr.total) * 100;
                    console.log(`📥 Cargando modelo: ${Math.round(percent)}%`);
                },
                // Error
                (error) => {
                    console.error('❌ Error cargando modelo GLB:', error);

                    // Intentar cargar modelo alternativo
                    console.log('🔄 Intentando cargar modelo alternativo...');
                    this.loadFallbackModel().then(resolve).catch(reject);
                }
            );
        });
    }

    loadFallbackModel() {
        return new Promise((resolve, reject) => {
            const loader = new THREE.GLTFLoader();
            const fallbackUrl = 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Duck/glTF/Duck.gltf';

            loader.load(fallbackUrl, (gltf) => {
                console.log('✅ Modelo alternativo cargado (Duck)');

                this.avatar = gltf.scene;
                this.avatar.scale.set(0.01, 0.01, 0.01);
                this.avatar.position.set(0, -1, 0);

                this.scene.add(this.avatar);

                resolve();
            }, undefined, reject);
        });
    }



    findMorphTargets() {
        if (!this.avatar) return;

        this.avatar.traverse((node) => {
            if (node.isMesh && node.morphTargetDictionary) {
                // Buscar morph de boca
                const mouthNames = ['mouthOpen', 'jawOpen', 'vocal', 'aa', 'ee', 'oo'];
                for (const name of mouthNames) {
                    if (node.morphTargetDictionary[name] !== undefined) {
                        this.mouthMorph = {
                            mesh: node,
                            index: node.morphTargetDictionary[name],
                            name: name
                        };
                        console.log(`✅ Encontrado morph de boca: ${name}`);
                        break;
                    }
                }

                // Buscar morphs de ojos
                const eyeBlinkLeft = node.morphTargetDictionary['eyeBlinkLeft'];
                const eyeBlinkRight = node.morphTargetDictionary['eyeBlinkRight'];

                if (eyeBlinkLeft !== undefined && eyeBlinkRight !== undefined) {
                    this.eyeMorphs = {
                        left: { mesh: node, index: eyeBlinkLeft },
                        right: { mesh: node, index: eyeBlinkRight }
                    };
                    console.log('✅ Encontrados morphs de ojos');
                }
            }
        });
    }

    startIdleAnimations() {
        if (this.idleInterval) clearInterval(this.idleInterval);

        // 1. Parpadeos aleatorios
        this.idleInterval = setInterval(() => {
            if (this.isTalking || !this.isReady) return;

            // Parpadeo (80% de probabilidad)
            if (Math.random() < 0.8) {
                this.blink();
            }

            // Movimiento sutil de cabeza (80% de probabilidad)
            if (Math.random() < 0.8) {
                this.slightHeadMovement();
            }

        },2000); // Cada 2 segundos
    }

    blink() {
        if (!this.eyeMorphs.left || !this.eyeMorphs.right) return;

        const leftMesh = this.eyeMorphs.left.mesh;
        const rightMesh = this.eyeMorphs.right.mesh;
        const leftIndex = this.eyeMorphs.left.index;
        const rightIndex = this.eyeMorphs.right.index;

        // Parpadeo rápido
        leftMesh.morphTargetInfluences[leftIndex] = 0.8;
        rightMesh.morphTargetInfluences[rightIndex] = 0.8;

        setTimeout(() => {
            if (leftMesh && rightMesh) {
                leftMesh.morphTargetInfluences[leftIndex] = 0;
                rightMesh.morphTargetInfluences[rightIndex] = 0;
            }
        }, 150);
    }

    slightHeadMovement() {
        if (!this.avatar) return;

        // Rotación leve y natural, alrededor del centro
        const targetRotation = (Math.random() - 0.5) * 0.1; // ±0.05 radianes

        this.animateValue(
            this.avatar.rotation.y,
            targetRotation,
            1000,
            (value) => { this.avatar.rotation.y = value; }
        );
    }

    animateValue(start, end, duration, updateCallback) {
        const startTime = Date.now();
        const endTime = startTime + duration;

        const animate = () => {
            const now = Date.now();
            if (now >= endTime) {
                updateCallback(end);
                return;
            }

            const progress = (now - startTime) / duration;
            const easeProgress = 0.5 * (1 - Math.cos(Math.PI * progress));
            const value = start + (end - start) * easeProgress;

            updateCallback(value);
            requestAnimationFrame(animate);
        };

        animate();
    }

    startSpeaking(duration = null) {
        if (!this.isReady || this.isTalking) return;

        this.isTalking = true;
        console.log('🗣️ Avatar comenzando a hablar...');

        // Detener animaciones idle
        if (this.idleInterval) {
            clearInterval(this.idleInterval);
            this.idleInterval = null;
        }

        // Animación de boca al hablar
        if (this.mouthMorph) {
            this.animateMouthSpeaking(duration);
        } else {
            // Si no hay morph, al menos rotar cabeza
            if (duration) {
                this.animateHeadNodding(duration);
            }
        }
    }

    animateMouthSpeaking(duration = null) {
        const startTime = Date.now();
        const endTime = duration ? startTime + duration : null;

        const animate = () => {
            if (!this.isTalking) return;

            // Si hay duración definida y se cumplió, detener
            if (endTime && Date.now() >= endTime) {
                this.stopSpeaking();
                return;
            }

            // Patrón de habla natural (ondas múltiples)
            const elapsed = (Date.now() - startTime) / 1000;
            const wave1 = Math.sin(elapsed * 8) * 0.1;
            const wave2 = Math.sin(elapsed * 15) * 0.05;
            const random = (Math.random() - 0.5) * 0.02;

            let mouthValue = wave1 + wave2 + random + 0.15;
            mouthValue = Math.max(0.1, Math.min(mouthValue, this.talkIntensity));

            if (this.mouthMorph && this.mouthMorph.mesh) {
                this.mouthMorph.mesh.morphTargetInfluences[this.mouthMorph.index] = mouthValue;
            }

            requestAnimationFrame(animate);
    };

    this.talkAnimation = requestAnimationFrame(animate);
}

    animateHeadNodding(duration) {
        if (!this.avatar) return;

        // Asentir ligeramente mientras habla
        const originalRotation = this.avatar.rotation.x;
        const nodRotation = originalRotation - 0.05;

        this.animateValue(originalRotation, nodRotation, 500, (value) => {
            this.avatar.rotation.x = value;
        });

        // Volver a la posición original al terminar
        setTimeout(() => {
            if (this.isTalking && this.avatar) {
                this.animateValue(nodRotation, originalRotation, 500, (value) => {
                    this.avatar.rotation.x = value;
                });
            }
        }, duration - 500);
    }

    stopSpeaking() {
        if (!this.isTalking) return;

        this.isTalking = false;
        console.log('⏹️ Avatar dejando de hablar...');

        // Cancelar animación actual
        if (this.talkAnimation) {
            cancelAnimationFrame(this.talkAnimation);
            this.talkAnimation = null;
        }

        // Resetear morph de boca
        if (this.mouthMorph && this.mouthMorph.mesh) {
            this.mouthMorph.mesh.morphTargetInfluences[this.mouthMorph.index] = 0;
        }

        // Resetear rotación de cabeza
        if (this.avatar) {
            this.avatar.rotation.x = 0;
        }

        // Reanudar animaciones idle
        this.startIdleAnimations();
    }

    onResize() {
        if (!this.camera || !this.renderer || !this.container) return;

        this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        // Actualizar animaciones del mixer
        if (this.mixer) {
            this.mixer.update(0.016); // 60 FPS aproximado
        }

        // Rotación lenta y continua del avatar (solo cuando no está hablando)


        // Renderizar escena
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }

    showFallback() {
        if (this.container) {
            this.container.innerHTML = `
                <div style="
                    width: 100%;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    color: #00ffff;
                    text-align: center;
                    font-family: monospace;
                    padding: 20px;
                ">
                    <div style="font-size: 48px; margin-bottom: 10px; animation: pulse 2s infinite;">
                        🤖
                    </div>
                    <div style="font-size: 14px; opacity: 0.7;">
                        Avatar 3D no disponible<br>
                        Usando representación alternativa
                    </div>
                </div>
            `;
        }
    }
}

// ==================== CLASE CHATBOT PRINCIPAL ====================
class ChatbotHolograma {
    constructor() {
        this.isOpen = false;
        this.isGenerating = false;
        this.messages = [];
        this.isTalking = false;
        this.vozHombreCargada = false;
        this.avatar3D = null;

        this.initializeChatbot();
    }

    initializeChatbot() {
        console.log('🔧 Inicializando chatbot con Avatar 3D...');

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.createChatbotElements();
                this.setupEventListeners();
                this.cargarVoces();
            });
        } else {
            this.createChatbotElements();
            this.setupEventListeners();
            this.cargarVoces();
        }
    }

    createChatbotElements() {
        console.log('🛠️ Creando elementos del chatbot...');

        if (document.getElementById('chatbot-container')) {
            console.log('⚠️ Chatbot ya existe, saltando creación...');
            return;
        }

        this.chatContainer = document.createElement('div');
        this.chatContainer.id = 'chatbot-container';
        this.chatContainer.className = 'chatbot-closed';
        this.chatContainer.innerHTML = `
            <div class="chatbot-header">
                <h4>Asistente Castilla Motors</h4>
                <button class="close-chat" aria-label="Cerrar chat">✕</button>
            </div>
            <div class="chat-messages" id="chat-messages">
                <div class="message bot">
                    <p>¡Hola! Soy tu asistente virtual de Castilla Motors. ¿En qué puedo ayudarte hoy?</p>
                </div>
            </div>
            <div class="holograma-container" id="holograma-container">
                <!-- Avatar 3D se cargará aquí -->
                <div class="holograma-loading">
                    <div class="loading-spinner"></div>
                    <div>Cargando avatar 3D...</div>
                </div>
            </div>
            <div class="chat-input">
                <input type="text" id="user-input" placeholder="Escribe tu pregunta..." aria-label="Escribe tu mensaje">
                <button id="send-btn" aria-label="Enviar mensaje">Enviar</button>
            </div>
        `;
        document.body.appendChild(this.chatContainer);

        console.log('✅ Contenedor del chatbot creado');

        // Inicializar avatar 3D
        setTimeout(() => {
            this.initializeAvatar3D();
        }, 500);
    }

    async initializeAvatar3D() {
        try {
            console.log('🔄 Inicializando Avatar 3D...');

            // Crear instancia del avatar 3D
            this.avatar3D = new Avatar3DThreeJS('holograma-container');

            // Añadir estilos adicionales
            this.addChatbotStyles();

            console.log('✅ Avatar 3D inicializado');

        } catch (error) {
            console.error('❌ Error al inicializar Avatar 3D:', error);
            this.showFallbackHologram();
        }
    }

    addChatbotStyles() {
        if (document.getElementById('chatbot-additional-styles')) return;

        const style = document.createElement('style');
        style.id = 'chatbot-additional-styles';
        style.textContent = `
            .holograma-loading {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                color: #00ffff;
                font-family: monospace;
                background: rgba(0, 20, 40, 0.7);
                z-index: 1;
            }

            .loading-spinner {
                width: 40px;
                height: 40px;
                border: 3px solid rgba(0, 255, 255, 0.3);
                border-radius: 50%;
                border-top-color: #00ffff;
                animation: spin 1s linear infinite;
                margin-bottom: 10px;
            }

            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }

            .holograma-container {
                position: relative;
                height: 200px;
                min-height: 200px;
                background: radial-gradient(
                    circle at center,
                    rgba(0, 50, 100, 0.1) 0%,
                    rgba(0, 10, 30, 0.3) 50%,
                    rgba(0, 0, 20, 0.5) 100%
                );
                border-top: 1px solid rgba(0, 255, 255, 0.2);
                border-bottom: 1px solid rgba(0, 255, 255, 0.2);
                overflow: hidden;
            }
        `;
        document.head.appendChild(style);
    }

    showFallbackHologram() {
        const container = document.getElementById('holograma-container');
        if (container) {
            container.innerHTML = `
                <div style="
                    width: 100%;
                    height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: radial-gradient(circle at center, rgba(0,50,100,0.2) 0%, rgba(0,0,20,0.8) 100%);
                ">
                    <div style="
                        font-size: 48px;
                        color: #00ffff;
                        opacity: 0.7;
                        animation: pulse 2s infinite;
                    ">
                        🤖
                    </div>
                </div>
            `;
        }
    }

    // ... [RESTANTE DEL CÓDIGO DEL CHATBOT - MÉTODOS setupEventListeners, cargarVoces, toggleChat, etc.] ...
    // Estos métodos son IDÉNTICOS a los que ya tenías en tu chatbot-holograma.js original
    // Solo cambiando las referencias de this.avatar a this.avatar3D

    setupEventListeners() {
        console.log('🎮 Configurando event listeners...');

        const existingToggleBtn = document.querySelector('a#chatbot-toggle');

        if (existingToggleBtn) {
            console.log('✅ Usando botón rojo existente');
            this.toggleBtn = existingToggleBtn;

            const newToggleBtn = this.toggleBtn.cloneNode(true);
            this.toggleBtn.parentNode.replaceChild(newToggleBtn, this.toggleBtn);
            this.toggleBtn = newToggleBtn;

            this.toggleBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🎯 Botón rojo clickeado');
                this.toggleChat();
            });

            this.toggleBtn.style.display = 'block';
        } else {
            console.warn('⚠️ No se encontró el botón rojo existente, creando uno nuevo');
            this.toggleBtn = document.createElement('a');
            this.toggleBtn.id = 'chatbot-toggle';
            this.toggleBtn.className = 'btn chatbot';
            this.toggleBtn.href = '#';
            this.toggleBtn.innerHTML = '<span class="glyphicon glyphicon-comment"></span>';
            this.toggleBtn.title = "Abrir asistente virtual";
            document.body.appendChild(this.toggleBtn);

            this.toggleBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleChat();
            });
        }

        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('close-chat')) {
                e.preventDefault();
                this.closeChat();
            }
        });

        document.addEventListener('keypress', (e) => {
            if (e.target.id === 'user-input' && e.key === 'Enter') {
                e.preventDefault();
                this.sendMessage();
            }
        });

        document.addEventListener('click', (e) => {
            if (e.target.id === 'send-btn') {
                e.preventDefault();
                this.sendMessage();
            }
        });

        console.log('✅ Event listeners configurados');
    }

    cargarVoces() {
        if ('speechSynthesis' in window) {
            const voces = speechSynthesis.getVoices();
            if (voces.length === 0) {
                speechSynthesis.addEventListener('voiceschanged', () => {
                    console.log(`✅ ${speechSynthesis.getVoices().length} voces cargadas`);
                    this.vozHombreCargada = true;
                }, { once: true });
            } else {
                console.log(`✅ ${voces.length} voces disponibles`);
                this.vozHombreCargada = true;
            }
        } else {
            console.warn('⚠️ Tu navegador no soporta síntesis de voz');
        }
    }

    toggleChat() {
        console.log('🔄 Cambiando estado del chat:', this.isOpen ? 'Cerrando' : 'Abriendo');

        if (this.isOpen) {
            this.closeChat();
        } else {
            this.openChat();
        }
    }

    openChat() {
        console.log('🚀 Abriendo chat...');

        this.isOpen = true;
        const chatContainer = document.getElementById('chatbot-container');

        if (chatContainer) {
            chatContainer.className = 'chatbot-open';

            if (this.toggleBtn) {
                this.toggleBtn.style.display = 'none';
            }

            setTimeout(() => {
                const input = document.getElementById('user-input');
                if (input) {
                    input.focus();
                }
            }, 300);

            console.log('✅ Chat abierto');
        }
    }

    closeChat() {
        console.log('🔒 Cerrando chat...');

        this.isOpen = false;
        const chatContainer = document.getElementById('chatbot-container');

        if (chatContainer) {
            chatContainer.className = 'chatbot-closed';

            if (this.toggleBtn) {
                this.toggleBtn.style.display = 'block';
            }

            if (this.isTalking) {
                this.detenerHabla();
            }

            console.log('✅ Chat cerrado');
        }
    }

    async sendMessage() {
        const input = document.getElementById('user-input');
        if (!input) return;

        const userMessage = input.value.trim();

        if (!userMessage || this.isGenerating) return;

        console.log('📤 Enviando mensaje:', userMessage);

        this.addMessage(userMessage, 'user');
        input.value = '';

        this.showTypingIndicator();

        setTimeout(() => {
            this.hideTypingIndicator();
            this.generateResponse(userMessage);
        }, 1000);
    }

    addMessage(text, sender) {
        const messagesContainer = document.getElementById('chat-messages');
        if (!messagesContainer) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        messageDiv.innerHTML = `<p>${text}</p>`;
        messagesContainer.appendChild(messageDiv);

        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        this.messages.push({ text, sender });
    }

    showTypingIndicator() {
        this.isGenerating = true;
        const messagesContainer = document.getElementById('chat-messages');
        if (!messagesContainer) return;

        const typingDiv = document.createElement('div');
        typingDiv.id = 'typing-indicator';
        typingDiv.className = 'message bot typing';
        typingDiv.innerHTML = '<div class="typing-dots"><span></span><span></span><span></span></div>';
        messagesContainer.appendChild(typingDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    hideTypingIndicator() {
        this.isGenerating = false;
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    configurarVozMasculina(utterance) {
        utterance.rate = 0.9;
        utterance.pitch = 0.8;
        utterance.volume = 1.0;
        utterance.lang = 'es-ES';

        if ('speechSynthesis' in window && this.vozHombreCargada) {
            const voces = speechSynthesis.getVoices();

            if (voces.length > 0) {
                const vozExplicitaHombre = voces.find(v =>
                    v.name.toLowerCase().includes('hombre') ||
                    v.name.toLowerCase().includes('male') ||
                    v.name.toLowerCase().includes('masculino') ||
                    v.name.toLowerCase().includes('pablo') ||
                    v.name.toLowerCase().includes('jorge') ||
                    v.name.toLowerCase().includes('carlos') ||
                    v.name.toLowerCase().includes('david')
                );

                if (vozExplicitaHombre) {
                    utterance.voice = vozExplicitaHombre;
                    return true;
                }

                const vozEspanol = voces.find(v => v.lang.startsWith('es'));
                if (vozEspanol) {
                    utterance.voice = vozEspanol;
                    return true;
                }

                utterance.voice = voces[0];
                return true;
            }
        }

        return false;
    }

    hablarTexto(texto) {
        if (!texto.trim() || this.isTalking) return;

        this.isTalking = true;
        console.log('🗣️ Hablando:', texto);

        // Iniciar animación del avatar inmediatamente
        if (this.avatar3D) {
            this.avatar3D.startSpeaking();
        }

        if ('speechSynthesis' in window) {
            // Detener cualquier síntesis previa
            speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(texto);
            this.configurarVozMasculina(utterance);

            // Variables para seguimiento
            let startTime = Date.now();
            let isSpeaking = true;

            utterance.onstart = () => {
                console.log('🔊 Voz iniciada');
                startTime = Date.now();
            };

            utterance.onend = () => {
                console.log('✅ Voz completada');
                isSpeaking = false;
                this.detenerHabla();
            };

            utterance.onerror = (e) => {
                console.error('❌ Error en voz:', e);
                isSpeaking = false;
                this.detenerHabla();
            };

            utterance.onboundary = (event) => {
                // Si hay pausas largas, reiniciar temporizador
                if (event.name === 'word' || event.name === 'sentence') {
                    startTime = Date.now();
                }
            };

            // Verificación de seguridad: si pasa mucho tiempo sin eventos
            const safetyCheck = setInterval(() => {
                if (!isSpeaking) {
                    clearInterval(safetyCheck);
                    return;
                }

                const elapsed = Date.now() - startTime;
                // Si pasan 30 segundos sin eventos, detener
                if (elapsed > 30000) {
                    console.warn('⚠️ Timeout de seguridad activado');
                    speechSynthesis.cancel();
                    this.detenerHabla();
                    clearInterval(safetyCheck);
                }
            }, 1000);

            speechSynthesis.speak(utterance);

            // Limpiar intervalos cuando se detenga
            utterance.addEventListener('end', () => {
                clearInterval(safetyCheck);
            });

        } else {
            // Fallback sin síntesis de voz
            const duracionEstimada = texto.length * 80;
            if (this.avatar3D) {
                this.avatar3D.startSpeaking(duracionEstimada);
            }

            setTimeout(() => {
                this.detenerHabla();
            }, duracionEstimada);
        }
    }

    detenerHabla() {
        if (!this.isTalking) return;

        console.log('⏹️ Deteniendo habla...');
        this.isTalking = false;

        if (this.avatar3D) {
            this.avatar3D.stopSpeaking();
        }

        if ('speechSynthesis' in window) {
            speechSynthesis.cancel();
        }
    }

    async generateResponse(userMessage) {
        console.log('🤖 Generando respuesta para:', userMessage);

        let response = "Gracias por tu consulta. Para ofrecerte la mejor asistencia, puedes:";

        if (userMessage.toLowerCase().includes('comprar')) {
            response = "Para comprar un vehículo, visita nuestra sección de compra donde encontrarás todos nuestros modelos disponibles. ¿Te gustaría que te muestre algún modelo en particular?";
        } else if (userMessage.toLowerCase().includes('alquilar')) {
            response = "Tenemos una amplia flota de vehículos para alquiler. Visita nuestra sección de alquiler para ver disponibilidad y precios.";
        } else if (userMessage.toLowerCase().includes('mantenimiento')) {
            response = "Nuestro servicio de mantenimiento incluye revisión completa, cambio de aceite y filtros. Puedes solicitar cita a través de nuestra web.";
        } else if (userMessage.toLowerCase().includes('precio') || userMessage.toLowerCase().includes('cuánto')) {
            response = "Los precios varían según el modelo y las condiciones. Te recomiendo visitar las secciones específicas o contactarnos directamente para un presupuesto personalizado.";
        } else if (userMessage.toLowerCase().includes('hola') || userMessage.toLowerCase().includes('buenas')) {
            response = "¡Hola! Bienvenido a Castilla Motors. Estoy aquí para ayudarte con información sobre compra, alquilar o mantenimiento de vehículos. ¿En qué puedo asistirte?";
        } else if (userMessage.toLowerCase().includes('horario') || userMessage.toLowerCase().includes('abierto')) {
            response = "Nuestro horario de atención es de lunes a viernes de 9:00 a 19:00 y sábados de 10:00 a 14:00. ¡Te esperamos!";
        } else if (userMessage.toLowerCase().includes('contacto') || userMessage.toLowerCase().includes('teléfono')) {
            response = "Puedes contactarnos al +34 456 789 042 o por email a CastillaMotors@uclm.es. También estamos disponibles en nuestras redes sociales.";
        } else if (userMessage.toLowerCase().includes('gracias')) {
            response = "¡De nada! Estoy aquí para ayudarte. ¿Hay algo más en lo que pueda asistirte?";
        } else if (userMessage.toLowerCase().includes('coche') || userMessage.toLowerCase().includes('vehículo') || userMessage.toLowerCase().includes('auto')) {
            response = "Tenemos una amplia gama de vehículos nuevos y de ocasión. ¿Estás interesado en comprar, alquilar o necesitas información sobre mantenimiento?";
        } else {
            response = "Entiendo que quieres información sobre: '" + userMessage + "'. Como asistente virtual de Castilla Motors, puedo ayudarte con información sobre compra, alquilar, mantenimiento de vehículos, precios, horarios y contacto. ¿En qué aspecto te gustaría que profundice?";
        }

        console.log('📝 Respuesta generada:', response);

        this.addMessage(response, 'bot');
        this.hablarTexto(response);
    }
}

// ==================== INICIALIZACIÓN ====================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.chatbot = new ChatbotHolograma();
    });
} else {
    window.chatbot = new ChatbotHolograma();
}
