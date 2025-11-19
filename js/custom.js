/* Contenido completo para js/custom.js */

$(document).ready(function() {

    // --- CONFIGURACIÓN BÁSICA ---
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

    // --- AUDIO BIENVENIDA ---
    const audio0 = $('#audioBienvenida').get(0);
    if (audio0) {
        reproducirMedia(audio0);
        $('#btn-empezar-compra').on('click', function() { pausarMedia(audio0); });
    }

    // --- LÓGICA INTELIGENTE DE AYUDA ---
    const urlParams = new URLSearchParams(window.location.search);
    const tieneAyuda = urlParams.get('ayuda') === 'true';

    if (tieneAyuda) {

        // 1. GESTIÓN DE ENLACES (Mantiene la ayuda activa al cambiar de página)
        // Si estamos en modo ayuda, añadimos "?ayuda=true" a los botones de navegación

        // En la ficha del coche: Botón "Volver al Catálogo"
        $('#btn-volver-catalogo').attr('href', 'comprar.html?ayuda=true');

        // En el catálogo: Botón "Confirmar" del Modal
        $('#btn-confirmar-modal').attr('href', 'realizar-compra.html?ayuda=true');


        // 2. SELECCIÓN DE CONTENIDO SEGÚN PÁGINA
        let pasosGuia = [];
        const urlActual = window.location.href;

        // --- CASO A: FICHA DEL COCHE (Tus textos originales restaurados) ---
        if (urlActual.indexOf("video-comprar.html") > -1 || urlActual.indexOf("comprar1.html") > -1) {
            pasosGuia = [
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
                    // Interacción: Clic en botón rojo "Seleccionar"
                    texto: "Si decide añadirlo para la compra, debe pinchar en el botón de seleccionar a su derecha.",
                    audio: "audio/audio5.mp3",
                    esperarAccion: true,
                    selectorAccion: "#btn-seleccionar"
                },
                {
                    texto: "Genial! Sigamos con el proceso de comprar, volvemos al catalogo.",
                    audio: "audio/audio6.mp3"
                    // Aquí el usuario pulsará manualmente "Volver al catálogo"
                }
            ];
        }

        // --- CASO B: CATÁLOGO (comprar.html) ---
        else if (urlActual.indexOf("comprar.html") > -1) {
            pasosGuia = [
                {
                    texto: "Si desea realizar la compra de los coches seleccionados , pinchamos el botón de comprar seleccionados.",
                    audio: "audio/audio7.mp3"
                }
            ];
        }

        // --- CASO C: FORMULARIO (realizar-compra.html) ---
        else if (urlActual.indexOf("realizar-compra.html") > -1) {
            pasosGuia = [
                {
                    texto: "A continuación tienes que rellenar un formulario con los datos de nombre, apellidos, dirección y método de pago , para poder tener su información de la compra.",
                    audio: "audio/audio8.mp3"
                },
                {
                    texto: "Podemos clicar en el botón de confirmar compra para que tus datos y la compra sean tramitados.",
                    audio: "audio/audio9.mp3"
                }
            ];
        }


        // 3. MOTOR DE LA GUÍA (Lógica común)
        if (pasosGuia.length === 0) return;

        let pasoActualIndex = 0;
        let audioGuiaActual = null;

        function cargarPaso(indice) {
            if (audioGuiaActual !== null) {
                audioGuiaActual.pause(); audioGuiaActual.currentTime = 0; audioGuiaActual = null;
            }

            const paso = pasosGuia[indice];
            $('#contenido-ayuda').text(paso.texto);
            audioGuiaActual = new Audio(paso.audio);
            reproducirMedia(audioGuiaActual);

            const btnSiguiente = $('#btn-siguiente-ayuda');
            if (paso.selectorAccion) $(paso.selectorAccion).off('click.guia');

            // Lógica de botones
            if (paso.esperarAccion === true && paso.selectorAccion) {
                btnSiguiente.hide(); // Ocultar botón azul

                // Esperar clic externo
                $(paso.selectorAccion).one('click.guia', function() {
                    pasoActualIndex++;
                    if (pasoActualIndex < pasosGuia.length) cargarPaso(pasoActualIndex);
                });
            } else if (indice >= pasosGuia.length - 1) {
                btnSiguiente.hide();
            } else {
                btnSiguiente.show();
            }
        }

        // HTML CAJA
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

        setTimeout(() => cargarPaso(0), 500);

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
});
