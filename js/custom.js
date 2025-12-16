$(document).ready(function() {
    // ==========================================
    // PARTE NUEVA: GENERAR CATÁLOGO (10 COCHES)
    // ==========================================
    // Esto se ejecuta primero para crear el HTML necesario

    const esAlquilar = window.location.pathname.includes("alquilar");
    const esComprar  = window.location.pathname.includes("comprar");

    function getIndexPorMatricula(matricula) {
        return catalogoCoches.findIndex(coche => coche.matricula === matricula);
    }

    window.getIndexPorMatricula = getIndexPorMatricula;

    const catalogoCoches = [
        {
            marca: "Peugeot",
            modelo: "5008",
            desc: "2.0 BlueHDi 180 CV, 10000 km.",
            preciocompra: "45.900",
            precioalquiler: "50",
            matricula: "1234ABC",
            img: "images/peugeot-5008.jpg",
            modelo_3d: "https://sketchfab.com/models/7aa26f63a1b641f889a6e03a8f557a82/embed?autostart=1&ui_controls=1&ui_infos=0&ui_annotations=0",
            desc_extensa: `
                <p>El Peugeot 5008 GT 2.0 BlueHDi 180 EAT8 (2021) es el tope de gama diésel, un SUV de 7 plazas enfocado en el rendimiento y los viajes largos. Equipaba el potente motor 2.0 BlueHDi de 180 CV y 400 Nm de par, gestionado por la suave caja de cambios automática EAT8 de 8 velocidades.</p>
                <p>El acabado "GT" lo distingue con una estética deportiva (techo bitono, faros Full LED, llantas de 19") y un interior lujoso con tapicería de Alcantara® y pantalla de 10 pulgadas.</p>`
        },
        {
            marca: "Toyota",
            modelo: "Fortuner",
            desc: "2.8D 204CV 4x4, 2021, 15.000 km.",
            preciocompra: "42.900",
            precioalquiler: "45",
            matricula: "1243ABC",
            img: "images/fortuner.webp",
            modelo_3d: "https://sketchfab.com/models/7c6a3dc9a04f45658d1289cfd20accd7/embed?autostart=1&ui_controls=1&ui_infos=0&ui_annotations=0",
            desc_extensa: `
                <p>El Toyota Fortuner 2021 es un verdadero todoterreno construido sobre un chasis de largueros, diseñado para soportar las condiciones más exigentes sin sacrificar el confort familiar. Este modelo cuenta con el renovado motor 2.8 litros turbodiésel que entrega 204 CV y 500 Nm de par, ideal para remolcar y conducción off-road.</p>
                <p>En su interior, ofrece capacidad para 7 pasajeros con asientos de cuero, sistema de infoentretenimiento compatible con Apple CarPlay/Android Auto y un robusto sistema de tracción 4x4 con reductora y bloqueo de diferencial trasero.</p>`
        },
        {
            marca: "Mercedes-Benz",
            modelo: "CLS AMG",
            desc: "CLS 53 AMG 4MATIC+, 435CV, 2022.",
            preciocompra: "85.000",
            precioalquiler: "60",
            matricula: "4321CBA",
            img: "images/mercedes.webp",
            modelo_3d: "https://sketchfab.com/models/1202e3dd546e4f668003277b47c4a3cc/embed?autostart=1&ui_controls=1&ui_infos=0&ui_annotations=0",
            desc_extensa: `
                <p>El Mercedes-Benz CLS AMG 2022 combina la elegancia atemporal de un coupé de cuatro puertas con el rendimiento puro de AMG. Bajo el capó ruge un motor de 6 cilindros en línea con 435 CV, apoyado por un sistema híbrido suave EQ Boost.</p>
                <p>Su tracción total variable 4MATIC+ y la suspensión neumática AMG RIDE CONTROL+ garantizan un dinamismo excepcional. El interior es un escaparate tecnológico con el sistema MBUX y acabados en fibra de carbono y cuero Nappa.</p>`
        },
        // --- NUEVO MODELO: BMW Alpina B7 ---
        {
            marca: "BMW",
            modelo: "Alpina B7",
            desc: "4.4 V8 Bi-Turbo 608CV, 2020.",
            preciocompra: "110.000",
            precioalquiler: "90",
            matricula: "9312ABC",
            img: "images/alpina_b7.jpg",
            modelo_3d: "https://sketchfab.com/models/1af98a380e974fc28451bd037c35747c/embed?autostart=1&ui_controls=1&ui_infos=0&ui_annotations=0",
            desc_extensa: `
                <p>El BMW Alpina B7 es la definición de exclusividad y potencia. Basado en la Serie 7, esta limusina de alto rendimiento es capaz de alcanzar los 330 km/h gracias a su motor V8 Bi-Turbo optimizado por Alpina para entregar 608 CV.</p>
                <p>A diferencia de un M7, el B7 se centra en un confort de marcha supremo a velocidades de superdeportivo. Destacan sus llantas clásicas Alpina de 20 radios, el sistema de escape deportivo de acero inoxidable y un interior con los cueros más finos del mercado.</p>`
        },
        // --- NUEVO MODELO: Audi Q2 S-Line ---
        {
            marca: "Audi",
            modelo: "Q2 S-Line",
            desc: "35 TFSI 150CV S-Tronic, 2021.",
            preciocompra: "28.900",
            precioalquiler: "30",
            matricula: "1111NFS",
            img: "images/audi_q2.webp",
            modelo_3d: "https://sketchfab.com/models/6b96ae2dd4274ebd9fe070d4a014c1ce/embed?autostart=1&ui_controls=1&ui_infos=0&ui_annotations=0",
            desc_extensa: `
                <p>El Audi Q2 S-Line 2021 es el SUV urbano premium por excelencia, con un diseño geométrico y musculoso que destaca en la ciudad. Esta unidad monta el eficiente motor 1.5 TFSI de 150 CV con tecnología de desconexión de cilindros para un consumo óptimo.</p>
                <p>El paquete S-Line aporta parachoques deportivos, llantas de aleación específicas y una suspensión deportiva. En el interior, cuenta con el Audi Virtual Cockpit, asientos deportivos y un sistema de infoentretenimiento totalmente conectado.</p>`
        },
        {
            marca: "Lexus",
            modelo: "RX500h F Sport",
            desc: "5.0 V8 371 CV, 80000 km.",
            preciocompra: "70.500",
            precioalquiler: "65",
            matricula: "3432DNT",
            img: "images/lexus.jpg",
            modelo_3d: "https://sketchfab.com/models/94948d1396764708bf1aafb8e7393788/embed?autostart=1&ui_controls=1&ui_infos=0&ui_annotations=0",
            desc_extensa: `
                <p>El Lexus RX500h F Sport es la máxima expresión de lujo y tecnología híbrida de alto rendimiento. Combina un motor turbo con motores eléctricos para ofrecer una potencia combinada y una tracción total DIRECT4.</p>
                <p>El acabado F Sport añade detalles exclusivos, dirección en el eje trasero y un sistema de sonido Mark Levinson de alta fidelidad, todo envuelto en un habitáculo de artesanía Takumi.</p>`
        }
    ];

    const $grid = $('#grid-coches');
    if ($grid.length) {
        $grid.empty(); // Limpiar mensaje de carga
        catalogoCoches.forEach((coche, index) => {
            // CAMBIOS:
            // 1. Panel height fijado a 420px para que todas las cajas sean iguales.
            // 2. Imagen height fijado a 200px con object-fit cover.
            // 3. Eliminado botón seleccionar.

            let html = "";

            if (esComprar){
            html = `
                <div class="col-sm-6 col-md-4" style="margin-bottom:30px;">
                    <div class="panel panel-default text-center" style="height: 420px; overflow: hidden; position: relative;">
                        <div class="panel-heading" style="height: 60px; display: flex; align-items: center; justify-content: center;">
                            <h3 style="margin:0; font-size: 18px;">${coche.marca} ${coche.modelo}</h3>
                        </div>
                        <div class="panel-body" style="padding:0;">
                            <div class="img-container" style="height: 200px; width: 100%; overflow: hidden; background: #eee;">
                                <img src="${coche.img}" alt="${coche.marca}" style="width: 100%; height: 100%; object-fit: cover;">
                            </div>
                            <div style="padding: 15px;">
                                <p style="height: 40px; overflow: hidden;">${coche.desc}</p>
                                <p class="lead precio-texto" style="margin-bottom: 10px;">**${coche.preciocompra}€**</p>
                                <a href="comprar1.html?id=${index}" class="btn btn-primary">Ver Detalles</a>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            }
            if (esAlquilar){
            html = `
                <div class="col-sm-6 col-md-4" style="margin-bottom:30px;">
                    <div class="panel panel-default text-center" style="height: 420px; overflow: hidden; position: relative;">
                        <div class="panel-heading" style="height: 60px; display: flex; align-items: center; justify-content: center;">
                            <h3 style="margin:0; font-size: 18px;">${coche.marca} ${coche.modelo}</h3>
                        </div>
                        <div class="panel-body" style="padding:0;">
                            <div class="img-container" style="height: 200px; width: 100%; overflow: hidden; background: #eee;">
                                <img src="${coche.img}" alt="${coche.marca}" style="width: 100%; height: 100%; object-fit: cover;">
                            </div>
                            <div style="padding: 15px;">
                                <p style="height: 40px; overflow: hidden;">${coche.desc}</p>
                                <p class="lead precio-texto" style="margin-bottom: 10px;">**${coche.precioalquiler}€ / Día**</p>
                                <a href="alquilar1.html?id=${index}" class="btn btn-primary">Ver Detalles</a>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            }
            if (html !== "") {
            $grid.append(html);
        }
        });

    }

    // LOGICA DE FICHA DE DETALLE (comprar1.html)
    // ==========================================
   if ($('#detalle-titulo').length) {

    const urlParams = new URLSearchParams(window.location.search);
    let id = urlParams.get('id');
    const modoAyuda = urlParams.get('ayuda');

    // === PARTE MÁGICA DE MEMORIA ===
    // Si la URL trae un ID, lo guardamos en la memoria del navegador.
    if (id !== null) {
        localStorage.setItem('cocheActivo', id);
        console.log("Coche guardado en memoria: " + id);
    }
    // Si NO trae ID (porque venimos de ayuda rota), intentamos recuperarlo de la memoria.
    else if (modoAyuda === 'true') {
        const idMemorizado = localStorage.getItem('cocheActivo');
        if (idMemorizado !== null) {
            id = idMemorizado; // ¡Recuperado!
            console.log("Coche recuperado de memoria: " + id);
        } else {
            id = 0; // Si no hay nada en memoria, ponemos el primero por defecto.
        }
    }
    // ================================

    if (id !== null && catalogoCoches[id]) {
        const coche = catalogoCoches[id];

        $('#detalle-titulo').text(coche.marca + ' ' + coche.modelo);
        $('#detalle-subtitulo').text(coche.desc);
        if (esAlquilar){
            $('#detalle-precio').text(coche.precioalquiler + '€ / Día');
        }
        else
            $('#detalle-precio').text(coche.preciocompra + '€');
        $('#detalle-desc-larga').text(`Este ${coche.marca} ${coche.modelo} es una oportunidad única. Equipado con ${coche.desc}`);
        $('#detalle-matricula').text(`Matrícula: ${coche.matricula}`);

        if (coche.desc_extensa) {
            $('#descripcion-extensa-texto').html(coche.desc_extensa);
        } else {
            $('#descripcion-extensa-texto').html('<p>Información detallada no disponible.</p>');
        }

        if (coche.modelo_3d && coche.modelo_3d.length > 5) {
            $('#iframe-3d').attr('src', coche.modelo_3d);
            $('#contenedor-3d').show();
            $('#contenedor-img').hide();
        } else {
            $('#detalle-imagen').attr('src', coche.img);
            $('#contenedor-3d').hide();
            $('#contenedor-img').show();
        }
    } else {
        $('#detalle-titulo').text("Vehículo no encontrado");
    }
}

    // Este bloque asegura que si estás viendo el coche ID=2,
// el enlace a "ayuda.html" se convierta en "ayuda.html?id=2"
$(document).ready(function() {
    const paramsGlobal = new URLSearchParams(window.location.search);
    const idActualGlobal = paramsGlobal.get('id');

    // Si la página actual tiene un ID en la URL...
    if (idActualGlobal !== null) {

        // Buscamos cualquier enlace (<a>) cuyo href contenga la palabra "ayuda"
        $('a[href*="ayuda"]').each(function() {
            var hrefOriginal = $(this).attr('href');

            // Solo lo modificamos si no tiene ya un 'id='
            if (hrefOriginal.indexOf('id=') === -1) {
                // Comprobamos si hay que usar ? o &
                var separador = hrefOriginal.indexOf('?') !== -1 ? '&' : '?';

                // Creamos el nuevo enlace
                var nuevoLink = hrefOriginal + separador + 'id=' + idActualGlobal;

                // Lo aplicamos al HTML
                $(this).attr('href', nuevoLink);

                // (Opcional) Mensaje en consola para comprobar que funciona
                console.log("Link de ayuda actualizado: " + nuevoLink);
            }
        });
    }
});
    // ==========================================
    // 0. MODO TEXTO GRANDE (Persistente)
    // ==========================================
    const $toggleBigMode = $('#big-mode-toggle');
    const storageKeyBigMode = 'bigTextMode';

    // Función para activar/desactivar
    function aplicarModoGrande(activo) {
        if (activo) {
            $('body').addClass('big-mode-active');
            localStorage.setItem(storageKeyBigMode, 'true');
        } else {
            $('body').removeClass('big-mode-active');
            localStorage.setItem(storageKeyBigMode, 'false');
        }
    }

    // A. Comprobar memoria al cargar la página
    if (localStorage.getItem(storageKeyBigMode) === 'true') {
        aplicarModoGrande(true);
        if ($toggleBigMode.length) {
            $toggleBigMode.prop('checked', true);
        }
    }

    // B. Escuchar cambios en el interruptor (checkbox)
    if ($toggleBigMode.length) {
        $toggleBigMode.on('change', function() {
            aplicarModoGrande(this.checked);
        });
    }

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
    // 1.5 MODO DALTÓNICO (CON CAMBIO DE LOGO)
    // ==========================================
    const $toggleDaltonico = $('#daltone-toggle');

    // 1. Definimos el logo y las rutas de las imágenes
    const $logoWeb = $('#logo-web');
    const rutaLogoNormal = 'images/logo_horizontal.png';       // Tu logo rojo original
    const rutaLogoDaltonico = 'images/logo_horizontal_dalt.png'; // NOMBRE DE TU LOGO AZUL

    // Función para activar
    function activarDaltonismo() {
        $('body').addClass('daltonico-mode');
        if ($logoWeb.length) {
            $logoWeb.attr('src', rutaLogoDaltonico);
        }
    }

    // Función para desactivar
    function desactivarDaltonismo() {
        $('body').removeClass('daltonico-mode');
        if ($logoWeb.length) {
            $logoWeb.attr('src', rutaLogoNormal);
        }
    }

    // A. Comprobar memoria al cargar la página
    if (localStorage.getItem('modoDaltonico') === 'activado') {
        activarDaltonismo();
        if ($toggleDaltonico.length) {
            $toggleDaltonico.prop('checked', true);
        }
    }

    // B. Escuchar cambios en el interruptor
    if ($toggleDaltonico.length) {
        $toggleDaltonico.on('change', function() {
            if (this.checked) {
                activarDaltonismo();
                localStorage.setItem('modoDaltonico', 'activado');
            } else {
                desactivarDaltonismo();
                localStorage.setItem('modoDaltonico', 'desactivado');
            }
        });
    }

    // ==========================================
    // 2. LÓGICA DE AYUDA INTELIGENTE
    // ==========================================
    const urlParams = new URLSearchParams(window.location.search);
    const tieneAyuda = urlParams.get('ayuda') === 'true';

    if (tieneAyuda) {
        const urlActual = window.location.href;

        // --- A. GESTIÓN DE ENLACES (Mantiene la ayuda activa) ---
        if (urlActual.indexOf("alquilar") > -1) {
            $('#btn-volver-catalogo').attr('href', 'alquilar.html?ayuda=true');
            $('#btn-confirmar-modal').attr('href', 'realizar-alquiler.html?ayuda=true');
        } else if(urlActual.indexOf("comprar") > -1) {
            $('#btn-volver-catalogo').attr('href', 'comprar.html?ayuda=true');
            $('#btn-confirmar-modal').attr('href', 'realizar-compra.html?ayuda=true');
        } else {
            $('#btn-confirmar-modal').attr('href', 'formu-mant.html?ayuda=true');
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

        // >>> TUTORIALES DE ALQUILER <<<
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

        const guiaMantenimiento = [
            {
                texto: "En esta primera pantalla, podemos ver los mantenimientos disponibles que puede contratar.",
                audio: "audio/audio16.mp3"
            },
            {
                texto: "Si desea realizar algún mantenimiento, selecciona el cuadrado a la izquierda de seleccionar.",
                audio: "audio/audio17.mp3"
            }
        ];
        const guiaFormularioMantenimiento = [
            {
                texto: "A continuación tienes que rellenar el apartado de comentario en cada mantenimiento seleccionado.",
                audio: "audio/audio18.mp3"
            },
            {
                texto: "Ahora tienes que rellenar un formulario con los datos de nombre, apellidos, dirección y método de pago obligatorios y el teléfono como opcional, para poder tener su información del mantenimiento.",
                audio: "audio/audio19.mp3"
            },
            {
                texto: "Por último podemos clicar en el botón de confirmar reserva para que tus datos y el mantenimiento sean tramitados.",
                audio: "audio/audio20.mp3"
            }
        ];

        // --- C. ENRUTADOR (ROUTER) ---
        if (urlActual.indexOf("video-comprar.html") > -1 || urlActual.indexOf("comprar1.html") > -1) {
            iniciarMotorTutorial(guiaFichaCompra);
        }
        else if (urlActual.indexOf("comprar.html") > -1) {
            iniciarMotorTutorial(guiaCatalogoCompra);
        }
        else if (urlActual.indexOf("realizar-compra.html") > -1) {
            iniciarMotorTutorial(guiaFormularioCompra);
        }
        else if (urlActual.indexOf("video-alquilar.html") > -1 || urlActual.indexOf("alquilar1.html") > -1) {
            iniciarMotorTutorial(guiaFichaAlquiler);
        }
        else if (urlActual.indexOf("alquilar.html") > -1) {
            iniciarMotorTutorial(guiaCatalogoAlquiler);
        }
        else if (urlActual.indexOf("realizar-alquiler.html") > -1) {
            iniciarMotorTutorial(guiaFormularioAlquiler);
        }
        else if (urlActual.indexOf("mantenimiento.html") > -1){
            iniciarMotorTutorial(guiaMantenimiento);
        }
        else if(urlActual.indexOf("formu-mant.html") > -1){
            iniciarMotorTutorial(guiaFormularioMantenimiento);
        }

        // --- D. MOTOR DEL TUTORIAL (Lógica) ---
        function iniciarMotorTutorial(pasosGuia) {
            if (!pasosGuia || pasosGuia.length === 0) return;

            let pasoActualIndex = 0;
            let audioGuiaActual = null;

            // Inyectar HTML de la caja (JS la crea dinámicamente)
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
                if (audioGuiaActual !== null) {
                    audioGuiaActual.pause();
                    audioGuiaActual.currentTime = 0;
                    audioGuiaActual = null;
                }

                const paso = pasosGuia[indice];
                $('#contenido-ayuda').text(paso.texto);

                audioGuiaActual = new Audio(paso.audio);
                reproducirMedia(audioGuiaActual);

                const btnSiguiente = $('#btn-siguiente-ayuda');

                if (paso.selectorAccion) $(paso.selectorAccion).off('click.guia');

                if (paso.esperarAccion === true && paso.selectorAccion) {
                    btnSiguiente.hide();
                    $(paso.selectorAccion).one('click.guia', function() {
                        pasoActualIndex++;
                        if (pasoActualIndex < pasosGuia.length) cargarPaso(pasoActualIndex);
                    });
                } else {
                    if (indice >= pasosGuia.length - 1) {
                        btnSiguiente.hide();
                    } else {
                        btnSiguiente.show();
                    }
                }
            }

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
    }
});


document.addEventListener('DOMContentLoaded', () => {
  const realSelect   = document.getElementById('metodoPago');
  const customSelect = document.getElementById('metodoPago-custom');
  if (!realSelect || !customSelect) return;

  const trigger = customSelect.querySelector('.select-trigger');
  const label   = customSelect.querySelector('.select-label');
  const list    = customSelect.querySelector('.select-options');

  let open = false;

  function toggleDropdown(force) {
    open = (force !== undefined) ? force : !open;
    list.style.display = open ? 'block' : 'none';
  }

  // Abrir/cerrar con click (ratón o mando)
  trigger.addEventListener('click', () => {
    toggleDropdown();
  });

  // Seleccionar opción
  list.querySelectorAll('li').forEach(li => {
    li.addEventListener('click', () => {
      const value = li.getAttribute('data-value') || '';
      const text  = li.textContent.trim();

      // Actualiza select real
      realSelect.value = value;
      // Actualiza etiqueta visible
      label.textContent = text;
      // Cierra lista
      toggleDropdown(false);
    });
  });

  // Cerrar si haces click fuera
  document.addEventListener('click', (e) => {
    if (!customSelect.contains(e.target)) {
      toggleDropdown(false);
    }
  });
});


$('#confirmModal').on('shown.bs.modal', function () {
  const cancelar = this.querySelector('.volveratras');
  if (cancelar) {
    cancelar.focus();
    updateCursorPositionToElement(cancelar);
  }
});


function volverEspanol() {
  // Borra la cookie de Google Translate (para este dominio y ruta)
  document.cookie = "googtrans=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
  // A veces también conviene intentar con el dominio actual
  document.cookie = "googtrans=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=" + location.hostname;

  location.reload();
}
