const express = require('express');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const port = 3000;

app.use(express.json());
app.use(express.static('public'));

const AG_PATH = 'C:\\Users\\HP 430 G6\\AppData\\Local\\Programs\\Antigravity\\bin\\antigravity.cmd';
const RESPONSE_FILE = path.join(__dirname, 'response.txt');

// Limpiar respuesta al iniciar
try { fs.writeFileSync(RESPONSE_FILE, ''); } catch (e) { }

// Observar el archivo de respuesta y emitir via WebSocket cuando cambie
let responseWatcher = null;
let debounceTimer = null;

function startResponseWatcher() {
    if (responseWatcher) return; // Ya está activo
    responseWatcher = fs.watch(RESPONSE_FILE, () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            try {
                const response = fs.readFileSync(RESPONSE_FILE, 'utf-8').trim();
                if (response) {
                    console.log(`[WS] Respuesta del agente recibida (${response.length} chars) → emitiendo a clientes`);
                    io.emit('agent_response', { response });
                    fs.writeFileSync(RESPONSE_FILE, ''); // Limpiar para próxima respuesta
                }
            } catch (e) { }
        }, 1500);
    });
}

startResponseWatcher();

// WebSocket: gestión de conexiones
io.on('connection', (socket) => {
    console.log(`[WS] Cliente conectado: ${socket.id}`);
    socket.emit('connected', { message: '¡Conectado al Puente Antigravity!' });

    socket.on('send_prompt', ({ prompt }) => {
        if (!prompt) return;
        console.log(`[WS] Prompt recibido: "${prompt}"`);

        const hiddenInstruction = `\n\n[SISTEMA: Después de responder al usuario, guarda tu respuesta completa en el archivo "${RESPONSE_FILE}" usando el tool de escritura de archivos. Todo el contenido de la respuesta e instucciones junto con el plan si lo hay.]`;

        const fullPrompt = prompt + hiddenInstruction;

        const psScript = `
        Add-Type -AssemblyName System.Windows.Forms
        Add-Type @"
        using System;
        using System.Diagnostics;
        using System.Runtime.InteropServices;
        using System.Text;
        public class Win32 {
            public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);
            [DllImport("user32.dll")] public static extern bool EnumWindows(EnumWindowsProc enumProc, IntPtr lParam);
            [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint processId);
            [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
            [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
            [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr hWnd);
            [DllImport("user32.dll", CharSet = CharSet.Auto)] public static extern int GetWindowText(IntPtr hWnd, StringBuilder sb, int max);
            
            public static bool ActivateIDE() {
                bool found = false;
                EnumWindows((hWnd, lParam) => {
                    if (IsWindowVisible(hWnd)) {
                        StringBuilder sb = new StringBuilder(256);
                        GetWindowText(hWnd, sb, 256);
                        if (sb.Length > 0) {
                            uint pid;
                            GetWindowThreadProcessId(hWnd, out pid);
                            try {
                                Process p = Process.GetProcessById((int)pid);
                                if (p.ProcessName.IndexOf("Antigravity", StringComparison.OrdinalIgnoreCase) >= 0) {
                                    ShowWindow(hWnd, 5); // SW_SHOW
                                    SetForegroundWindow(hWnd);
                                    found = true;
                                    return false;
                                }
                            } catch {}
                        }
                    }
                    return true;
                }, IntPtr.Zero);
                return found;
            }
        }
"@

        $found = [Win32]::ActivateIDE()
        
        if ($found) {
            Start-Sleep -Milliseconds 800
            Set-Clipboard -Value $env:PROMPT_TEXT
            [System.Windows.Forms.SendKeys]::SendWait("^v")
            Start-Sleep -Milliseconds 400
            [System.Windows.Forms.SendKeys]::SendWait("{ENTER}")
        } else {
            Write-Error "No se encontro la ventana nativa de Antigravity"
            exit 1
        }
        `;

        const scriptPath = path.join(__dirname, 'inject.ps1');
        fs.writeFileSync(scriptPath, psScript);
        const command = `powershell -NoProfile -ExecutionPolicy Bypass -File "${scriptPath}"`;

        // Notificar al cliente que el prompt fue enviado
        socket.emit('prompt_sent', { message: 'Prompt enviado al agente, esperando respuesta...' });

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

// Endpoint REST legado (por compatibilidad)
app.post('/api/prompt', (req, res) => {
    res.json({ status: 'info', message: 'Usa WebSocket (socket.io) para comunicación en tiempo real.' });
});

server.listen(port, '0.0.0.0', () => {
    console.log(`Servidor Puente-Antigravity escuchando en http://0.0.0.0:${port}`);
    console.log(`Usa tu IP local para conectar desde el móvil (ej: http://192.168.1.X:3000)`);
});
