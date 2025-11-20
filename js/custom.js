/* Contenido completo para js/custom.js */

$(document).ready(function() {

    // ==========================================
    // 1. CONFIGURACIÓN BÁSICA Y UTILIDADES
    // ==========================================
    $('#siteNav').affix({ offset: { top: 100 } });

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
                playPromise.catch(error => console.warn("Autoplay bloqueado:", error));
            }
        }
    }

    // --- AUDIO BIENVENIDA (General) ---
    const audio0 = $('#audioBienvenida').get(0);
    if (audio0) {
        reproducirMedia(audio0);
        $('#btn-empezar-compra').on('click', function() { pausarMedia(audio0); });
    }

    // ==========================================
    // 2. LÓGICA DE AYUDA INTELIGENTE
    // ==========================================
    const urlParams = new URLSearchParams(window.location.search);
    const tieneAyuda = urlParams.get('ayuda') === 'true';

    if (tieneAyuda) {
        const urlActual = window.location.href;

        // --- A. GESTIÓN DE ENLACES (Mantiene la ayuda activa) ---
        // Detectamos si estamos en la sección "alquilar" o "comprar" para dirigir los botones correctamente

        if (urlActual.indexOf("alquilar") > -1) {
            // Estamos en proceso de ALQUILER
            $('#btn-volver-catalogo').attr('href', 'alquilar.html?ayuda=true');
            $('#btn-confirmar-modal').attr('href', 'realizar-alquiler.html?ayuda=true');
        } else {
            // Estamos en proceso de COMPRA (Por defecto)
            $('#btn-volver-catalogo').attr('href', 'comprar.html?ayuda=true');
            $('#btn-confirmar-modal').attr('href', 'realizar-compra.html?ayuda=true');
        }

        // --- B. DEFINICIÓN DE PASOS (DATOS) ---

        // >>> TUTORIALES DE COMPRA <<<
        const guiaFichaCompra = [
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
                texto: "Si decide añadirlo para la compra, debe pinchar en el botón de seleccionar a la derecha del modelo 3D.",
                audio: "audio/audio5.mp3",
                esperarAccion: true,
                selectorAccion: "#btn-seleccionar"
            },
            {
                texto: "Genial! Sigamos con el proceso de comprar, volvemos al catalogo.",
                audio: "audio/audio6.mp3"
            }
        ];

        const guiaCatalogoCompra = [
            {
                texto: "Si desea realizar la compra de los coches seleccionados, pinchamos el botón de comprar seleccionados.",
                audio: "audio/audio7.mp3"
            }
        ];

        const guiaFormularioCompra = [
            {
                texto: "A continuación tienes que rellenar un formulario con los datos de nombre, apellidos, dirección y método de pago, para poder tener su información de la compra.",
                audio: "audio/audio8.mp3"
            },
            {
                texto: "Podemos clicar en el botón de confirmar compra para que tus datos y la compra sean tramitados.",
                audio: "audio/audio9.mp3"
            }
        ];

        // >>> TUTORIALES DE ALQUILER (Nuevos) <<<
        // NOTA: Asegúrate de crear los archivos de audio correspondientes o reutilizar los existentes
        const guiaFichaAlquiler = [
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
                texto: "Si decide añadirlo para el alquiler, debe pinchar en el botón de seleccionar a la derecha del modelo 3D.",
                audio: "audio/audio11.mp3",
                esperarAccion: true,
                selectorAccion: "#btn-seleccionar"
            },
            {
                texto: "Genial! Sigamos con el proceso de alquilar, volvemos al catalogo.",
                audio: "audio/audio12.mp3"
            }
        ];

        const guiaCatalogoAlquiler = [
            {
                texto: "Si desea realizar el alquiler de los coches seleccionados, pinchamos el botón de alquilar seleccionados.",
                audio: "audio/audio13.mp3"
            }
        ];

        const guiaFormularioAlquiler = [
            {
                texto: "A continuación tienes que rellenar las fechas en que deseas el alquiler del vehículo y un formulario con los datos de nombre, apellidos, dirección y método de pago, para poder tener su información del alquiler.",
                audio: "audio/audio14.mp3"
            },
            {
                texto: "Podemos clicar en el botón de confirmar alquiler para que tus datos y el alquiler sean tramitados.",
                audio: "audio/audio15.mp3"
            }
        ];


        // --- C. ENRUTADOR (ROUTER) ---
        // Decide qué guía cargar según la URL actual

        // 1. Rutas de COMPRA
        if (urlActual.indexOf("video-comprar.html") > -1 || urlActual.indexOf("comprar1.html") > -1) {
            iniciarMotorTutorial(guiaFichaCompra);
        }
        else if (urlActual.indexOf("comprar.html") > -1) {
            iniciarMotorTutorial(guiaCatalogoCompra);
        }
        else if (urlActual.indexOf("realizar-compra.html") > -1) {
            iniciarMotorTutorial(guiaFormularioCompra);
        }

        // 2. Rutas de ALQUILER
        else if (urlActual.indexOf("video-alquilar.html") > -1 || urlActual.indexOf("alquilar1.html") > -1) {
            iniciarMotorTutorial(guiaFichaAlquiler);
        }
        else if (urlActual.indexOf("alquilar.html") > -1) {
            iniciarMotorTutorial(guiaCatalogoAlquiler);
        }
        else if (urlActual.indexOf("realizar-alquiler.html") > -1) {
            iniciarMotorTutorial(guiaFormularioAlquiler);
        }


        // --- D. MOTOR DEL TUTORIAL (Lógica) ---
        function iniciarMotorTutorial(pasosGuia) {
            if (!pasosGuia || pasosGuia.length === 0) return;

            let pasoActualIndex = 0;
            let audioGuiaActual = null;

            // Inyectar HTML de la caja
            $('body').append(`
                <div id="caja-ayuda-flotante">
                    <span id="cerrar-ayuda" class="glyphicon glyphicon-remove"></span>
                    <strong>Guía Rápida</strong>
                    <p id="contenido-ayuda"></p>
                    <div class="caja-botones">
                        <button id="btn-siguiente-ayuda" class="btn btn-info">Siguiente <span class="glyphicon glyphicon-chevron-right"></span></button>
                    </div>
                </div>
            `);

            function cargarPaso(indice) {
                // Limpiar audio anterior
                if (audioGuiaActual !== null) {
                    audioGuiaActual.pause();
                    audioGuiaActual.currentTime = 0;
                    audioGuiaActual = null;
                }

                const paso = pasosGuia[indice];
                $('#contenido-ayuda').text(paso.texto);

                // Crear y reproducir nuevo audio
                audioGuiaActual = new Audio(paso.audio);
                reproducirMedia(audioGuiaActual);

                const btnSiguiente = $('#btn-siguiente-ayuda');

                // Limpiar eventos previos
                if (paso.selectorAccion) $(paso.selectorAccion).off('click.guia');

                // Lógica de avance (Botón vs Acción usuario)
                if (paso.esperarAccion === true && paso.selectorAccion) {
                    btnSiguiente.hide(); // Ocultamos botón "Siguiente"

                    // Esperamos a que el usuario haga clic en el elemento indicado
                    $(paso.selectorAccion).one('click.guia', function() {
                        pasoActualIndex++;
                        if (pasoActualIndex < pasosGuia.length) cargarPaso(pasoActualIndex);
                    });
                } else {
                    // Mostrar u ocultar botón "Siguiente" según si es el final
                    if (indice >= pasosGuia.length - 1) {
                        btnSiguiente.hide();
                    } else {
                        btnSiguiente.show();
                    }
                }
            }

            // Iniciar primer paso con un pequeño retardo
            setTimeout(() => cargarPaso(0), 500);

            // Eventos de la caja flotante
            $('#btn-siguiente-ayuda').on('click', () => {
                pasoActualIndex++;
                if (pasoActualIndex < pasosGuia.length) cargarPaso(pasoActualIndex);
            });

            $('#cerrar-ayuda').on('click', () => {
                $('#caja-ayuda-flotante').remove();
                if (audioGuiaActual) audioGuiaActual.pause();
                $(document).off('click.guia');
            });
        }
    }
});
