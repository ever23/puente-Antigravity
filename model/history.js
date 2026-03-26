const model = require("tabla-model");

const history = new model("chat_history", [
    {
        name: "id",
        type: "integer",
        primary: true,
        autoincrement: true
    },
    {
        name: "role",
        type: "text"
    },
    {
        name: "content",
        type: "text"
    },
    {
        name: "timestamp",
        type: "datetime" // sqlite3-tab manejará la creación
    }
]);

// Datos iniciales (opcional, pero ayuda a verificar creación)
history.insert({
    role: "system",
    content: "Base de datos de historial inicializada."
});

module.exports = history;
