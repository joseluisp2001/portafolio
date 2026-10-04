# Convierte los .docx de public/documentos/ a .doc (Word 97-2003) usando Word.
#
#   powershell -NoProfile -ExecutionPolicy Bypass -File scripts/word-a-doc.ps1
#   (o "pnpm word", que antes genera los .docx)
#
# Por que con Word y no con una biblioteca: el .doc es un formato binario
# cerrado. El unico que lo escribe bien es Word, y es el que va a abrir el
# reclutador. Necesita Word instalado (en esta PC esta la version 16).
#
# Tambien avisa cuantas paginas tiene cada uno: un CV de mas de dos paginas
# se lee peor, y el cambio suele pasar sin que nadie lo note.
#
# Este archivo va solo en ASCII: PowerShell 5.1 lee los .ps1 sin BOM como
# ANSI y rompe las tildes.

$ErrorActionPreference = 'Stop'
$carpeta = Join-Path $PSScriptRoot '..\public\documentos' | Resolve-Path

$wdFormatDocument97 = 0
$wdStatisticPages = 2

$word = New-Object -ComObject Word.Application
try {
    $word.Visible = $false
    $word.DisplayAlerts = 0

    foreach ($docx in Get-ChildItem -Path $carpeta -Filter '*.docx') {
        $doc = $word.Documents.Open($docx.FullName, $false, $true, $false)
        try {
            $paginas = $doc.ComputeStatistics($wdStatisticPages)
            $destino = [IO.Path]::ChangeExtension($docx.FullName, '.doc')
            $doc.SaveAs2($destino, $wdFormatDocument97)
            '  {0} -> {1}  ({2} paginas)' -f $docx.Name, (Split-Path $destino -Leaf), $paginas
        }
        finally {
            $doc.Close($false)
        }
    }
}
finally {
    $word.Quit()
    [void][Runtime.InteropServices.Marshal]::ReleaseComObject($word)
}
