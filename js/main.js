// Menú en móvil
const botonMenu = document.getElementById('boton-menu');
const menu = document.getElementById('menu');
botonMenu.addEventListener('click', () => {
  const abierto = menu.classList.toggle('abierto');
  botonMenu.setAttribute('aria-expanded', String(abierto));
});
const cerrarMenu = () => { menu.classList.remove('abierto'); botonMenu.setAttribute('aria-expanded', 'false'); };
menu.addEventListener('click', (e) => { if (e.target.closest('a')) cerrarMenu(); });
// También se cierra con Escape o tocando fuera
addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && menu.classList.contains('abierto')) { cerrarMenu(); botonMenu.focus(); }
});
addEventListener('click', (e) => {
  if (menu.classList.contains('abierto') && !e.target.closest('#menu, #boton-menu')) cerrarMenu();
});

// Si se llega desde un botón de reserva (contacto.html?sesion=Familia),
// el mensaje de WhatsApp y el asunto del correo mencionan esa sesión
const sesionPedida = new URLSearchParams(location.search).get('sesion');
const viaWhatsapp = document.getElementById('via-whatsapp');
const viaCorreo = document.getElementById('via-correo');
if (sesionPedida && viaWhatsapp && viaCorreo) {
  const sesion = sesionPedida.toLowerCase();
  viaWhatsapp.href = `https://wa.me/34617825453?text=${encodeURIComponent(`Hola Lucio, me gustaría información sobre una sesión de ${sesion}.`)}`;
  viaCorreo.href = `mailto:lnkochnowicz@gmail.com?subject=${encodeURIComponent(`Sesión de ${sesion}`)}`;
}

// Galerías: los botones del centro muestran una sola galería (Familia al entrar,
// o la que venga en el enlace, p. ej. galerias.html#ninos). Sin JavaScript se ven todas.
const selector = document.getElementById('selector-galerias');
if (selector) {
  const botones = [...selector.querySelectorAll('a')];
  const ids = botones.map((b) => b.hash.slice(1));
  let actual = null;
  const mostrar = (id) => {
    if (!ids.includes(id)) id = ids[0];
    ids.forEach((otro) => {
      const seccion = document.getElementById(otro);
      seccion.hidden = otro !== id;
      seccion.classList.toggle('galeria-elegida', otro === id);
    });
    botones.forEach((b) => b.setAttribute('aria-current', String(b.hash === `#${id}`)));
    actual = id;
  };
  // Con animación si el navegador la admite: la galería nueva entra por el lado del botón pulsado
  const cambiar = (id) => {
    if (id === actual) return;
    const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!document.startViewTransition || quieto) return mostrar(id);
    document.documentElement.dataset.direccion = ids.indexOf(id) < ids.indexOf(actual) ? 'atras' : 'adelante';
    document.startViewTransition(() => mostrar(id));
    // Por si el navegador no llega a hacer la animación: la galería cambia igualmente
    setTimeout(() => { if (actual !== id) mostrar(id); }, 400);
  };
  selector.addEventListener('click', (e) => {
    const boton = e.target.closest('a');
    if (!boton) return;
    e.preventDefault();
    history.replaceState(null, '', boton.hash);
    cambiar(boton.hash.slice(1));
  });
  addEventListener('hashchange', () => cambiar(location.hash.slice(1)));
  mostrar(location.hash.slice(1));
  // El navegador saltaría a la galería del enlace; mejor empezar arriba, con los botones a la vista
  if (location.hash) {
    history.scrollRestoration = 'manual';
    scrollTo(0, 0);
    addEventListener('load', () => scrollTo(0, 0));
  }
}

