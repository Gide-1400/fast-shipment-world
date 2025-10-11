/* style.css - تصميم عالمي بألوان النمر */
:root {
  --primary: #ff7b00;     /* برتقالي ناري */
  --secondary: #4b4b4b;    /* رمادي غامق */
  --accent: #ffb347;       /* برتقالي فاتح */
  --dark: #1f1f1f;         /* أسود النمر */
  --light: #f5f5f5;        /* رمادي فاتح */
  --white: #ffffff;
  --font: 'Inter', sans-serif;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: var(--font);
  background: var(--light);
  color: var(--dark);
  line-height: 1.6;
  transition: background 0.3s, color 0.3s;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

/* الهيدر العالمي */
.header {
  background: var(--white);
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  position: fixed;
  width: 100%;
  top: 0;
  z-index: 1000;
}

.header .container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 20px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--primary);
}

.nav {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.nav a {
  text-decoration: none;
  color: var(--dark);
  font-weight: 500;
  transition: color 0.3s;
}

.nav a:hover,
.nav a.active {
  color: var(--primary);
}

.language-switcher select {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 5px;
  background: var(--white);
  color: var(--dark);
}

.auth-buttons {
  display: flex;
  gap: 1rem;
}

.btn-login,icio",
    "nav.features": "Características",
    "nav.how": "Cómo funciona",
    "nav.contact": "Contáctanos",
    "nav.login": "Iniciar sesión",
    "nav.register": "Registrarse",
    "hero.title": "Desde tu barrio hacia el mundo",
    "hero.subtitle": "Envío rápido - comisión voluntaria - evaluaciones confiables",
    "hero.desc": "La primera plataforma global que conecta a los remitentes con transportistas de todos los tipos<br>Desde la moto hasta el barco - desde el taxi hasta el avión - ¡sin comisión forzosa!",
    "hero.stat1": "Envíos exitosos",
    "hero.stat2": "Transportistas confiables",
    "hero.stat3": "Comisión forzosa",
    "hero.cta1": "Enviar un envío ahora",
    "hero.cta2": "Ser transportista",
    "ship.motor": "Moto",
    "ship.car": "Coche",
    "ship.truck": "Camión",
    "ship.plane": "Avión",
    "ship.ship": "Barco",
    "features.title": "¿Por qué elegir Fast Shipment?",
    "features.f1": "Alcance mundial",
    "features.f1d": "Desde tu barrio hacia cualquier país del mundo - misma plataforma, misma confianza",
    "features.f2": "Comisión voluntaria",
    "features.f2d": "1% del remitente + 2% del transportista - completamente opcional para apoyar la plataforma",
    "features.f3": "Evaluaciones mutuas",
    "features.f3d": "Un sistema de evaluación transparente te ayuda a elegir el mejor y construir confianza",
    "features.f4": "Inteligencia artificial",
    "features.f4d": "Asistente inteligente que sugiere los mejores transportistas y estima automáticamente los costos",
    "features.f5": "Comunicación segura",
    "features.f5d": "Chat interno o WhatsApp - mantiene la confidencialidad y los registros",
    "features.f6": "Seguridad completa",
    "features.f6d": "Simple plataforma de conexión - ninguna responsabilidad de nuestra parte, pero proporcionamos herramientas de verificación",
    "how.title": "¿Cómo funciona la plataforma?",
    "how.s1": "Crea tu envío",
    "how.s1d": "Especifica el tipo, peso, ruta y presupuesto previsto",
    "how.s2": "Elige el transportista adecuado",
    "how.s2d": "Explora las ofertas, compara precios y evaluaciones, y elige el mejor",
    "how.s3": "Negocia el precio",
    "how.s3d": "Discute los detalles y el precio - flexibilidad total entre ambas partes",
    "how.s4": "Sigue tu envío",
    "how.s4d": "Sigue el estado del envío momento a momento hasta la entrega",
    "form.title": "Envía tu envío ahora",
    "form.from": "Desde (ciudad)",
    "form.to": "Hacia (ciudad)",
    "form.type": "Tipo de envío",
    "form.select": "Elige el tipo",
    "form.docs": "Documentos",
    "form.small": "Paquete pequeño",
    "form.large": "Paquete grande",
    "form.furniture": "Muebles",
    "form.elec": "Dispositivos electrónicos",
    "form.other": "Otro",
    "form.weight": "Peso aproximado",
    "form.budget": "Presupuesto previsto",
    "form.urgency": "Urgencia",
    "form.low": "No urgente",
    "form.medium": "Normal",
    "form.high": "Urgente",
    "form.desc": "Descripción del envío",
    "form.donate": "Quiero contribuir voluntariamente (1%) para apoyar la plataforma",
    "form.submit": "Publicar envío",
    "footer.title": "Fast Shipment",
    "footer.desc": "Una plataforma global que conecta a los remitentes con transportistas de todos los tipos",
    "footer.quick": "Enlaces rápidos",
    "footer.features": "Características",
    "footer.how": "Cómo funciona",
    "footer.disclaimer": "Descargo de responsabilidad",
    "footer.terms": "Términos y condiciones",
    "footer.contact": "Contáctanos",
    "footer.name": "Gaid Al-Masabi",
    "footer.location": "Arabia Saudita - Todas las ciudades",
    "footer.copy": "Fast Shipment. Todos los derechos reservados | Plataforma de conexión sin fines de lucro",
    "login.title": "Iniciar sesión",
    "login.email": "Correo electrónico",
    "login.pass": "Contraseña",
    "login.btn": "Iniciar sesión",
    "login.noacc": "¿No tienes una cuenta?",
    "login.register": "Regístrate ahora",
    "reg.title": "Crear una cuenta nueva",
    "reg.name": "Nombre completo",
    "reg.email": "Correo electrónico",
    "reg.phone": "Número de teléfono",
    "reg.type": "Tipo de cuenta",
    "reg.select": "Elige el tipo",
    "reg.sender": "Solo remitente",
    "reg.carrier": "Solo transportista",
    "reg.both": "Ambos",
    "reg.pass": "Contraseña",
    "reg.btn": "Crear cuenta"
  }
};

// تحميل الترجمة عند التحميل
window.addEventListener('DOMContentLoaded', () => {
  const lang = localStorage.getItem('lang') || 'ar';
  loadTranslations(lang);
  document.documentElement.setAttribute('lang', lang);
  document.getElementById('language').value = lang;
});

function loadTranslations(lang) {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (translations[lang] && translations[lang][key]) {
      el.textContent = translations[lang][key];
    }
  });
}

function changeLanguage(lang) {
  localStorage.setItem('lang', lang);
  location.reload();
}