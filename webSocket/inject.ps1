
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
            [DllImport("user32.dll")] public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, int dwExtraInfo);
            
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
                                    // Rompemos el bloqueo de foco de Windows simulando la pulsación de la tecla ALT
                                    keybd_event(0x12, 0, 0, 0); // Alt press
                                    keybd_event(0x12, 0, 2, 0); // Alt release
                                    
                                    ShowWindow(hWnd, 9); // SW_RESTORE (9) des-minimiza si estaba oculta
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
            [System.Windows.Forms.SendKeys]::SendWait("^l")
            Start-Sleep -Milliseconds 200
            [System.Windows.Forms.SendKeys]::SendWait("^v")
            Start-Sleep -Milliseconds 400
            [System.Windows.Forms.SendKeys]::SendWait("{ENTER}")
        } else {
            Write-Error "No se encontro la ventana nativa de Antigravity"
            exit 1
        }
        