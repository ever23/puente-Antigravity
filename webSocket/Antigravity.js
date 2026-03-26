const fs = require('fs');
const path = require('path');
const sqlite3Tab = require('sqlite3-tab');

// Configuración de base de datos
const dbPath = path.join(__dirname, '../antigravity.sqlite');
const db = new sqlite3Tab(dbPath);
db.pathModels(path.join(__dirname, '../model'));
const historyTable = db.tabla('chat_history');
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

        // Cargar historial al conectar { _limit: 50, _sort: 'id ASC' }
        historyTable.select(null, null, null, null, null, null, "id ASC", 50)
            .then(rows => {
                if (rows && rows.length > 0) {
                    socket.emit('chat_history', rows);
                }
            })
            .catch(err => console.error('[DB] Error cargando historial:', err));

        // Función interna para inyectar un promt al IDE
        const injectToIDE = (prompt, label) => {
            const hiddenInstruction = `\n\n[SISTEMA: Formatea tu respuesta estrictamente como JSON (con campos "mensaje", "estado", "plan", opcionalmente "comando_sugerido" y opcionalmente "directorio_objetivo" indicando la ruta absoluta del workspace si el comando lo requiere). SIEMPRE que desees ejecutar un comando de terminal, NO uses tus herramientas internas; envíalo ÚNICAMENTE mediante el campo "comando_sugerido" para que el usuario sea quien lo ejecute desde su móvil. Guarda este JSON completo en el archivo "${RESPONSE_FILE}" usando el tool de escritura de archivos.]`;
            const fullPrompt = prompt + hiddenInstruction;

            // Guardar prompt del usuario en el historial
            historyTable.insert({ role: 'user', content: prompt })
                .catch(err => console.error('[DB] Error guardando prompt:', err.sql));

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
        socket.on('execute_terminal_command', ({ command, cwd }) => {
            if (!command) return;
            
            // Ejecutamos en la ruta provista por el JSON del agente, o en su defecto en la del servidor
            const targetDir = cwd || process.cwd();
            console.log(`[WS] Ejecutando comando de terminal en: "${targetDir}"`);
            
            socket.emit('terminal_status', { message: `⏳ Ejecutando comando en ${targetDir}...` });

            exec(command, { cwd: targetDir }, (error, stdout, stderr) => {
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

        // --- Sincronización Agente -> Móvil ---
        // Observamos el archivo response.json para enviar las respuestas al móvil
        fs.watchFile(RESPONSE_FILE, { interval: 500 }, (curr, prev) => {
            if (curr.mtime > prev.mtime) {
                try {
                    const content = fs.readFileSync(RESPONSE_FILE, 'utf8');
                    const json = JSON.parse(content);

                    // Guardar respuesta del agente en el historial
                    if (json.mensaje) {
                        historyTable.insert({ role: 'agent', content: content })
                            .catch(err => console.error('[DB] Error guardando respuesta:', err.sql));
                    }

                    console.log(`[WS] Respuesta del agente recibida (${content.length} chars) → emitiendo a clientes`);
                    socket.emit('agent_response', json);
                } catch (e) {
                    console.error('[WS] Error procesando response.json:', e.message);
                }
            }
        });

        // --- Sincronización Agente -> Móvil ---
        // Observamos el archivo response.json para enviar las respuestas al móvil
        fs.watchFile(RESPONSE_FILE, { interval: 500 }, (curr, prev) => {
            if (curr.mtime > prev.mtime) {
                try {
                    const content = fs.readFileSync(RESPONSE_FILE, 'utf8');
                    const json = JSON.parse(content);

                    // Guardar respuesta del agente en el historial
                    if (json.mensaje) {
                        historyTable.insert({ role: 'agent', content: json.mensaje })
                            .catch(err => console.error('[DB] Error guardando respuesta:', err));
                    }

                    console.log(`[WS] Respuesta del agente recibida (${content.length} chars) → emitiendo a clientes`);
                    socket.emit('agent_response', json);
                } catch (e) {
                    console.error('[WS] Error procesando response.json:', e.message);
                }
            }
        });
    });
}