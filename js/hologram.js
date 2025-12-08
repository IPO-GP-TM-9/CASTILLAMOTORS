// Importamos la librería directamente desde el CDN
import { TalkingHead } from "https://cdn.jsdelivr.net/gh/met4citizen/TalkingHead@1.1/modules/talkinghead.mjs";

console.log("hologram.js cargado correctamente");

// VERIFICACIÓN DE SEGURIDAD
if (window.location.protocol === 'file:') {
    alert("⚠️ IMPORTANTE ⚠️\n\nEl holograma no puede funcionar abriendo el archivo directamente.\n\nPor seguridad, los navegadores bloquean estos scripts.\n\nSOLUCIÓN: Usa 'Live Server' en VS Code o sube la web a un hosting.");
}

document.addEventListener('DOMContentLoaded', async function() {
    console.log("Holograma: Inicializando script...");

    // 1. INYECTAR ESTILOS CSS
    const style = document.createElement('style');
    style.innerHTML = `
        #avatar-container {
            position: fixed;
            bottom: 100px;
            right: 20px;
            width: 300px;
            height: 400px;
            z-index: 9999;
            display: none;
            background: rgba(0, 0, 0, 0.6);
            border-radius: 15px;
            overflow: hidden;
            box-shadow: 0 0 20px rgba(0, 255, 255, 0.5);
            backdrop-filter: blur(5px);
            transition: all 0.3s ease;
        }
        #avatar-container.activo {
            display: block;
            animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        #loading-msg {
            position: absolute;
            top: 50%; left: 50%;
            transform: translate(-50%, -50%);
            color: white;
            text-align: center;
            font-family: sans-serif;
        }
        @keyframes popIn {
            from { opacity: 0; transform: translateY(20px) scale(0.8); }
            to { opacity: 1; transform: translateY(0) scale(1); }
        }
    `;
    document.head.appendChild(style);

    // 2. CREAR EL CONTENEDOR DEL AVATAR
    let container = document.getElementById('avatar-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'avatar-container';
        container.innerHTML = '<div id="loading-msg">Cargando Asistente...<br>⏳</div>';
        document.body.appendChild(container);
    }

    // 3. VARIABLES Y FUNCIONES
    let head;

    // Hacer la función global para que se pueda llamar desde cualquier lado
    window.hologramaHablar = function(texto) {
        if (!head) return;
        try {
            head.speakText(texto);
        } catch(e) {
            console.warn("Fallo en TTS online, usando voz del navegador");
            const utterance = new SpeechSynthesisUtterance(texto);
            utterance.lang = 'es-ES';
            speechSynthesis.speak(utterance);
        }
    };

    async function cargarYMostrarAvatar() {
        if (container.classList.contains('activo')) {
            container.classList.remove('activo');
            if (head) head.stop();
            return;
        }

        container.classList.add('activo');

        if (head) {
            hologramaHablar("Aquí estoy otra vez.");
            return;
        }

        try {
            head = new TalkingHead(container, {
                ttsEndpoint: "https://eu-texttospeech.googleapis.com/v1beta1/text:synthesize",
                cameraView: "upper",
                lipsyncLang: 'es'
            });

            await head.showAvatar({
                url: 'https://models.readyplayer.me/64bfa15f0e72c63d7c3934a6.glb?morphTargets=ARKit&textureAtlas=1024',
                body: 'M',
                avatarMood: 'neutral',
                ttsLang: "es-ES",
                ttsVoice: "es-ES-Standard-A"
            });

            const loader = document.getElementById('loading-msg');
            if(loader) loader.style.display = 'none';

            hologramaHablar("Hola, bienvenido a Castilla Motors. ¿En qué puedo ayudarte?");

        } catch (error) {
            console.error("Error al cargar avatar:", error);
            container.innerHTML = "<p style='color:red; padding:20px'>Error al cargar. Verifica tu conexión o abre esto en un servidor local.</p>";
        }
    }

    // 4. VINCULAR AL BOTÓN
    // Usamos delegación de eventos en el body para asegurar que capturamos el click incluso si el botón se carga tarde
    document.body.addEventListener('click', function(e) {
        // Buscamos si el click fue en el botón o dentro del botón (por el icono)
        const btn = e.target.closest('#chatbot-toggle');

        if (btn) {
            console.log("Click en chatbot detectado");
            e.preventDefault();
            cargarYMostrarAvatar();
        }
    });
});
