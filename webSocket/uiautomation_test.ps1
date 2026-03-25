Add-Type -AssemblyName UIAutomationClient
Add-Type -AssemblyName UIAutomationTypes

$processName = "Antigravity"
$process = Get-Process -Name $processName -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -ne 0 } | Select-Object -First 1

if (-not $process) {
    Write-Output "No se encontró el proceso Antigravity abierto."
    exit
}

$rootElement = [System.Windows.Automation.AutomationElement]::FromHandle($process.MainWindowHandle)

if (-not $rootElement) {
    Write-Output "No se pudo obtener el elemento raíz de la ventana."
    exit
}

Write-Output "Ventana root encontrada: $($rootElement.Current.Name)"
Write-Output "Escaneando el DOM visual expuesto al sistema (Documentos & Cajas de Texto)..."

# Buscamos elementos tipo Document o Edit
$editCondition = New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::ControlTypeProperty, [System.Windows.Automation.ControlType]::Edit)
$docCondition = New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::ControlTypeProperty, [System.Windows.Automation.ControlType]::Document)
$orCondition = New-Object System.Windows.Automation.OrCondition($editCondition, $docCondition)

# Buscamos globalmente de forma lenta por todo el DOM (Descendants)
$elements = $rootElement.FindAll([System.Windows.Automation.TreeScope]::Descendants, $orCondition)

Write-Output "--------------------------------------------------------"
Write-Output "Se detectaron $($elements.Count) controles validos receptores de texto."
Write-Output "--------------------------------------------------------"

for ($i = 0; $i -lt $elements.Count; $i++) {
    $elem = $elements[$i]
    $name = $elem.Current.Name
    $autoId = $elem.Current.AutomationId
    $class = $elem.Current.ClassName
    Write-Output "[$i] Nombre: '$name' | ID: '$autoId' | Clase: '$class'"
}
