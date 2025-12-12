// --- CONFIGURACIÓN ---
const CURSOR_SPEED = 15;
const SCROLL_SPEED = 15;
const DEADZONE = 0.1;
// Selector de todo lo que se puede pulsar en tu web
const INTERACTIVE_SELECTOR = 'button, a, input, select, textarea, .promo-item, [tabindex]:not([tabindex="-1"]), label,li,select,form-control';

// --- ESTADO ---
let savedX = sessionStorage.getItem('cursorX');
let savedY = sessionStorage.getItem('cursorY');

let cursorX = savedX ? parseFloat(savedX) : window.innerWidth / 2;
let cursorY = savedY ? parseFloat(savedY) : window.innerHeight / 2;

let lastState = { aButton: false, up: false, down: false, left: false, right: false };
let inputMode = sessionStorage.getItem('inputMode') || 'mouse';
let lastHoveredElement = null;

const logEl = document.getElementById('msg-log');

// --- GUARDAR AL SALIR ---
window.addEventListener('beforeunload', () => {
  sessionStorage.setItem('cursorX', cursorX);
  sessionStorage.setItem('cursorY', cursorY);
});

// --- INICIO ---
document.addEventListener('DOMContentLoaded', () => {
  let cursorEl = document.getElementById('virtual-cursor');

  // Crear el cursor si no existe
  if (!cursorEl) {
    const div = document.createElement('div');
    div.id = 'virtual-cursor';
    document.body.appendChild(div);
    cursorEl = div;
  }

  // Colocar cursor y aplicar modo inicial
  updateVisualCursor();

  if (inputMode === 'gamepad') {
    document.body.style.cursor = 'none';
    cursorEl.style.opacity = '1';
  } else {
    document.body.style.cursor = 'default';
    cursorEl.style.opacity = '0';
  }
  document.querySelectorAll('label[for]').forEach(lbl => {
      lbl.setAttribute('tabindex', '0');
      // Opcional: hacer que Enter active el label (para teclado/cruceta)
      lbl.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') lbl.click();
      });
  });




});

// --- DETECCIÓN RATÓN ---
document.addEventListener('mousemove', (e) => {
  if (inputMode !== 'mouse') {
    inputMode = 'mouse';
    sessionStorage.setItem('inputMode', 'mouse');
    document.body.style.cursor = 'default';
    const cursorEl = document.getElementById('virtual-cursor');
    if (cursorEl) cursorEl.style.opacity = '0';
    clearHover(); // Quitar iluminación de mando
  }
  cursorX = e.clientX;
  cursorY = e.clientY;
  // Actualizamos posición visual pero NO chequeamos hover de mando aquí
  // porque el ratón ya tiene su propio hover nativo del navegador.
  const cursorEl = document.getElementById('virtual-cursor');
  if (cursorEl) {
    cursorEl.style.left = `${cursorX}px`;
    cursorEl.style.top = `${cursorY}px`;
  }
});

// --- MODO MANDO ---
function switchToGamepadMode() {
  if (inputMode !== 'gamepad') {
    inputMode = 'gamepad';
    sessionStorage.setItem('inputMode', 'gamepad');
    document.body.style.cursor = 'none';
    const cursorEl = document.getElementById('virtual-cursor');
    if (cursorEl) cursorEl.style.opacity = '1';
  }
}

// --- BUCLE PRINCIPAL ---
window.addEventListener('gamepadconnected', () => {
  requestAnimationFrame(gameLoop);
});

function gameLoop() {
  const gamepads = navigator.getGamepads();
  const gp = gamepads[0];

  if (gp) {
    handleJoystick(gp);
    handleScroll(gp);
    handleDpad(gp);
    handleClickButton(gp);
  }
  requestAnimationFrame(gameLoop);
}

// --- JOYSTICKS ---
function handleJoystick(gp) {
  const axisX = gp.axes[0];
  const axisY = gp.axes[1];

  if (Math.abs(axisX) > DEADZONE || Math.abs(axisY) > DEADZONE) {
    switchToGamepadMode();
    cursorX += axisX * CURSOR_SPEED;
    cursorY += axisY * CURSOR_SPEED;

    cursorX = Math.max(0, Math.min(window.innerWidth, cursorX));
    cursorY = Math.max(0, Math.min(window.innerHeight, cursorY));

    // Si movemos joystick, quitamos el foco del teclado/cruceta para no tener dos cosas seleccionadas
    if ((Math.abs(axisX) > 0.5 || Math.abs(axisY) > 0.5) && document.activeElement && document.activeElement !== document.body) {
         document.activeElement.blur();
    }

    updateVisualCursor();
  }
}

