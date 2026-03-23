# Puente Antigravity 🌉

**Puente Antigravity** es una potente herramienta de intermediación (bridge) diseñada para enlazar tu entorno local del **IDE Antigravity** con un cliente remoto en tu red local (como tu teléfono móvil). Esto te permite interactuar en tiempo real con el asistente inteligente incrustado en el IDE de forma inalámbrica y remota.

## ✨ Características Principales
- **Chat en Tiempo Real:** Comunicación fluida mediante arquitectura de WebSockets (`Socket.IO`).
- **Autenticación Protegida:** Interfaz de acceso `login.html` restringida con manejo de sesiones seguras (`express-session`).
- **Interfaces Modernas Estructuradas:** El agente formatea nativamente sus respuestas como tarjetas (JSON struct) brindando un chat mucho más ordenado, con estado predictivo y plan de tareas directamente en el móvil.
- **Inyección por PowerShell:** Utiliza scripts avanzados y APIs nativas de Windows (`user32.dll`) para enfocar automáticamente el IDE local, insertar comandos mediante el portapapeles de forma segura y presionar teclas virtuales de manera invisible al usuario.

## 🚀 Requisitos e Instalación

### Prerrequisitos
- **Node.js**: Versión 16+ recomendada.
- **SO**: Windows (necesario para la inyección de focus vía PowerShell).
- **IDE**: Antigravity activo.

### Instalación
1. Clona o extrae la carpeta del proyecto en **cualquier ubicación de tu directorio** (El código detecta su propia ruta automáticamente de forma portable).
2. Abre la terminal en esa carpeta e instala los módulos necesarios:
   ```bash
   npm install express socket.io express-session express-socket.io-session dotenv
   ```
3. Crea un archivo `.env` en la raíz del proyecto para alojar tus credenciales seguras y la configuración de rutas locales. El archivo no se subirá a sistemas de control de versiones y debe contener:
   ```env
   APP_PASSWORD=TuContraseñaMaestraAqui
   AG_PATH='C:\Usuarios\TuUsuario\AppData\Local\Programs\Antigravity\bin\antigravity.cmd'
   ```
4. Levanta el servidor Node:
   ```bash
   node server.js
   ```

## 📱 Guía de Uso
1. Asegúrate de tener una instancia del **IDE Antigravity abierta** en tu compu, con el foco listo en el chat del agente.
2. Comienza la ejecución de `server.js`.
3. Abre el navegador web en tu dispositivo celular conectado al mismo router o red WiFi.
4. Digita la dirección mostrada en la consola de tu servidor (ejemplo: `http://192.168.1.10:3000`).
5. Accede usando la clave guardada en tu `.env`.
6. Desde la interfaz móvil, ahora puedes mandar prompts al IDE sin estar sentado frente al teclado. Tus mensajes activarán el puente, el código simulará tu tecleo en el chat del IDE y recibirás tu respuesta nativa e inteligente formateada de regreso al dispositivo.

## 🔭 Alcances y Futuro del Proyecto

Puente Antigravity tiene el gran potencial de transformarse en un control remoto maestro en los entornos de programación autónomos guiados por IA:

1. **Gestión Directa por API REST**: En el futuro, si el agente del IDE lo soporta de forma nativa, se podría prescindir del uso de PowerShell (`SendKeys`) logrando interacciones en segundo plano asíncronas limpias.
2. **Soporte Multi-instancia**: Poder identificar dinámicamente y seleccionar de entre múltiples ventanas del IDE con qué proyecto remoto conectarse.
3. **Múltiples Bloques (UI Rica en Móvil)**: Ampliar el parser JSON actual del FronEnd para renderizar código fuente Markdown directamente en la pantalla de chat, similar a asistentes completos de Inteligencia Artificial que aplican Syntax Highlighting nativo, convirtiendo tu teléfono de puente a estación de desarrollo ligera auxiliar.
4. **Reconocimiento de Voz (Web Speech API)**: Integrar un botón en `index.html` para poder mandarle arreglos estructurales a Antigravity simplemente hablándole a tu teléfono mientras observas u operas el servidor a la distancia.
