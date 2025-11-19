/* Contenido completo para js/custom.js (CON INTERACCIÓN EN BOTÓN SELECCIONAR) */

$(document).ready(function() {

    // --- CÓDIGO ORIGINAL (Navbar Affix) ---
    $('#siteNav').affix({
        offset: { top: 100 }
    });

    // --- FUNCIONES GENÉRICAS ---
    function pausarMedia(media) {
        if (media && typeof media.pause === 'function') {
            media.pause();
            media.currentTime = 0;
        }
    }

    function reproducirMedia(media) {
        if (media && typeof media.play === 'function') {
            var playPromise = media.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.warn("Autoplay bloqueado o interrumpido:", error);
                });
            }
        }
    }

    // --- LÓGICA PARA "PASO 0" (Audio Bienvenida) ---
    const audio0 = $('#audioBienvenida').get(0);
    if (audio0) {
        reproducirMedia(audio0);
        $('#btn-empezar-compra').on('click', function() {
            pausarMedia(audio0);
        });
    }

    // --- LÓGICA DE AYUDA CONTEXTUAL (PASO A PASO) ---
    const urlParams = new URLSearchParams(window.location.search);
    const tieneAyuda = urlParams.get('ayuda') === 'true';

    if (tieneAyuda) {

        // CONFIGURACIÓN DE DATOS
        const pasosGuia = [
            {
                texto: "A tu izquierda puedes interactuar con el modelado 3D del coche que has seleccionado, para ver cada mínimo detalle.",
                audio: "audio/audio2.mp3"
            },
            {
                texto: "A la derecha del modelo 3D tenemos las principales características del coche seleccionado.",
                audio: "audio/audio3.mp3"
            },
            {
                texto: "También podemos leer una breve descripción del coche seleccionado, situada en la parte inferior.",
                audio: "audio/audio4.mp3"
            },
            {
                // --- PASO CRÍTICO: Aquí esperamos que el usuario pulse el botón de la web ---
                texto: "Si decide añadirlo para la compra, debe pinchar en el botón de seleccionar a su derecha.",
                audio: "audio/audio5.mp3",
                esperarAccion: true // <--- MARCA: Esperar clic externo
            },
            {
                // Este paso salta automáticamente al pulsar "Seleccionar"
                texto: "Genial! Sigamos con el proceso de comprar, volvemos al catalogo.",
                audio: "audio/audio6.mp3"
            }
        ];

        // VARIABLES DE CONTROL
        let pasoActualIndex = 0;
        let audioGuiaActual = null;

        // FUNCIÓN PRINCIPAL DE CARGA
        function cargarPaso(indice) {
            // 1. LIMPIEZA DE AUDIO PREVIO
            if (audioGuiaActual !== null) {
                audioGuiaActual.pause();
                audioGuiaActual.currentTime = 0;
                audioGuiaActual = null;
            }

            const paso = pasosGuia[indice];

            // 2. Actualizar Texto
            $('#contenido-ayuda').text(paso.texto);

            // 3. Crear y reproducir audio
            audioGuiaActual = new Audio(paso.audio);
            reproducirMedia(audioGuiaActual);

            // 4. GESTIÓN DE BOTONES (Lógica Nueva)

            // CASO A: El paso requiere interacción con el botón "Seleccionar"
            if (paso.esperarAccion === true) {

                // Ocultamos el botón siguiente de la caja flotante
                $('#btn-siguiente-ayuda').hide();

                // Escuchamos el clic en el botón ROJO de la web (#btn-seleccionar)
                // .off() limpia clics anteriores para seguridad
                // .one() asegura que el evento se ejecute solo una vez
                $('#btn-seleccionar').off('click').one('click', function() {

                    // Avanzamos al siguiente paso (audio6)
                    pasoActualIndex++;
                    if (pasoActualIndex < pasosGuia.length) {
                        cargarPaso(pasoActualIndex);
                    }
                });
            }
            // CASO B: Es el último paso
            else if (indice >= pasosGuia.length - 1) {
                $('#btn-siguiente-ayuda').hide();
            }
            // CASO C: Paso normal
            else {
                $('#btn-siguiente-ayuda').show();
                // Por seguridad, quitamos la escucha del botón seleccionar si volvemos atrás
                $('#btn-seleccionar').off('click');
            }
        }

        // --- CREAR HTML DE LA CAJA ---
        // Nota: Mantenemos la estructura, pero recuerda que el CSS controla el tamaño
        const cajaAyudaHTML = `
            <div id="caja-ayuda-flotante">
                <span id="cerrar-ayuda" class="glyphicon glyphicon-remove" aria-label="Cerrar"></span>
                <strong>Guía Rápida</strong>
                <p id="contenido-ayuda"></p>

                <div class="caja-botones">
                    <button id="btn-siguiente-ayuda" class="btn btn-info">
                        Siguiente <span class="glyphicon glyphicon-chevron-right"></span>
                    </button>
                </div>
            </div>
        `;

        $('body').append(cajaAyudaHTML);

        // INICIAR PRIMER PASO
        setTimeout(function(){
            cargarPaso(0);
        }, 500);


        // --- EVENTOS CLICK DE LA CAJA FLOTANTE ---

        $('#btn-siguiente-ayuda').on('click', function() {
            pasoActualIndex++;
            if (pasoActualIndex < pasosGuia.length) {
                cargarPaso(pasoActualIndex);
            }
        });

        $('#cerrar-ayuda').on('click', function() {
            $('#caja-ayuda-flotante').remove();
            if (audioGuiaActual !== null) {
                audioGuiaActual.pause();
                audioGuiaActual = null;
            }
        });
    }
});