// Visor: al pulsar una foto de la galería se abre en grande, con flechas para pasar
const fotosGaleria = document.querySelectorAll('.galeria-completa img');
if (fotosGaleria.length) {
  const flecha = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;
  const visor = document.createElement('dialog');
  visor.className = 'visor';
  visor.setAttribute('aria-label', 'Foto ampliada');
  visor.innerHTML = `
    <img alt="">
    <p class="visor-pie" aria-live="polite"></p>
    <button class="visor-cerrar" type="button" aria-label="Cerrar">${flecha('M6 6l12 12M18 6 6 18')}</button>
    <button class="visor-anterior" type="button" aria-label="Foto anterior">${flecha('M15 6l-6 6 6 6')}</button>
    <button class="visor-siguiente" type="button" aria-label="Foto siguiente">${flecha('M9 6l6 6-6 6')}</button>`;
  document.body.append(visor);
  const grande = visor.querySelector('img');
  const pie = visor.querySelector('.visor-pie');
  // Navegadores antiguos o integrados en apps sin <dialog>: se abre y cierra igual, a mano
  const abrir = () => (typeof visor.showModal === 'function' ? visor.showModal() : visor.setAttribute('open', ''));
  const cerrar = () => (typeof visor.close === 'function' ? visor.close() : visor.removeAttribute('open'));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && visor.hasAttribute('open')) cerrar(); });
  let lista = [];
  let posicion = 0;
  const ver = (i) => {
    posicion = (i + lista.length) % lista.length;
    grande.src = lista[posicion].currentSrc || lista[posicion].src;
    grande.alt = lista[posicion].alt;
    pie.textContent = `${posicion + 1} de ${lista.length}`;
  };
  fotosGaleria.forEach((foto) => foto.addEventListener('click', () => {
    // Solo las fotos de la galería que se está viendo
    lista = [...foto.closest('.galeria-completa').querySelectorAll('img')];
    ver(lista.indexOf(foto));
    abrir();
  }));
  visor.querySelector('.visor-cerrar').addEventListener('click', cerrar);
  visor.querySelector('.visor-anterior').addEventListener('click', () => ver(posicion - 1));
  visor.querySelector('.visor-siguiente').addEventListener('click', () => ver(posicion + 1));
  visor.addEventListener('click', (e) => { if (e.target === visor) cerrar(); });
  visor.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') ver(posicion - 1);
    if (e.key === 'ArrowRight') ver(posicion + 1);
  });
  // Deslizar con el dedo en el móvil
  let inicioX = null;
  visor.addEventListener('touchstart', (e) => { inicioX = e.touches[0].clientX; }, { passive: true });
  visor.addEventListener('touchend', (e) => {
    if (inicioX === null) return;
    const dx = e.changedTouches[0].clientX - inicioX;
    if (Math.abs(dx) > 50) ver(posicion + (dx < 0 ? 1 : -1));
    inicioX = null;
  });
}

// Entrada suave de los bloques al aparecer en pantalla
const sinMovimiento = matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!sinMovimiento && 'IntersectionObserver' in window) {
  const bloques = document.querySelectorAll(
    '.portada-texto > *, .portada-foto, .cabeza-pagina .envoltura > *, .galeria-cabeza, .galeria-completa .marco, ' +
    '.sobre-fotos, .sobre-texto > *, .sesiones-cabeza, .tarifa, .pasos-titulo, .pasos li, .contacto .envoltura > *'
  );
  const observador = new IntersectionObserver((entradas) => {
    let orden = 0;
    entradas.forEach((entrada) => {
      if (!entrada.isIntersecting) return;
      entrada.target.style.setProperty('--retraso', `${Math.min(orden++, 6) * 80}ms`);
      entrada.target.classList.add('visible');
      observador.unobserve(entrada.target);
    });
  }, { rootMargin: '0px 0px -8% 0px' });
  // Lo que ya se ve al abrir la página aparece enseguida; el resto, al bajar
  let ordenInicial = 0;
  bloques.forEach((bloque) => {
    bloque.classList.add('revelar');
    if (bloque.getBoundingClientRect().top < innerHeight) {
      bloque.style.setProperty('--retraso', `${Math.min(ordenInicial++, 8) * 80}ms`);
      requestAnimationFrame(() => requestAnimationFrame(() => bloque.classList.add('visible')));
    } else {
      observador.observe(bloque);
    }
  });
  document.documentElement.classList.add('animar');
}
