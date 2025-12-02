/* qr-camera.js - integrado y mínimo
   Exposición global: window.QRCamera
   Uso en tu HTML:
     QRCamera.attachCameraToButton('btnCam','video');
     // opcional: QRCamera.attachQrToButton('btnQr', 220); // si tienes un botón con id btnQr
*/
(function () {
  // --- helpers para cargar librerías si hacen falta ---
  function loadScriptOnce(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector('script[src="' + src + '"]')) return resolve();
      const s = document.createElement('script');
      s.src = src;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('No se pudo cargar ' + src));
      document.head.appendChild(s);
    });
  }

  function ensureJsQr() {
    if (window.jsQR) return Promise.resolve();
    return loadScriptOnce('https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js');
  }

  function ensureQrLib() {
    if (window.QRCode) return Promise.resolve();
    return loadScriptOnce('https://cdn.jsdelivr.net/gh/davidshimjs/qrcodejs/qrcode.min.js');
  }

  // --- overlay QR (creado solo si se usa showCurrentPageQr) ---
  function ensureOverlay() {
    let overlay = document.getElementById('qrOverlay');
    if (overlay) return overlay;
    overlay = document.createElement('div');
    overlay.id = 'qrOverlay';
    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
    overlay.style.display = 'none';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.background = 'rgba(0,0,0,0.45)';
    overlay.style.zIndex = '9999';
    overlay.innerHTML = '<div id="qrCard" style="background:#fff;padding:12px;border-radius:8px;text-align:center;"><div id="qrcode"></div><div style="margin-top:8px"><button id="qrCloseBtn">Cerrar</button></div></div>';
    document.body.appendChild(overlay);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.style.display = 'none'; });
    overlay.querySelector('#qrCloseBtn').addEventListener('click', () => { overlay.style.display = 'none'; });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') overlay.style.display = 'none'; });
    return overlay;
  }

  // --- generar QR de la página actual (usa #qrcode si existe o crea overlay) ---
  async function showCurrentPageQr(size = 200) {
    await ensureQrLib();
    const el = document.getElementById('qrcode');
    if (el) {
      el.innerHTML = '';
      new QRCode(el, { text: window.location.href, width: size, height: size });
      return;
    }
    const overlay = ensureOverlay();
    const qel = overlay.querySelector('#qrcode');
    qel.innerHTML = '';
    new QRCode(qel, { text: window.location.href, width: size, height: size });
    overlay.style.display = 'flex';
  }

  function hideQr() {
    const overlay = document.getElementById('qrOverlay');
    if (overlay) overlay.style.display = 'none';
  }

  function attachQrToButton(buttonId, size = 200) {
    const btn = document.getElementById(buttonId);
    if (!btn) return;
    btn.addEventListener('click', () => showCurrentPageQr(size));
  }

  // --- cámara y escáner ---
  async function startCamera(videoId, constraints = { video: { facingMode: 'environment' } }) {
    const video = document.getElementById(videoId);
    if (!video) return Promise.reject(new Error('Elemento video no encontrado: ' + videoId));
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      video.srcObject = stream;
      video.setAttribute('playsinline', '');
      try { await video.play(); } catch (e) { /* algunos navegadores no requieren await */ }
      const stop = () => {
        stream.getTracks().forEach(t => t.stop());
        if (video.srcObject) video.srcObject = null;
      };
      return stop;
    } catch (err) {
      return Promise.reject(err);
    }
  }

  // startScanner: bucle que usa jsQR y llama onDetected(text)
  async function startScanner(videoId, onDetected, options = {}) {
    await ensureJsQr();
    const video = document.getElementById(videoId);
    if (!video) throw new Error('Elemento video no encontrado: ' + videoId);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    let running = true;
    let lastDetected = 0;
    const debounceMs = options.debounceMs || 1500;
    const scanIntervalMs = options.scanIntervalMs || 120;

    async function loop() {
      if (!running) return;
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        if (canvas.width && canvas.height) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = window.jsQR(img.data, img.width, img.height);
          if (code && code.data) {
            const now = Date.now();
            if (now - lastDetected > debounceMs) {
              lastDetected = now;
              try { onDetected(code.data); } catch (e) { console.error(e); }
            }
          }
        }
      }
      setTimeout(() => { requestAnimationFrame(loop); }, scanIntervalMs);
    }

    requestAnimationFrame(loop);
    return () => { running = false; };
  }

  // attachCameraToButton: alterna start/stop cámara y arranca escáner
function attachCameraToButton(btnId, videoId, constraints, autoNavigate = false, autoStopOnDetect = true) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  let stopCam = null;
  let stopScanner = null;

  btn.addEventListener('click', async () => {
    if (!stopCam) {
      try {
        stopCam = await startCamera(videoId, constraints);
        btn.textContent = 'Detener cámara';

        stopScanner = await startScanner(videoId, async (text) => {
          // resolver ruta y validar host
          let final;
          try { final = new URL(text, window.location.href).href; } catch (e) { return; }
          if (new URL(final).hostname !== window.location.hostname) return;

          // detener escáner y cámara inmediatamente al detectar
          if (stopScanner) { stopScanner(); stopScanner = null; }
          if (stopCam) { stopCam(); stopCam = null; }
          btn.textContent = 'Activar cámara';

          // navegar si está configurado
          if (autoNavigate) {
            window.location.href = final;
          } else {
            // si no navegas automáticamente, puedes mostrar la URL o manejarla aquí
            console.log('QR detectado:', final);
          }
        });
      } catch (err) {
        console.error('Error cámara:', err);
        alert('Error cámara: ' + (err.message || err.name));
      }
    } else {
      // detener manualmente si el usuario pulsa de nuevo
      if (stopScanner) { stopScanner(); stopScanner = null; }
      if (stopCam) { stopCam(); stopCam = null; }
      btn.textContent = 'Activar cámara';
    }
  });
}


  // exportar API global
  window.QRCamera = {
    showCurrentPageQr,
    hideQr,
    attachQrToButton,
    startCamera,
    startScanner,
    attachCameraToButton
  };
})();
