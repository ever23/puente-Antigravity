# Puente Antigravity 🌉

**Puente Antigravity** es una potente estación de desarrollo móvil. Nacida originalmente como una herramienta de intermediación (bridge) para enlazar el IDE Antigravity con un cliente remoto local (teléfono móvil), ha evolucionado hasta convertirse en un entorno interactivo completo con ejecución remota, persistencia de datos y renderizado HUD para la IA.

## ✨ Características Premium
- **Chat Estructurado (JSON HUD):** Los mensajes del agente se reciben como JSON y se renderizan usando `marked.js` y `highlight.js`. La interfaz móvil muestra bloques organizados para *Mensajes*, *Planes de Acción*, y *Estados* de la IA.
- **Terminal Remota & Auto-Feedback:** Incluye una terminal móvil integrada (estilo CLI fluida). El agente puede sugerir comandos en su HUD que el usuario autocompleta con un clic y ejecuta de forma segura en la computadora host. El resultado (stdout/stderr) es devuelto automáticamente a la IA en un ciclo de "Auto-Feedback".
- **Directorio Dinámico (CWD):** El sistema permite al agente inyectar dinámicamente un `directorio_objetivo` en sus recomendaciones, ejecutando los comandos de manera remota exactamente en la ruta del proyecto activo del PC host, sin importar dónde se levantó el servidor Node.
- **Persistencia Robusta:** Todo el flujo del historial conversacional se respalda permanentemente utilizando `sqlite3-tab` y `dbtabla` (en `antigravity.sqlite`), por lo que recargar o regresar al móvil restaura el chat intacto sin pérdida de contexto ni del formato rico visual.
- **Interacción Bidireccional Segura:** Comunicación Socket.io ultrarrápida observando los cambios locales del IDE a través de wrappers seguros sin comprometer datos nativos. Todo bajo un sistema de autenticación por sesión (`express-session`).

## 🚀 Requisitos e Instalación

### Prerrequisitos
- **Node.js**: Versión 16+ recomendada.
- **IDE Activo**: Antigravity activo y listo para inyección de texto.
- **SO**: Funcional en Windows / Ambientes Genéricos con Bash/PowerShell.

### Instalación Rápida
1. Clona el proyecto en tu máquina.
2. Instala el motor de persistencia y sockets:
   ```bash
   npm install express socket.io express-session express-socket.io-session dotenv sqlite3-tab dbtabla
   ```
3. Configura tu `.env` (credenciales y paths).
   ```env
   APP_PASSWORD=TuClaveMaestra
   # Para scripts o integración legacy de entorno
   AG_PATH='C:\ruta\de\tu\ide\antigravity.cmd'
   ```
4. Inicia la estación:
   ```bash
   node server.js
   ```

## 📱 Guía de Uso Integral
1. Abre `http://<IP-LOCAL>:3000` en tu móvil y digita tu Password Maestra.
2. Comienza a interactuar. Tu teléfono inyectará texto al archivo o programa IDE físico.
3. El Agente Inteligente te responderá con módulos enriquecidos (Markdown, Listas de tareas, etc).
4. Cuando el Agente te sugiera un bloque de código o un comando de sistema (ej. `npm run dev`), toca "⚡ Autocompletar Terminal" en el HUD de tu celular.
5. El servidor host ejecutará el script invisiblemente y re-inyectará la respuesta natural de tu consola directo al Agente permitiéndole corregir sus propios errores o confirmar el éxito de forma autónoma.

## 🔭 Futuro: De "Servidor" a "Extensión Nativa"
La arquitectura actual (Standalone Node Process + SQLite) ha sido designada como la *Semilla Maestro* (`antigravity_extension_blueprint.md`). 
El objetivo arquitectónico futuro es embeber todo el Backend WebSockets como un plugin de IDE (ej. VSCode Extension / Antigravity Plugin), sustituyendo `child_process.exec` por la inyección CLI nativa del editor y añadiendo emparejamiento automático por código QR local.
