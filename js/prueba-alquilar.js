// chatbot-threejs-integrado.js
// Chatbot con Avatar 3D usando Three.js (sin conflictos)

// ==================== CONFIGURACIÓN GLOBAL ====================
// Verificar si Three.js ya está cargado
let THREE_LOADED = false;

// ==================== CLASE AVATAR 3D CON THREE.JS ====================
class Avatar3DThreeJS {
    constructor(containerId, initialLanguage = 'es') {
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

        // Configuración de modelos por idioma
        this.modelUrls = {
            'es': 'https://models.readyplayer.me/693807c878f65986cc81521f.glb?morphTargets=ARKit', // Chico español
            'en': 'https://models.readyplayer.me/693807c878f65986cc81521f.glb?morphTargets=ARKit', // Mismo chico para inglés
            'fr': 'https://models.readyplayer.me/693d62f314ff705000f43241.glb?morphTargets=ARKit', // Mujer francesa
            'de': 'https://models.readyplayer.me/693d62f314ff705000f43241.glb?morphTargets=ARKit'  // Mujer alemana
        };

        // Modelo por defecto
        this.currentModelUrl = '';
        this.currentLanguage = initialLanguage;

        this.talkIntensity = 0.3;
        this.idleIntensity = 0.05;

        this.init(initialLanguage);
    }

