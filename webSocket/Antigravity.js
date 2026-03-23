const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

module.exports = (io, RESPONSE_FILE) => {
    io.on('connection', (socket) => {
        if (socket.handshake.session && socket.handshake.session.isLoggedIn) {
            console.log("✅ Usuario autenticado en Socket");


        } else {
            socket.emit('logout', { message: '¡No tiene credenciales validas!' });
            console.log("❌ Intento de conexión sin login");
            socket.disconnect();
            return;
        }
        console.log(`[WS] Cliente conectado: ${socket.id}`);
        socket.emit('connected', { message: '¡Conectado al Puente Antigravity!' });

        socket.on('send_prompt', ({ prompt }) => {
            if (!prompt) return;
            console.log(`[WS] Prompt recibido: "${prompt}"`);

            const hiddenInstruction = `\n\n[SISTEMA: Formatea tu respuesta estrictamente como JSON (con campos "mensaje", "estado", "plan"). Guarda este JSON completo en el archivo "${RESPONSE_FILE}" usando el tool de escritura de archivos.]`;

            const fullPrompt = prompt + hiddenInstruction;


            let command = '';
            if (process.platform === 'win32') {
                const scriptPath = path.join(__dirname, 'inject.ps1');
                command = `powershell -NoProfile -ExecutionPolicy Bypass -File "${scriptPath}"`;
                socket.emit('prompt_sent', { message: 'Prompt enviado (Windows), esperando respuesta...' });
            } else if (process.platform === 'linux') {
                const scriptPath = path.join(__dirname, 'inject.sh');
                command = `bash "${scriptPath}"`;
                socket.emit('prompt_sent', { message: 'Prompt enviado (Linux), esperando respuesta...' });
            } else {
                console.error(`[WS] Plataforma SO no soportada (${process.platform})`);
                return socket.emit('error', { message: `Plataforma SO no soportada (${process.platform})` });
            }

            exec(command, { env: { ...process.env, PROMPT_TEXT: fullPrompt } }, (error) => {
                if (error) {
                    console.error(`[WS] Error al inyectar: ${error.message}`);
                    socket.emit('error', { message: 'No se pudo enfocar Antigravity.' });
                } else {
                    console.log('[WS] Prompt inyectado exitosamente.');
                }
            });
        });

        socket.on('disconnect', () => {
            console.log(`[WS] Cliente desconectado: ${socket.id}`);
        });
    });

}