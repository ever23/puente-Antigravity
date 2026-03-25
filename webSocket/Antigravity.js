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

        // Función interna para inyectar un promt al IDE
        const injectToIDE = (prompt, label) => {
            const hiddenInstruction = `\n\n[SISTEMA: Formatea tu respuesta estrictamente como JSON (con campos "mensaje", "estado", "plan"). Guarda este JSON completo en el archivo "${RESPONSE_FILE}" usando el tool de escritura de archivos.]`;
            const fullPrompt = prompt + hiddenInstruction;

            let command = '';
            if (process.platform === 'win32') {
                const scriptPath = path.join(__dirname, 'inject.ps1');
                command = `powershell -NoProfile -ExecutionPolicy Bypass -File "${scriptPath}"`;
                socket.emit('prompt_sent', { message: `${label} (Windows)...` });
            } else if (process.platform === 'linux') {
                const scriptPath = path.join(__dirname, 'inject.sh');
                command = `bash "${scriptPath}"`;
                socket.emit('prompt_sent', { message: `${label} (Linux)...` });
            } else {
                return console.error(`[WS] Plataforma no soportada`);
            }

            exec(command, { env: { ...process.env, PROMPT_TEXT: fullPrompt } }, (error) => {
                if (error) console.error(`[WS] Error al inyectar: ${error.message}`);
                else console.log(`[WS] ${label} inyectado.`);
            });
        };

        socket.on('send_prompt', ({ prompt }) => {
            if (!prompt) return;
            console.log(`[WS] Prompt recibido: "${prompt}"`);
            injectToIDE(prompt, 'Prompt enviado');
        });

        // NUEVO: Ejecución de comandos de terminal con feedback al agente
        socket.on('execute_terminal_command', ({ command }) => {
            if (!command) return;
            console.log(`[WS] Ejecutando comando de terminal: "${command}"`);
            
            socket.emit('terminal_status', { message: '⏳ Ejecutando comando...' });

            exec(command, (error, stdout, stderr) => {
                const result = stdout || stderr || (error ? error.message : "Comando ejecutado (sin salida)");
                
                // 1. Enviar el resultado al móvil
                socket.emit('terminal_output', { output: result, isError: !!error });

                // 2. FeedBack Automático al Agente (esto es la magia)
                const feedbackPrompt = `SISTEMA (AUTO-FEEDBACK): El usuario ejecutó tu comando sugerido: \`${command}\`.\n\nResultado de la consola:\n\`\`\`\n${result}\n\`\`\`\nAnaliza este resultado y confirma al usuario si todo está correcto o si hay que hacer algo más.`;
                
                injectToIDE(feedbackPrompt, 'Feedback de terminal enviado');
            });
        });

        socket.on('disconnect', () => {
            console.log(`[WS] Cliente desconectado: ${socket.id}`);
        });
    });
}