function handleScroll(gp) {
  const scrollY = gp.axes[3];
  if (Math.abs(scrollY) > DEADZONE) {
    window.scrollBy(0, scrollY * SCROLL_SPEED);
  }
}

// --- CRUCETA ---
function handleDpad(gp) {
  const up = gp.buttons[12].pressed;
  const down = gp.buttons[13].pressed;
  const left = gp.buttons[14].pressed;
  const right = gp.buttons[15].pressed;

  if (up || down || left || right) switchToGamepadMode();

  if (up && !lastState.up) moveFocus('up');
  if (down && !lastState.down) moveFocus('down');
  if (left && !lastState.left) moveFocus('left');
  if (right && !lastState.right) moveFocus('right');

  lastState.up = up; lastState.down = down; lastState.left = left; lastState.right = right;
}

// --- BOTÓN A (CLICK) ---
function handleClickButton(gp) {
  const isPressed = gp.buttons[0].pressed;
  if (isPressed && !lastState.aButton) {
    switchToGamepadMode();
    performClick();
  }
  lastState.aButton = isPressed;
}

// --- LÓGICA VISUAL Y HOVER ---

function updateVisualCursor() {
  const cursorEl = document.getElementById('virtual-cursor');
  if (cursorEl) {
    cursorEl.style.left = `${cursorX}px`;
    cursorEl.style.top = `${cursorY}px`;
  }
  // AQUÍ ESTÁ LA CLAVE: Cada vez que se mueve el cursor, miramos qué hay debajo
  checkHover();
}

function checkHover() {
  // Miramos qué elemento está debajo del punto (x, y)
  const elementUnder = document.elementFromPoint(cursorX, cursorY);

  if (!elementUnder) {
    clearHover();
    return;
  }

  // Buscamos si es un botón, enlace, etc.
  const target = elementUnder.closest(INTERACTIVE_SELECTOR);

  // Si hemos cambiado de botón
  if (target !== lastHoveredElement) {
    clearHover(); // Quitamos el estilo al anterior
    if (target) {
      target.classList.add('gamepad-hover'); // Ponemos el estilo al nuevo
    }
    lastHoveredElement = target;
  }
}

function clearHover() {
  if (lastHoveredElement) {
    lastHoveredElement.classList.remove('gamepad-hover');
    lastHoveredElement = null;
  }
}

// --- NAVEGACIÓN Y CLICK ---

function updateCursorPositionToElement(el) {
  const rect = el.getBoundingClientRect();
  cursorX = rect.left + rect.width / 2;
  cursorY = rect.top + rect.height / 2;
  updateVisualCursor();
}

function performClick() {
  const elementUnderCursor = document.elementFromPoint(cursorX, cursorY);
  if (!elementUnderCursor) return;
  const clickable = elementUnderCursor.closest(INTERACTIVE_SELECTOR);


  if (!clickable) return;

  // Caso especial: SELECT -> forzar apertura
  if (clickable.tagName === 'SELECT') {
    clickable.focus();

    // Intento 1: enviar un evento de teclado (abre en muchos navegadores)
    const ev = new KeyboardEvent('keydown', {
      key: 'ArrowDown',
      code: 'ArrowDown',
      keyCode: 40,
      which: 40,
      bubbles: true
    });
    clickable.dispatchEvent(ev);

    // Fallback: pequeño truco de blur+focus que a veces fuerza el desplegable
    setTimeout(() => {
      clickable.blur();
      clickable.focus();
    }, 10);

    return;
  }



  if (clickable) {
    clickable.focus();
    clickable.click();

    // Animación de "pulsado"
    clickable.classList.add('active-state');
    setTimeout(() => clickable.classList.remove('active-state'), 150);

    // Animación del cursor rojo (parpadeo blanco)
    const cursorEl = document.getElementById('virtual-cursor');
    if (cursorEl) {
      cursorEl.style.backgroundColor = '#fff';
      setTimeout(() => cursorEl.style.backgroundColor = '', 100);
    }
  }
}

