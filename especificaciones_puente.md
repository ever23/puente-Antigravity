# Especificaciones: Puente-Antigravity

Este documento detalla la arquitectura y el plan de implementación para el proyecto "Puente-Antigravity", el cual permite controlar el IDE de forma remota desde un dispositivo móvil.

## 1. Arquitectura del Sistema

El flujo de información sigue este recorrido:

1.  **Cliente (Termux en Android):** El usuario envía un prompt utilizando `curl`.
2.  **Red Local (Wi-Fi):** La petición HTTP viaja por la red local hacia la IP de la PC.
3.  **Servidor (Node.js + Express):** Escucha en un puerto específico (ej. 3000), procesa el JSON entrante y valida el contenido.
4.  **Inyección (CLI de Antigravity):** El servidor ejecuta un comando de sistema (`child_process`) utilizando la CLI nativa del IDE.
5.  **Interfaz (IDE):** El IDE recibe la instrucción, la registra en el historial de chat y ejecuta la tarea correspondiente (generación de código, refactorización, etc.).

### Diagrama de Flujo
`Termux (curl) -> HTTP POST -> Node.js (Express) -> Antigravity CLI -> GUI del IDE`

---

## 2. Propuesta de Integración (Sincronización de Chat)

Para asegurar que los comandos ejecutados remotamente aparezcan en la interfaz gráfica (GUI) de Antigravity y se mantengan en el historial de la sesión, se propone el siguiente método:

**Uso de la CLI con flag de prompt:**
Node.js ejecutará el binario de Antigravity pasando el prompt como argumento.
```bash
antigravity.cmd --prompt "Tu instrucción desde el móvil"
```
*Si la CLI nativa no soporta directamente el flag `--prompt`, se utilizará el sistema de comandos de VS Code (en el cual se basa Antigravity):*
```bash
antigravity.cmd --command "antigravity.sendToChat" --args '{"message": "..."}'
```

**Beneficios:**
-   **Consistencia:** El chat se comporta exactamente igual que si se hubiera escrito localmente.
-   **Persistencia:** La sesión guarda el historial automáticamente en los archivos locales del IDE.

---

## 3. Definición de la API

### Endpoint: `POST /api/prompt`

**Cuerpo de la petición (JSON):**
```json
{
  "prompt": "Crea una función en JS para calcular el área de un círculo",
  "context": "optional_file_path"
}
```

**Respuesta Exitosa (200 OK):**
```json
{
  "status": "success",
  "message": "Prompt enviado al IDE correctamente"
}
```

---

## 4. To-Do: Primeros pasos para `server.js`

- [ ] **Configuración Inicial:**
    - Instalar dependencias (`npm install express`).
    - Configurar el servidor básico en el puerto 3000.
- [ ] **Middleware de Seguridad:**
    - (Opcional) Implementar un token sencillo para evitar peticiones no autorizadas en la red local.
- [ ] **Lógica de Ejecución:**
    - Importar `child_process`.
    - Crear la función que mapee el JSON recibido al comando de la CLI.
    - Asegurar que la ruta al binario de Antigravity esté correctamente configurada en el entorno.
- [ ] **Pruebas de Conectividad:**
    - Probar el endpoint localmente con Postman o `curl`.
    - Probar el envío desde Termux usando la IP privada de la PC.
