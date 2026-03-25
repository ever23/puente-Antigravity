#!/bin/bash
# Dependencias necesarias en Linux: sudo apt install wmctrl xdotool xclip

if ! command -v wmctrl &> /dev/null || ! command -v xdotool &> /dev/null || ! command -v xclip &> /dev/null; then
    echo "ERROR: Faltan utilidades de automatización en Linux."
    echo "Por favor instálalas ejecutando: sudo apt install wmctrl xdotool xclip"
    exit 1
fi

# Busca la ventana del IDE Antigravity y la pone en primer plano
wmctrl -a "Antigravity" || { echo "No se encontró la ventana del IDE Antigravity"; exit 1; }

# Pequeña pausa para asegurar que el entorno capturó foco
sleep 0.8

# Pegar la variable de entorno PROMPT_TEXT en el portapapeles
echo -n "$PROMPT_TEXT" | xclip -selection clipboard

# Simular Ctrl+L para garantizar que la caja del chat obtiene el foco
xdotool key ctrl+l
sleep 0.2

# Simular Ctrl+V y Enter
xdotool key ctrl+v
sleep 0.4
xdotool key Return
