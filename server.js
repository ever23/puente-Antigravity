const express = require('express');
const sharedsession = require("express-socket.io-session");
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');
const Antigravity = require('./webSocket/Antigravity.js');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server);
const session = require('express-session');
const sessionMiddleware = session({
    secret: "antigravity_secret_key", // Usa una frase segura
    resave: true,
    saveUninitialized: true,
    cookie: { secure: false } // Ponlo en true solo si usas HTTPS
});
app.use(sessionMiddleware);
io.use(sharedsession(sessionMiddleware, {
    autoSave: true
}));

require('dotenv').config();
const port = 3000;

app.use(express.json());


const AG_PATH = process.env.AG_PATH;
const RESPONSE_FILE = path.join(__dirname, 'response.json');

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
                    // Limpiar para próxima respuesta
                    fs.writeFileSync(RESPONSE_FILE, '');
                }
            } catch (e) { }
        }, 1500);
    });
}

startResponseWatcher();


// WebSocket: gestión de conexiones
Antigravity(io, RESPONSE_FILE);
// Middleware de protección
const authRequired = (req, res, next) => {
    if (req.session.isLoggedIn) {
        next(); // Está logueado, puede pasar
    } else {
        res.redirect('/login.html'); // No está logueado, ¡al login!
    }
};

// Aplicar el guardián a la página principal
app.get('/', authRequired, (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

app.get('/index.html', authRequired, (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});
app.use(express.static('public'));
// Endpoint REST legado (por compatibilidad)
app.post('/api/prompt', (req, res) => {
    res.json({ status: 'info', message: 'Usa WebSocket (socket.io) para comunicación en tiempo real.' });
});
app.post('/api/logout', (req, res) => {
    // Destruimos la sesión en el servidor
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ status: 'error', message: 'No se pudo cerrar la sesión' });
        }

        // Limpiamos la cookie del lado del cliente
        res.clearCookie('connect.sid');

        // Respondemos éxito para que el AJAX sepa que puede redirigir
        res.status(200).json({ status: 'ok', message: 'Sesión terminada' });
    });
});
app.post('/api/login', (req, res) => {
    const { password } = req.body; // Extraemos la clave del cuerpo de la petición
    const masterPassword = process.env.APP_PASSWORD; // Obtenemos la clave del .env

    // Verificamos si la contraseña coincide
    if (password === masterPassword) {
        req.session.isLoggedIn = true;
        // Éxito: Enviamos status 200 para que el AJAX redirija
        return res.status(200).json({
            status: 'ok',
            message: 'Acceso concedido.'
        });
    } else {
        // Fallo: Enviamos status 401 (No autorizado)
        return res.status(401).json({
            status: 'error',
            message: 'Contraseña incorrecta.'
        });
    }
});


server.listen(port, '0.0.0.0', () => {
    console.log(`Servidor Puente-Antigravity escuchando en http://0.0.0.0:${port}`);
    console.log(`Usa tu IP local para conectar desde el móvil (ej: http://192.168.1.X:3000)`);
});
