Param(
    [string]$SourceDir = "deploy",
    [string]$ZipPath   = "portfolio-deploy.zip"
)

$ErrorActionPreference = "Stop"

if (Test-Path $ZipPath) { Remove-Item $ZipPath -Force }

$src = (Resolve-Path $SourceDir).Path
$zipFull = Join-Path (Get-Location) $ZipPath

Add-Type -Assembly System.IO.Compression
Add-Type -Assembly System.IO.Compression.FileSystem

$stream  = [System.IO.File]::Open($zipFull, [System.IO.FileMode]::CreateNew)
$archive = New-Object System.IO.Compression.ZipArchive($stream, [System.IO.Compression.ZipArchiveMode]::Create)

try {
    $files = Get-ChildItem -Path $src -Recurse -File -Force
    $i = 0
    foreach ($f in $files) {
        $rel = $f.FullName.Substring($src.Length + 1).Replace("\", "/")
        $entry = $archive.CreateEntry($rel, [System.IO.Compression.CompressionLevel]::Optimal)
        $es = $entry.Open()
        try {
            $fs = [System.IO.File]::OpenRead($f.FullName)
            try { $fs.CopyTo($es) } finally { $fs.Dispose() }
        } finally { $es.Dispose() }
        $i++
        if ($i % 500 -eq 0) { Write-Host "Packed $i files..." }
    }
    Write-Host "Total files packed: $i"
}
finally {
    $archive.Dispose()
    $stream.Dispose()
}

$sizeMb = "{0:N2}" -f ((Get-Item $zipFull).Length / 1MB)
Write-Host "Zip created: $zipFull  ($sizeMb MB)"