function moveFocus(direction) {
  clearHover();

  const MAX_DIST = 3000;
const chat = document.getElementById('chatbot-container');
const chatClosed = chat && chat.classList.contains('chatbot-closed');

  // 1) DETECTAR MODAL ABIERTO
  const openModal = Array.from(document.querySelectorAll('.modal')).find(m => {
    return window.getComputedStyle(m).display === 'block';
  });

  let scopeElement = document;
  if (openModal) {
    scopeElement = openModal;

    // Si el foco actual NO está dentro del modal, entrar por el primer botón/enlace
    if (!openModal.contains(document.activeElement)) {
      const firstBtn = openModal.querySelector(
        '.btn, button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (firstBtn) {
        firstBtn.focus();
        updateCursorPositionToElement(firstBtn);
        return;
      }
    }
  }

  // 2) SI NO HAY FOCO, ENFOCAR EL PRIMER ELEMENTO VISIBLE
  if (!document.activeElement || document.activeElement === document.body) {
    const allItems = scopeElement.querySelectorAll(INTERACTIVE_SELECTOR);
for (let el of allItems) {

  // NUEVO: si el chat está cerrado, saltar todo lo de dentro del chatbot
  if (chatClosed && el.closest('#chatbot-container')) continue;

  if (el.offsetWidth > 0 && el.offsetHeight > 0 && el.tabIndex !== -1) {
    el.focus();
    updateCursorPositionToElement(el);
    return;
  }
}

    return;
  }

  const current = document.activeElement;

  // 2.5) CASO ESPECIAL: BOTONES DEL MODAL (CANCELAR / CONFIRMAR)
  const cancelar = openModal ? openModal.querySelector('.volveratras') : null;
  const confirmar = openModal ? openModal.querySelector('#btn-confirmar-modal') : null;

  if (openModal && cancelar && confirmar) {
    if (current === cancelar && direction === 'right') {
      confirmar.focus();
      updateCursorPositionToElement(confirmar);
      return;
    }
    if (current === confirmar && direction === 'left') {
      cancelar.focus();
      updateCursorPositionToElement(cancelar);
      return;
    }
  }

  const rectCurrent = current.getBoundingClientRect();
  const centerCurrent = {
    x: rectCurrent.left + rectCurrent.width / 2,
    y: rectCurrent.top + rectCurrent.height / 2
  };

  // 3) NAVEGACIÓN ESPACIAL GENÉRICA
  const candidates = Array.from(scopeElement.querySelectorAll(INTERACTIVE_SELECTOR));

  let bestCandidate = null;
  let minDist = Infinity;

  candidates.forEach(el => {
    if (el === current) return;
    if (el.offsetWidth === 0 || el.offsetHeight === 0) return;
    if (chatClosed && el.closest('#chatbot-container')) return;
    if (el.tabIndex === -1) return;
    if (openModal && !openModal.contains(el)) return;

    const rect = el.getBoundingClientRect();
    const center = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    };

    const dx = center.x - centerCurrent.x;
    const dy = center.y - centerCurrent.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist === 0 || dist > MAX_DIST) return;

    let valid = false;

    switch (direction) {
      case 'right':
        // A la derecha y razonablemente alineado en vertical
        valid = dx > 0 && Math.abs(dy) < rectCurrent.height * 2;
        break;
      case 'left':
        valid = dx < 0 && Math.abs(dy) < rectCurrent.height * 2;
        break;
      case 'down':
        // Por debajo y algo alineado en horizontal
        valid = dy > 0;
        break;
      case 'up':
        valid = dy < 0 ;
        break;
    }

    if (!valid) return;

    if (dist < minDist) {
      minDist = dist;
      bestCandidate = el;
    }
  });

  if (bestCandidate) {
    bestCandidate.focus();
    updateCursorPositionToElement(bestCandidate);
  }
}





document.addEventListener('DOMContentLoaded', () => {
  const daltoneToggle = document.getElementById('daltone-toggle');
  if (!daltoneToggle) return;

  // Aplicar estado guardado (opcional, si quieres recordar el modo)
  const savedDaltonico = sessionStorage.getItem('daltonicoMode') === 'true';
  if (savedDaltonico) {
    daltoneToggle.checked = true;
    document.body.classList.add('daltonico-mode');
  }

  daltoneToggle.addEventListener('change', () => {
    if (daltoneToggle.checked) {
      document.body.classList.add('daltonico-mode');
      sessionStorage.setItem('daltonicoMode', 'true');
    } else {
      document.body.classList.remove('daltonico-mode');
      sessionStorage.setItem('daltonicoMode', 'false');
    }
  });
});

function logMsg(text) {
  const logEl = document.getElementById('msg-log');
  if (!logEl) return;

  const line = document.createElement('div');
  line.textContent = `[${new Date().toLocaleTimeString()}] ${text}`;
  logEl.appendChild(line);
}





