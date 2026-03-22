# Guía de Uso: Puente-Antigravity

Esta guía explica cómo configurar y utilizar el puente para enviar prompts desde tu teléfono (Termux) hacia tu PC con el IDE Antigravity.

## 1. Configuración en la PC (Servidor)

### Requisitos:
- Node.js instalado.
- Antigravity instalado.

### Pasos:
1.  Asegúrate de estar en el directorio del proyecto: `c:\programacion\puente-Antigravity`.
2.  Instala las dependencias (solo la primera vez):
    ```powershell
    npm install express
    ```
3.  Inicia el servidor:
    ```powershell
    node server.js
    ```
    *El servidor estará escuchando en el puerto 3000.*

4.  **Encuentra tu dirección IP local:**
    - Abre una nueva terminal en la PC y ejecuta: `ipconfig`
    - Busca la línea que dice `Dirección IPv4` (ejemplo: `192.168.1.15`). Esta es la IP que usarás en el teléfono.

---

## 2. Uso desde el Teléfono (Termux)

Asegúrate de que tu teléfono y tu PC estén conectados a la **misma red Wi-Fi**.

### Comando para enviar un prompt:
Desde Termux, usa el siguiente comando `curl`. Reemplaza `<IP_DE_TU_PC>` con la dirección que encontraste en el paso anterior.

```bash
curl -X POST -H "Content-Type: application/json" \
     -d '{"prompt": "Escribe un script en Python que salude al mundo"}' \
     http://<IP_DE_TU_PC>:3000/api/prompt
```

### ¿Qué esperar?
- El servidor en la PC recibirá el prompt.
- Verás un mensaje en la consola de la PC: `Recibido prompt: "..."`.
- Antigravity procesará la instrucción y la mostrará en el historial de chat del IDE, tal como si la hubieras escrito directamente.

---

## 3. Resolución de Problemas

- **Error de conexión (Timeout):** Verifica que el firewall de Windows permita conexiones en el puerto 3000 o intenta desactivarlo temporalmente para la red privada.
- **Ruta del binario:** Si el IDE no recibe nada pero el servidor dice "success", verifica que la ruta `AG_PATH` en `server.js` sea la correcta para tu instalación de Antigravity.