    async init(language = 'es') {
        console.log(`🔄 Inicializando Avatar 3D con idioma: ${language}...`);

        this.currentLanguage = language;
        this.currentModelUrl = this.modelUrls[language] || this.modelUrls['es'];

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
            console.log(`✅ Avatar 3D listo para idioma: ${language}`);

        } catch (error) {
            console.error('❌ Error inicializando avatar 3D:', error);
            this.showFallback();
        }
    }

    // Nuevo método para cambiar el avatar
    async changeAvatar(language) {
        if (language === this.currentLanguage && this.isReady) {
            console.log(`⚠️ El avatar ya está en idioma ${language}`);
            return;
        }

        console.log(`🔄 Cambiando avatar al idioma: ${language}`);

        // Verificar si Three.js está cargado
        if (!window.THREE || !window.THREE.GLTFLoader) {
            console.log('📦 Three.js no está cargado, cargando...');
            try {
                await this.loadThreeJS();
            } catch (error) {
                console.error('❌ Error cargando Three.js:', error);
                return;
            }
        }

        // Detener animaciones actuales
        if (this.idleInterval) {
            clearInterval(this.idleInterval);
            this.idleInterval = null;
        }

        if (this.talkAnimation) {
            cancelAnimationFrame(this.talkAnimation);
            this.talkAnimation = null;
        }

        // Limpiar avatar actual
        if (this.avatar && this.scene) {
            this.scene.remove(this.avatar);

            // Limpiar recursos del modelo anterior
            if (this.mixer) {
                this.mixer.stopAllAction();
                this.mixer.uncacheRoot(this.avatar);
                this.mixer = null;
            }

            // Limpiar geometry y materials
            this.avatar.traverse((child) => {
                if (child.isMesh) {
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) {
                        if (Array.isArray(child.material)) {
                            child.material.forEach(material => material.dispose());
                        } else {
                            child.material.dispose();
                        }
                    }
                }
            });

            this.avatar = null;
            this.mouthMorph = null;
            this.eyeMorphs = {};
        }

        if (!this.scene || !this.camera || !this.renderer) {
            console.log('🔄 Configurando Three.js para cambio de avatar...');
            this.createContainer();
            this.setupThreeJS();
        }

        // Actualizar idioma y URL del modelo
        this.currentLanguage = language;
        this.currentModelUrl = this.modelUrls[language] || this.modelUrls['es'];
        this.isReady = false;

        try {
            // Cargar nuevo modelo
            await this.loadModel();

            // ESPERAR un momento para asegurar que el modelo está completamente cargado
            await new Promise(resolve => setTimeout(resolve, 300));

            // Buscar morph targets después de cargar
            console.log('🔍 Buscando morph targets después del cambio...');
            this.findMorphTargets();

            // Verificar si se encontraron morph targets
            if (!this.mouthMorph) {
                console.warn('⚠️ No se encontraron morph targets de boca, intentando búsqueda más exhaustiva...');
                this.findMorphTargetsExhaustive();
            }

            // Reiniciar animaciones
            this.startIdleAnimations();

            this.isReady = true;
            console.log(`✅ Avatar cambiado a idioma: ${language}. Morph targets encontrados:`,
                       this.mouthMorph ? 'Sí' : 'No');


        } catch (error) {
            console.error('❌ Error cambiando avatar:', error);
            // Intentar cargar modelo por defecto
            this.currentModelUrl = this.modelUrls['es'];
            try {
                await this.loadModel();
                await new Promise(resolve => setTimeout(resolve, 300));
                this.findMorphTargets();
                this.startIdleAnimations();
                this.isReady = true;
            } catch (fallbackError) {
                console.error('❌ Error cargando modelo por defecto:', fallbackError);
                this.showFallback();
            }
        }
    }

    findMorphTargetsExhaustive() {
        if (!this.avatar) return;

        this.avatar.traverse((node) => {
            if (node.isMesh && node.morphTargetDictionary) {
                console.log('🔍 Buscando morph targets exhaustivamente...');
                console.log('Diccionario de morph targets:', node.morphTargetDictionary);

                // Buscar cualquier morph target relacionado con boca
                for (const [key, value] of Object.entries(node.morphTargetDictionary)) {
                    const lowerKey = key.toLowerCase();
                    if (lowerKey.includes('mouth') ||
                        lowerKey.includes('jaw') ||
                        lowerKey.includes('vocal') ||
                        lowerKey.includes('aa') ||
                        lowerKey.includes('ee') ||
                        lowerKey.includes('oo')) {

                        this.mouthMorph = {
                            mesh: node,
                            index: value,
                            name: key
                        };
                        console.log(`✅ Encontrado morph de boca (exhaustivo): ${key}`);
                        return;
                    }
                }
            }
        });
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
        this.camera.position.set(0, 0, 1.5); // Más cerca y centrado en la cara

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
                this.currentModelUrl,
                (gltf) => {
                    console.log('✅ Modelo GLB cargado');

                    this.avatar = gltf.scene;

                    // Ajustar tamaño y posición
                    this.avatar.scale.set(2.2, 2.2, 2.2);
                    let yPosition = -3.7; // Posición base (por defecto chico)

                    // Ajuste condicional para el modelo de la chica (fr y de)
                    if (this.currentLanguage === 'fr' || this.currentLanguage === 'de') {
                        // Si la chica necesita estar más arriba (menos negativo)
                        yPosition = -3.5;
                    }

                    this.avatar.position.set(0, yPosition, 0); // <--- USAR LA VARIABLE AJUSTADA




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

            if (this.isTalking) {
                this.talkAnimation = requestAnimationFrame(animate);
            }

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
        this.loadChatState();
        this.initializeChatbot();
    }

    initializeChatbot() {
        console.log('🔧 Inicializando chatbot con Avatar 3D...');

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.createChatbotElements();
                this.setupEventListeners();
                this.cargarVoces();
                this.applyChatStateToDOM();
                this.detectLanguageAndSetAvatar();
            });
        } else {
            this.createChatbotElements();
            this.setupEventListeners();
            this.cargarVoces();
            this.applyChatStateToDOM();
            this.detectLanguageAndSetAvatar();
        }
    }

    async detectLanguageAndSetAvatar() {
        const language = (document.documentElement.lang || 'es').split('-')[0];
        console.log(`🌍 Idioma detectado: ${language}`);

        await new Promise(resolve => setTimeout(resolve, 1000));
        // Esperar más tiempo para asegurar que el avatar esté inicializado
        if (this.avatar3D && this.avatar3D.isReady) {
            // Solo intentamos cambiar si el idioma actual (es) es diferente al detectado (fr, en, de)
            if (this.avatar3D.currentLanguage !== language) {
                console.log(`🚀 Forzando cambio de ES a ${language} al inicio...`);
                // LLAMADA CLAVE: Usamos await para esperar que el cambio de modelo termine.
                // Aunque changeAvatar no devuelve Promise, usaremos una nueva función de espera.
                await this.waitForAvatarChange(language);
            }
        } else {
            console.error('❌ Avatar 3D no se inicializó correctamente o a tiempo.');
        }
    }

    async waitForAvatarChange(language) {
        if (!this.avatar3D) return;

        // Ejecutar el cambio de avatar (que ya tiene la lógica de pause/resume en su interior)
        const changePromise = this.avatar3D.changeAvatar(language);

        // Si changeAvatar es asíncrono (y lo es), es mejor usar un mecanismo de espera.
        // Si el método no está diseñado para devolver Promise (como es tu caso),
        // esperamos un tiempo fijo suficiente.
        await new Promise(resolve => setTimeout(resolve, 1500));
        console.log(`✅ Espera de carga de avatar en ${language} terminada.`);
    }


    applyChatStateToDOM() {
        const chatContainer = document.getElementById('chatbot-container');

        // Determinar si el chat debe estar abierto
        const shouldBeOpen = this.isOpen;

        if (chatContainer) {
            if (shouldBeOpen) {
                chatContainer.className = 'chatbot-open';
                if (this.toggleBtn) this.toggleBtn.style.display = 'none';
                console.log('🔄 Chat abierto por estado de sesión o flag de navegación.');
            } else {
                chatContainer.className = 'chatbot-closed';
                if (this.toggleBtn) this.toggleBtn.style.display = 'block';
                console.log('🔒 Chat cerrado por defecto o por última acción del usuario.');
            }
        }
    }
    saveChatState() {
        try {
            const chatState = {
                messages: this.messages,
                // Solo guardamos el estado de apertura/cierre de la última acción del usuario.
                isOpen: this.isOpen
            };
            // *** CAMBIO CLAVE: Usamos sessionStorage para que se borre al cerrar la pestaña. ***
            sessionStorage.setItem('chatbotState', JSON.stringify(chatState));
            console.log('✅ Estado del chat (mensajes y apertura) guardado en sessionStorage.');
        } catch (e) {
            console.error('❌ Error guardando el estado del chat:', e);
        }
    }

    loadChatState() {
        try {
            const storedState = sessionStorage.getItem('chatbotState');

            // 1. Verificar el FLAG de apertura forzada después de la navegación
            const openFlag = sessionStorage.getItem('chatbotOpenOnLoad');

            // 2. Cargar estado y mensajes
            if (storedState) {
                const chatState = JSON.parse(storedState);
                this.messages = chatState.messages;

                // Si hay un flag forzado (navegación interna), forzar la apertura.
                // Si no hay flag, usar el último estado guardado (chatState.isOpen).
                this.isOpen = (openFlag === 'true') ? true : (chatState.isOpen || false);

                // *** NUEVO: Borrar el flag para que la siguiente recarga sea normal (cerrado) ***
                sessionStorage.removeItem('chatbotOpenOnLoad');

                console.log(`✅ Estado cargado. Mensajes: ${this.messages.length}. Abierto: ${this.isOpen}`);
            } else {
                // Estado inicial por defecto (cerrado, con mensaje de bienvenida)
                this.messages = [{
                    text: "¡Hola! Soy tu asistente virtual de Castilla Motors. ¿En qué puedo ayudarte hoy?",
                    sender: "bot"
                }];
                this.isOpen = (openFlag === 'true'); // Solo se abre si existe el flag
                sessionStorage.removeItem('chatbotOpenOnLoad');
            }
        } catch (e) {
            console.error('❌ Error cargando el estado del chat desde sessionStorage:', e);
            // Fallback
            this.messages = [{
                text: "¡Hola! Soy tu asistente virtual de Castilla Motors. ¿En qué puedo ayudarte hoy?",
                sender: "bot"
            }];
            this.isOpen = false;
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

        this.renderMessages();

        console.log('✅ Contenedor del chatbot creado');

        // Inicializar avatar 3D
        setTimeout(() => {
            this.initializeAvatar3D();
        }, 500);
    }

    renderMessages() {
        const messagesContainer = document.getElementById('chat-messages');
        if (!messagesContainer) return;

        messagesContainer.innerHTML = ''; // Limpiar si ya había algo

        this.messages.forEach(msg => {
            // Usa la lógica de addMessage, pero solo para crear el DOM
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${msg.sender}`;

            // Permite que el contenido sea HTML si el remitente es 'bot' (para enlaces)
            messageDiv.innerHTML = `<p>${msg.text}</p>`;

            messagesContainer.appendChild(messageDiv);
        });

        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    async initializeAvatar3D() {
        try {
            console.log('🔄 Inicializando Avatar 3D...');

            // Obtener idioma actual
            const initialLanguage = (document.documentElement.lang || 'es').split('-')[0];
            console.log(`🌍 Idioma inicial para avatar (constructor): ${initialLanguage}`);

            // Crear instancia del avatar 3D con idioma inicial
            this.avatar3D = new Avatar3DThreeJS('holograma-container', initialLanguage);

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

        const chatContainer = document.getElementById('chatbot-container');

        if (chatContainer) {
            // 💡 SOLUCIÓN: Buscar el botón de cerrar DENTRO del contenedor
            const closeBtn = chatContainer.querySelector('.close-chat');

            if (closeBtn) {
                closeBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.closeChat();
                });
                console.log('✅ Event listener de cerrar añadido directamente al botón.');
            } else {
                // Fallback a la lógica de delegación que ya tenías (puede que necesite ser el primer elemento del código, pero esta es la mejor práctica)
                document.addEventListener('click', (e) => {
                    if (e.target.classList.contains('close-chat')) {
                        e.preventDefault();
                        this.closeChat();
                    }
                });
                console.warn('⚠️ Botón de cerrar no encontrado al configurar, usando delegación de documento.');
            }
        }

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

        window.addEventListener('beforeunload', () => {
            if (this.isTalking) {
                this.detenerHabla();
                console.log('🔇 Audio detenido automáticamente al inicio de la navegación.');
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
        this.saveChatState();
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
        this.saveChatState();
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

        this.saveChatState();
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

    configurarVozPorIdioma(utterance) {
        // 1. Obtener el idioma actual
        let idiomaActual = document.documentElement.lang || 'es';

        // 2. Configurar parámetros base según idioma
        const configPorIdioma = {
            'es': { rate: 0.9, pitch: 0.8, volume: 1.0 },
            'en': { rate: 1.0, pitch: 0.9, volume: 1.0 },
            'fr': { rate: 0.95, pitch: 1.0, volume: 1.0 }, // Pitch más alto para voz femenina
            'de': { rate: 0.95, pitch: 1.0, volume: 1.0 }  // Pitch más alto para voz femenina
        };

        const idiomaBase = idiomaActual.split('-')[0];
        const config = configPorIdioma[idiomaBase] || configPorIdioma.es;

        utterance.rate = config.rate;
        utterance.pitch = config.pitch;
        utterance.volume = config.volume;
        utterance.lang = idiomaActual;

        // 3. Buscar voces según idioma
        if ('speechSynthesis' in window && this.vozHombreCargada) {
            const voces = speechSynthesis.getVoices();

            if (voces.length > 0) {
                let vozSeleccionada = null;
                let preferenciasFemeninas = ['female', 'woman', 'femenina', 'mujer', 'femme', 'frau'];

                // Configuración específica por idioma
                switch(idiomaBase) {
                    case 'fr':
                    case 'de':
                        // Para francés y alemán, buscar voces femeninas
                        vozSeleccionada = voces.find(v =>
                            v.lang.startsWith(idiomaBase) &&
                            preferenciasFemeninas.some(term =>
                                v.name.toLowerCase().includes(term)
                            )
                        );
                        break;
                    case 'es':
                    case 'en':

                        // Para español e inglés, buscar voces masculinas
                        const preferenciasMasculinas = ['male', 'hombre', 'masculino', 'man','jorge','pablo'];
                        vozSeleccionada = voces.find(v =>
                            v.lang.startsWith(idiomaBase) &&
                            preferenciasMasculinas.some(term =>
                                v.name.toLowerCase().includes(term)
                            )
                        );
                        break;
                }

                // Si no encontramos voz específica, buscar cualquier voz del idioma
                if (!vozSeleccionada) {
                    vozSeleccionada = voces.find(v => v.lang.startsWith(idiomaBase));
                }

                // Si aún no, usar la primera voz disponible
                if (vozSeleccionada) {
                    utterance.voice = vozSeleccionada;
                    console.log(`✅ Voz configurada para ${idiomaActual}:`, vozSeleccionada.name);
                    return true;
                }
            }
        }

        return false;
    }

    async hablarTexto(texto) {
        if (!texto.trim()) return;

        // 1. Obtener el idioma actual
        let idiomaActual = document.documentElement.lang || 'es-ES';
        let idiomaBase = idiomaActual.split('-')[0];
        console.log(`🌍 Idioma actual para voz: ${idiomaActual}`);

        let needsAvatarChange = false;
        if (this.avatar3D && this.avatar3D.currentLanguage !== idiomaBase) {
            console.log(`🔄 Cambiando avatar al idioma detectado: ${idiomaActual}`);
            needsAvatarChange=true;

            try {
                await this.avatar3D.changeAvatar(idiomaBase);
                console.log(`✅ Modelo del avatar ${idiomaBase} cargado y listo.`);
            } catch (error) {
                console.error('❌ Error fatal al cargar el nuevo modelo de avatar:', error);
                return;
            }
        }
        // 2. Detener la voz anterior y limpiar estado
        if (this.isTalking) {
            this.detenerHabla();
        }

        this.isTalking = true;
        console.log(`🗣️ Preparando para hablar en ${idiomaActual}:`, texto);

        // 3. Iniciar animación del avatar (para todos los idiomas)
        if (this.avatar3D) {
            this.avatar3D.startSpeaking();
        }

        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(texto);

            // 4. Configurar voz según idioma
            const vozConfigurada = this.configurarVozPorIdioma(utterance);

            // 5. Si no se configuró voz, establecer parámetros por defecto
            if (!vozConfigurada) {
                const configPorIdioma = {
                    'es': { rate: 0.9, pitch: 0.8, volume: 1.0 },
                    'en': { rate: 1.0, pitch: 0.9, volume: 1.0 },
                    'fr': { rate: 0.95, pitch: 0.85, volume: 1.0 },
                    'de': { rate: 0.95, pitch: 0.85, volume: 1.0 }
                };

                const idiomaBase = idiomaActual.split('-')[0];
                const config = configPorIdioma.idiomaBase || configPorIdioma.es;

                utterance.rate = config.rate;
                utterance.pitch = config.pitch;
                utterance.volume = config.volume;
                utterance.lang = idiomaActual;
            }

            // 6. Manejar eventos de finalización y error
            utterance.onend = () => {
                console.log(`✅ Voz completada en ${idiomaActual}`);
                this.detenerHabla();
            };

            utterance.onerror = (e) => {
                console.error(`❌ Error en voz (${idiomaActual}):`, e.error);

                if (e.error !== 'interrupted' && e.error !== 'canceled') {
                    console.log('⚠️ Error no controlado. Deteniendo habla...');
                    this.detenerHabla();
                } else {
                    console.log('📢 Interrupción detectada, nuevo mensaje toma control.');
                }
            };

            // 7. Iniciar reproducción
            speechSynthesis.speak(utterance);

        } else {
            // Fallback sin síntesis de voz
            console.log('⚠️ SpeechSynthesis no soportado, usando fallback');
            const duracionEstimada = texto.length * 80 + 500;

            setTimeout(() => {
                this.detenerHabla();
            }, duracionEstimada);
        }
    }

    detenerHabla(){
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

        // Obtener idioma actual (se mantiene la lógica de tu código original)
        let idiomaActual = document.documentElement.lang || 'es-ES';
        let idiomaBase = idiomaActual.split('-')[0];

        // --- OBJETO DE RESPUESTAS CON LÓGICA DE FORMATO Y ENLACES ---
        const respuestasAlquiler = {
    'es': {
        // General y contextual
        default: "Estoy en la sección de alquiler. Para ayudarte, ¿buscas un modelo concreto o quieres saber precio por día y kilómetros incluidos?",
        modeloInfo: (modelo, precioDia, kms) =>
            `El ${modelo} es uno de nuestros modelos destacados en alquiler, desde ${precioDia} con un máximo de ${kms} incluidos. ¿Quieres ver las condiciones completas o hacer una reserva?`,
        detalles: "Para ver equipamiento, política de combustible, fianza y otros detalles, haz clic en el botón 'Ver Detalles' debajo del coche que te interese. Si quieres, puedo ayudarte a comparar varios modelos.",
        condiciones: "En nuestros alquileres se incluye un número máximo de kilómetros, seguro básico y asistencia en carretera. Puedes añadir kilómetros extra o coberturas adicionales con un coste por día. Si lo deseas, también puedo ayudarte a iniciar la reserva de este modelo.",

        // Reorientación a otras secciones
        comprar: "Si prefieres comprar en lugar de alquilar, te llevo a la sección de Compra.",
        mantenimiento: "Si necesitas mantenimiento de tu vehículo, te llevo a la sección de Mantenimiento.",

        // Mensajes genéricos
        precio: "El precio por día aparece debajo de cada vehículo, junto con los kilómetros incluidos. ¿Quieres que te explique las condiciones de alguno en concreto o que te ayude a reservar?",
        hola: "¡Hola! Estás en la sección de Mejores Ofertas de Alquiler. ¿Te ayudo a elegir coche, a entender el precio por día o los kilómetros incluidos?",
        horario: "Nuestro horario de atención es de lunes a viernes de 9:00 a 19:00 y sábados de 10:00 a 14:00.",
        contacto: "Puedes contactarnos al +34 456 789 042 o por email a CastillaMotors@uclm.es.",
        gracias: "¡De nada! Estoy aquí para ayudarte con tu alquiler. ¿Necesitas algo más?",

        // Modelos (nombre, precio/día, info km)
        modelos: {
            peugeot: ['Peugeot 5008', '50€ / día', '10.000 km'],
            toyota: ['Toyota Fortuner', '45€ / día', '15.000 km'],
            mercedes: ['Mercedes-Benz CLS AMG', '60€ / día', 'kilometraje limitado y seguro premium'],
            bmw: ['BMW Alpina B7', '90€ / día', '8.000 km'],
            audi: ['Audi Q2 S-Line', '30€ / día', '12.000 km'],
            lexus: ['Lexus RX500h F Sport', '65€ / día', '80.000 km']
        },

        // Enlaces de cambio de sección
        enlacePregunta: "¿Quieres ir a la sección de [Seccion]?",
        enlaces: {
            comprar: 'comprar.html',
            mantenimiento: 'mantenimiento.html'
        },
        secciones: {
            comprar: 'Compra',
            mantenimiento: 'Mantenimiento'
        },

        // Opciones de fallback
        opciones: [
            "• Ver modelos disponibles",
            "• Consultar precio por día",
            "• Ver kilómetros incluidos y seguro",
            "• Iniciar una reserva",
            "• Ir a la sección de Compra o Mantenimiento",
            "• Ver contacto y horario"
        ],
        textosNoEntendido: (userMessage) =>
            `Disculpa, no he entendido bien "${userMessage}".<br><br>` +`En esta sección de Alquiler puedo ayudarte con estas opciones:`
    },

    'en': {
        default: "You are in the rental section. Are you looking for a specific model or do you want to know the daily price and included mileage?",
        modeloInfo: (modelo, precioDia, kms) =>
            `The ${modelo} is one of our featured rental models, from ${precioDia} with ${kms} included. Would you like to see the full rental conditions or make a booking?`,
        detalles: "To see equipment, fuel policy, deposit and other details, click on the 'View Details' button under the car you are interested in. I can also help you compare different models.",
        condiciones: "Our rentals include a maximum mileage, basic insurance and roadside assistance. You can add extra mileage or additional coverage for an extra daily cost. If you want, I can also help you start a booking for this model.",

        comprar: "If you prefer to buy instead of renting, I can take you to the Purchase section.",
        mantenimiento: "If you need maintenance, I can take you to the Maintenance section.",

        precio: "Daily prices are shown below each vehicle, together with the included mileage. Would you like me to explain the conditions for a specific car or help you book it?",
        hola: "Hello! You are in the Best Rental Deals section. Shall I help you choose a car, understand the daily price or the included mileage?",
        horario: "Our business hours are Monday to Friday from 9:00 to 19:00 and Saturdays from 10:00 to 14:00.",
        contacto: "You can contact us at +34 456 789 042 or by email at CastillaMotors@uclm.es.",
        gracias: "You're welcome! Here to help with your rental. Anything else?",

        modelos: {
            peugeot: ['Peugeot 5008', '€50 / day', '10,000 km'],
            toyota: ['Toyota Fortuner', '€45 / day', '15,000 km'],
            mercedes: ['Mercedes-Benz CLS AMG', '€60 / day', 'limited mileage and premium insurance'],
            bmw: ['BMW Alpina B7', '€90 / day', '8,000 km'],
            audi: ['Audi Q2 S-Line', '€30 / day', '12,000 km'],
            lexus: ['Lexus RX500h F Sport', '€65 / day', '80,000 km']
        },

        enlacePregunta: "Do you want to go to the [Seccion] section?",
        enlaces: {
            comprar: 'comprar.html',
            mantenimiento: 'mantenimiento.html'
        },
        secciones: {
            comprar: 'Purchase',
            mantenimiento: 'Maintenance'
        },

        opciones: [
            "See available models",
            "Check the daily price",
            "Check included mileage and insurance",
            "Start a booking",
            "Go to the Purchase or Maintenance section",
            "See contact details and business hours"
        ],
        textosNoEntendido: (userMessage) =>
            `Sorry, "${userMessage}" was not clear. In this Rental section I can help you choose a model, see the daily price or understand the included mileage and conditions:`
    },

    'fr': {
        default: "Vous êtes dans la section Location. Cherchez-vous un modèle précis ou souhaitez-vous connaître le prix par jour et les kilomètres inclus ?",
        modeloInfo: (modelo, precioDia, kms) =>
            `La ${modelo} est l’un de nos modèles phares en location, à partir de ${precioDia} avec ${kms} inclus. Voulez-vous voir toutes les conditions de location ou effectuer une réservation ?`,
        detalles: "Pour voir l’équipement, la politique de carburant, la caution et d’autres détails, cliquez sur le bouton « Voir détails » sous la voiture qui vous intéresse. Je peux aussi vous aider à comparer plusieurs modèles.",
        condiciones: "Nos locations incluent un kilométrage maximum, une assurance de base et une assistance routière. Vous pouvez ajouter des kilomètres supplémentaires ou des couvertures additionnelles avec un coût journalier. Si vous le souhaitez, je peux également vous aider à commencer la réservation de ce modèle.",

        comprar: "Si vous préférez acheter plutôt que louer, je peux vous emmener à la section Achat.",
        mantenimiento: "Si vous avez besoin d’entretien, je peux vous emmener à la section Maintenance.",

        precio: "Le prix par jour apparaît sous chaque véhicule, avec les kilomètres inclus. Voulez-vous que je vous explique les conditions pour un modèle en particulier ou que je vous aide à le réserver ?",
        hola: "Bonjour ! Vous êtes dans la section Meilleures offres de location. Puis-je vous aider à choisir une voiture, comprendre le prix par jour ou les kilomètres inclus ?",
        horario: "Nos horaires d’ouverture sont du lundi au vendredi de 9h00 à 19h00 et le samedi de 10h00 à 14h00.",
        contacto: "Vous pouvez nous contacter au +34 456 789 042 ou par email à CastillaMotors@uclm.es.",
        gracias: "Avec plaisir ! Je suis là pour vous aider avec votre location. Autre chose ?",

        modelos: {
            peugeot: ['Peugeot 5008', '50€ / jour', '10 000 km'],
            toyota: ['Toyota Fortuner', '45€ / jour', '15 000 km'],
            mercedes: ['Mercedes-Benz CLS AMG', '60€ / jour', 'kilométrage limité et assurance premium'],
            bmw: ['BMW Alpina B7', '90€ / jour', '8 000 km'],
            audi: ['Audi Q2 S-Line', '30€ / jour', '12 000 km'],
            lexus: ['Lexus RX500h F Sport', '65€ / jour', '80 000 km']
        },

        enlacePregunta: "Voulez-vous aller à la section [Seccion] ?",
        enlaces: {
            comprar: 'comprar.html',
            mantenimiento: 'mantenimiento.html'
        },
        secciones: {
            comprar: 'Achat',
            mantenimiento: 'Maintenance'
        },

        opciones: [
            "Voir les modèles disponibles",
            "Consulter le prix par jour",
            "Voir le kilométrage inclus et l’assurance",
            "Commencer une réservation",
            "Aller à la section Achat ou Maintenance",
            "Voir le contact et les horaires d’ouverture"
        ],
        textosNoEntendido: (userMessage) =>
            `Désolé, je n’ai pas bien compris « ${userMessage} ». Dans cette section Location, je peux vous aider à choisir un modèle, voir le prix par jour ou expliquer le kilométrage inclus et les conditions :`
    },

    'de': {
        default: "Sie befinden sich im Mietbereich. Suchen Sie ein bestimmtes Modell oder möchten Sie den Tagespreis und die enthaltenen Kilometer wissen?",
        modeloInfo: (modelo, precioDia, kms) =>
            `Der ${modelo} gehört zu unseren Top-Mietfahrzeugen, ab ${precioDia} mit ${kms} inklusive. Möchten Sie die vollständigen Mietbedingungen sehen oder eine Reservierung vornehmen?`,
        detalles: "Um Ausstattung, Tankregelung, Kaution und weitere Details zu sehen, klicken Sie auf die Schaltfläche „Details anzeigen“ unter dem Fahrzeug, das Sie interessiert. Gern helfe ich Ihnen auch beim Vergleich mehrerer Modelle.",
        condiciones: "Unsere Mietwagen beinhalten eine maximale Kilometerzahl, eine Basisversicherung und Pannenhilfe. Sie können gegen einen täglichen Aufpreis zusätzliche Kilometer oder weitere Versicherungen hinzufügen. Wenn Sie möchten, kann ich Ihnen auch beim Start der Reservierung für dieses Modell helfen.",

        comprar: "Wenn Sie lieber kaufen statt mieten möchten, kann ich Sie in den Kaufbereich bringen.",
        mantenimiento: "Wenn Sie Wartung benötigen, kann ich Sie in den Wartungsbereich bringen.",

        precio: "Der Tagespreis wird unter jedem Fahrzeug zusammen mit den enthaltenen Kilometern angezeigt. Möchten Sie, dass ich Ihnen die Bedingungen für ein bestimmtes Auto erkläre oder bei der Reservierung helfe?",
        hola: "Hallo! Sie sind im Bereich Beste Mietangebote. Soll ich Ihnen helfen, ein Auto auszuwählen, den Tagespreis zu verstehen oder die enthaltenen Kilometer zu klären?",
        horario: "Unsere Öffnungszeiten sind Montag bis Freitag von 9:00 bis 19:00 Uhr und Samstag von 10:00 bis 14:00 Uhr.",
        contacto: "Sie erreichen uns unter +34 456 789 042 oder per E‑Mail an CastillaMotors@uclm.es.",
        gracias: "Gern geschehen! Ich helfe Ihnen gern bei Ihrer Miete. Benötigen Sie noch etwas?",

        modelos: {
            peugeot: ['Peugeot 5008', '50€ / Tag', '10.000 km'],
            toyota: ['Toyota Fortuner', '45€ / Tag', '15.000 km'],
            mercedes: ['Mercedes-Benz CLS AMG', '60€ / Tag', 'begrenzte Kilometer und Premium-Versicherung'],
            bmw: ['BMW Alpina B7', '90€ / Tag', '8.000 km'],
            audi: ['Audi Q2 S-Line', '30€ / Tag', '12.000 km'],
            lexus: ['Lexus RX500h F Sport', '65€ / Tag', '80.000 km']
        },

        enlacePregunta: "Möchten Sie zum Bereich [Seccion] gehen?",
        enlaces: {
            comprar: 'comprar.html',
            mantenimiento: 'mantenimiento.html'
        },
        secciones: {
            comprar: 'Kauf',
            mantenimiento: 'Wartung'
        },

        opciones: [
            "Verfügbare Modelle anzeigen",
            "Tagespreis prüfen",
            "Enthaltene Kilometer und Versicherung prüfen",
            "Eine Reservierung starten",
            "Zum Kauf- oder Wartungsbereich wechseln",
            "Kontakt und Öffnungszeiten anzeigen"
        ],
        textosNoEntendido: (userMessage) =>
            `Entschuldigung, "${userMessage}" habe ich nicht ganz verstanden. In diesem Mietbereich kann ich Ihnen helfen, ein Modell auszuwählen, den Tagespreis zu sehen oder die enthaltenen Kilometer und Bedingungen zu erklären:`
    }
};



    const respuestasIdioma = respuestasAlquiler[idiomaBase] || respuestasAlquiler['es'];
    let response = respuestasIdioma.default;
    let keywordMatch = '';
    const userMsgLower = userMessage.toLowerCase();

    // 1. Detección de modelo
    let modeloEncontrado = null;
    for (const key in respuestasIdioma.modelos) {
        if (userMsgLower.includes(key)) {
            modeloEncontrado = respuestasIdioma.modelos[key];
            break;
        }
    }

    if (modeloEncontrado) {
        // Ej.: "Quiero alquilar el Peugeot 5008..."
        response = respuestasIdioma.modeloInfo(
            modeloEncontrado[0],
            modeloEncontrado[1],
            modeloEncontrado[2]
        );
        keywordMatch = 'modelo';
        this.lastQuestionType = 'condicionesModelo';

    } else if (
        // Respuesta tipo "sí" / "yes" justo después de preguntar por condiciones
        this.lastQuestionType === 'condicionesModelo' &&
        (
            userMsgLower === 'si' || userMsgLower === 'sí' ||
            userMsgLower === 'yes' || userMsgLower === 'oui' ||
            userMsgLower === 'ja' ||
            userMsgLower.includes('condiciones completas') ||
            userMsgLower.includes('ver condiciones') ||
            userMsgLower.includes('todas las condiciones') ||
            userMsgLower.includes('see full conditions') ||
            userMsgLower.includes('see all conditions') ||
            userMsgLower.includes('voir toutes les conditions') ||
            userMsgLower.includes('alle bedingungen')
        )
    ) {
        response = respuestasIdioma.condiciones;
        this.lastQuestionType = null;

    } else if (
        // Ver ficha técnica / ficha web
        userMsgLower.includes('detalles') ||
        userMsgLower.includes('ver detalles') ||
        userMsgLower.includes('details') ||
        userMsgLower.includes('see details') ||
        userMsgLower.includes('más info') ||
        userMsgLower.includes('more info') ||
        userMsgLower.includes('spécifications') ||
        userMsgLower.includes('détails') ||
        userMsgLower.includes('details anzeigen')
    ) {
        response = respuestasIdioma.detalles;

    } else if (
        // Condiciones en general
        userMsgLower.includes('condiciones') ||
        userMsgLower.includes('términos') ||
        userMsgLower.includes('terms') ||
        userMsgLower.includes('conditions') ||
        userMsgLower.includes('política') ||
        userMsgLower.includes('policy')
    ) {
        response = respuestasIdioma.condiciones;

    } else if (
        // Cambiar a sección de compra
        userMsgLower.includes('comprar') ||
        userMsgLower.includes('compra') ||
        userMsgLower.includes('buy') ||
        userMsgLower.includes('purchase') ||
        userMsgLower.includes('acheter') ||
        userMsgLower.includes('kaufen')
    ) {
        response = respuestasIdioma.comprar;
        keywordMatch = 'comprar';

    } else if (
        // Ir a mantenimiento
        userMsgLower.includes('mantenimiento') ||
        userMsgLower.includes('maintenance') ||
        userMsgLower.includes('entretien') ||
        userMsgLower.includes('wartung') ||
        userMsgLower.includes('revisión')
    ) {
        response = respuestasIdioma.mantenimiento;
        keywordMatch = 'mantenimiento';

    } else if (
        // Preguntas de precio
        userMsgLower.includes('precio') ||
        userMsgLower.includes('cuánto cuesta') ||
        userMsgLower.includes('cuanto cuesta') ||
        userMsgLower.includes('price') ||
        userMsgLower.includes('how much') ||
        userMsgLower.includes('prix') ||
        userMsgLower.includes('combien') ||
        userMsgLower.includes('kosten') ||
        userMsgLower.includes('preis')
    ) {
        response = respuestasIdioma.precio;

    } else if (
        // Saludos
        userMsgLower.includes('hola') ||
        userMsgLower.includes('buenas') ||
        userMsgLower.includes('hello') ||
        userMsgLower.includes('hi ') ||
        userMsgLower === 'hi' ||
        userMsgLower.includes('bonjour') ||
        userMsgLower.includes('hallo')
    ) {
        response = respuestasIdioma.hola;

    } else if (
        // Horario
        userMsgLower.includes('horario') ||
        userMsgLower.includes('abierto') ||
        userMsgLower.includes('hours') ||
        userMsgLower.includes('opening') ||
        userMsgLower.includes('heure') ||
        userMsgLower.includes('ouvert') ||
        userMsgLower.includes('öffnungszeiten')
    ) {
        response = respuestasIdioma.horario;

    } else if (
        // Contacto
        userMsgLower.includes('contacto') ||
        userMsgLower.includes('teléfono') ||
        userMsgLower.includes('telefono') ||
        userMsgLower.includes('llamar') ||
        userMsgLower.includes('contact') ||
        userMsgLower.includes('phone') ||
        userMsgLower.includes('call') ||
        userMsgLower.includes('téléphone') ||
        userMsgLower.includes('telefon')
    ) {
        response = respuestasIdioma.contacto;

    } else if (
        // Agradecimientos
        userMsgLower.includes('gracias') ||
        userMsgLower.includes('thank you') ||
        userMsgLower.includes('thanks') ||
        userMsgLower.includes('merci') ||
        userMsgLower.includes('danke')
    ) {
        response = respuestasIdioma.gracias;

    } else {
        // Fallback genérico
        const opciones = respuestasIdioma.opciones;
        const textoNoEntendido = respuestasIdioma.textosNoEntendido(userMessage);
        const listaOpciones = opciones
        .map(op => `${op}`)
        .join('<br>');
        response = `${textoNoEntendido}<br><br>${listaOpciones}`;
    }

    // Enlaces condicionales para cambiar de sección (igual que en compra)
    if (
        (keywordMatch === 'comprar' || keywordMatch === 'mantenimiento') &&
        respuestasIdioma.enlaces &&
        respuestasIdioma.enlaces[keywordMatch]
    ) {
        const linkHTML = respuestasIdioma.enlaces[keywordMatch];
        const sectionName = respuestasIdioma.secciones[keywordMatch];
        const enlaceTexto = respuestasIdioma.enlacePregunta.replace('[Seccion]', sectionName);
        const clickHandler = `sessionStorage.setItem('chatbotOpenOnLoad', 'true');`;

        const enlaceFinal = `\n\n<a href="${linkHTML}"
            onclick="${clickHandler}"
            style="font-weight: bold; text-decoration: underline;">
            ${enlaceTexto}
        </a>`;

        response += enlaceFinal;
    }

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
