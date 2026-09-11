# Namecheap / cPanel deploy bundle for Next.js standalone.
# Usage: powershell -ExecutionPolicy Bypass -File scripts/package-namecheap.ps1
#        powershell -ExecutionPolicy Bypass -File scripts/package-namecheap.ps1 -SkipBuild
#
# Prefer scripts/package-hotfix.ps1 for routine changes â€” it uploads only the
# files that actually differ from what is already on the server. -NoZip stages
# the deploy/ folder without building the large archives (used by the hotfix
# script).

param(
    [switch]$SkipBuild,
    [switch]$NoZip
)

$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

# Must stay ".next": `output: "standalone"` nests the dist directory inside the
# standalone bundle and records its name in required-server-files.json, so
# building elsewhere produces a deploy tree the server cannot start from.
#
# Consequence: stop any `next dev` server before packaging. They share .next,
# and a build replaces the chunks the dev server is serving.
$build = ".next"

if (-not $SkipBuild) {
    # The trace-copy step at the end of `next build` intermittently hits EBUSY
    # on Windows when a virus scanner still holds a freshly written chunk
    # (usually a .wasm). Clearing the previous standalone output and retrying
    # clears it; the compile itself is deterministic.
    $attempts = 3
    for ($i = 1; $i -le $attempts; $i++) {
        if (Test-Path "$build\standalone") {
            Remove-Item "$build\standalone" -Recurse -Force -ErrorAction SilentlyContinue
        }
        Write-Host "Building into $build (attempt $i of $attempts)..."
        npm run build
        if ($LASTEXITCODE -eq 0) { break }
        if ($i -eq $attempts) { throw "next build failed after $attempts attempts." }
        Write-Host "Build failed; retrying in 5s..."
        Start-Sleep -Seconds 5
    }
} elseif (-not (Test-Path "$build\standalone\server.js")) {
    throw "SkipBuild was set but $build/standalone/server.js is missing."
}

$dest = "deploy"
if (Test-Path $dest) { Remove-Item $dest -Recurse -Force }
New-Item -ItemType Directory -Path $dest | Out-Null

Write-Host "Copying standalone output..."
robocopy "$build\standalone" $dest /E /NFL /NDL /NJH /NJS /NP | Out-Null

Write-Host "Merging .next/static..."
New-Item -ItemType Directory -Path "$dest\.next" -Force | Out-Null
robocopy "$build\static" "$dest\.next\static" /E /NFL /NDL /NJH /NJS /NP | Out-Null

Write-Host "Copying static to public/_next/static (cPanel-safe fallback)..."
New-Item -ItemType Directory -Path "$dest\public\_next\static" -Force | Out-Null
robocopy "$build\static" "$dest\public\_next\static" /E /NFL /NDL /NJH /NJS /NP | Out-Null
New-Item -ItemType Directory -Path "$dest\.data" -Force | Out-Null

$productionSiteUrl = "https://mazharhayat.live"
if (Test-Path ".data\admin-store.json") {
    Write-Host "Copying admin settings (.data/admin-store.json)..."
    Copy-Item ".data\admin-store.json" "$dest\.data\admin-store.json" -Force
} else {
    Write-Host 'No local .data/admin-store.json - deploy includes empty store (run /admin/setup on server).'
    '{"settings":{},"posts":[],"linkedinAuth":null}' | Set-Content "$dest\.data\admin-store.json" -Encoding UTF8
}

Write-Host "Patching admin store for production (bcrypt password, site URL)..."
node scripts/patch-admin-store-for-deploy.mjs "$dest\.data\admin-store.json"
if ($LASTEXITCODE -ne 0) { throw "admin-store patch failed." }

Copy-Item "next.config.mjs" "$dest\next.config.mjs" -Force

if (-not (Test-Path "$dest\node_modules\bcryptjs")) {
    Write-Host "Copying bcryptjs into standalone node_modules..."
    New-Item -ItemType Directory -Path "$dest\node_modules" -Force | Out-Null
    robocopy "node_modules\bcryptjs" "$dest\node_modules\bcryptjs" /E /NFL /NDL /NJH /NJS /NP | Out-Null
}

$staticCount = (Get-ChildItem "$dest\.next\static" -Recurse -File).Count
$publicStaticCount = (Get-ChildItem "$dest\public\_next\static" -Recurse -File).Count
if (-not (Test-Path "$dest\server.js")) { throw "Missing server.js in deploy folder." }
if ($staticCount -lt 50) { throw ".next/static looks incomplete ($staticCount files)." }
if ($publicStaticCount -lt 50) { throw "public/_next/static looks incomplete ($publicStaticCount files)." }

Write-Host "Copying public assets..."
robocopy "public" "$dest\public" /E /XD "_next" /NFL /NDL /NJH /NJS /NP | Out-Null
# Re-merge _next/static after public copy (robocopy /E merges into existing public/)
robocopy "$build\static" "$dest\public\_next\static" /E /NFL /NDL /NJH /NJS /NP | Out-Null

@"
NAMECHEAP DEPLOY CHECKLIST
==========================

1. File Manager -> Settings -> tick "Show Hidden Files (dotfiles)"
2. Go to /home/mazhkews/portfolio/
3. Delete OLD files EXCEPT .data/ if you want to keep LIVE admin settings
4. Upload portfolio-deploy.zip
5. Extract INTO portfolio/ (not into a subfolder)
6. VERIFY these paths exist:
   portfolio/public/_next/static/css/*.css
   portfolio/.data/admin-store.json   (admin password, Groq key, LinkedIn tokens)
   (Turso uses built-in fetch â€” no node_modules/@libsql required)
7. Setup Node.js App -> startup file: server.js -> Restart
8. Do NOT click "Run NPM Install"

Quick CSS/JS fix only: upload public-static-fix.zip and extract into portfolio/
"@ | Set-Content "$dest\DEPLOY-NAMECHEAP.txt" -Encoding UTF8

function New-LinuxZip($SourceDir, $ZipPath) {
    if (Test-Path $ZipPath) { Remove-Item $ZipPath -Force }
    $src = (Resolve-Path $SourceDir).Path
    $zipFull = Join-Path (Get-Location) $ZipPath
    Add-Type -Assembly System.IO.Compression
    Add-Type -Assembly System.IO.Compression.FileSystem
    $stream = [System.IO.File]::Open($zipFull, [System.IO.FileMode]::CreateNew)
    $archive = New-Object System.IO.Compression.ZipArchive($stream, [System.IO.Compression.ZipArchiveMode]::Create)
    try {
        foreach ($f in (Get-ChildItem -Path $src -Recurse -File -Force)) {
            $rel = $f.FullName.Substring($src.Length + 1).Replace("\", "/")
            $entry = $archive.CreateEntry($rel, [System.IO.Compression.CompressionLevel]::Optimal)
            $es = $entry.Open()
            try {
                $fs = [System.IO.File]::OpenRead($f.FullName)
                try { $fs.CopyTo($es) } finally { $fs.Dispose() }
            } finally { $es.Dispose() }
        }
    } finally {
        $archive.Dispose()
        $stream.Dispose()
    }
    return $zipFull
}

if ($NoZip) {
    Write-Host ""
    Write-Host "Staged deploy/ without archives (-NoZip)."
    Write-Host "  static files bundled: $staticCount (.next) + $publicStaticCount (public)"
    exit 0
}

Write-Host "Creating portfolio-deploy.zip..."
New-LinuxZip $dest "portfolio-deploy.zip" | Out-Null
Copy-Item "portfolio-deploy.zip" "deploy-namecheap.zip" -Force

Write-Host "Creating public-static-fix.zip (public/_next/static only)..."
$publicStage = "public-static-stage"
if (Test-Path $publicStage) { Remove-Item $publicStage -Recurse -Force }
New-Item -ItemType Directory -Path "$publicStage\public\_next\static" -Force | Out-Null
robocopy "$dest\public\_next\static" "$publicStage\public\_next\static" /E /NFL /NDL /NJH /NJS /NP | Out-Null
New-LinuxZip $publicStage "public-static-fix.zip" | Out-Null
Remove-Item $publicStage -Recurse -Force

# Legacy name kept for compatibility
Write-Host "Creating next-static-fix.zip..."
$staticStage = "static-fix-stage"
if (Test-Path $staticStage) { Remove-Item $staticStage -Recurse -Force }
New-Item -ItemType Directory -Path "$staticStage\public\_next\static" -Force | Out-Null
robocopy "$dest\public\_next\static" "$staticStage\public\_next\static" /E /NFL /NDL /NJH /NJS /NP | Out-Null
New-LinuxZip $staticStage "next-static-fix.zip" | Out-Null
Remove-Item $staticStage -Recurse -Force

$mb = "{0:N2}" -f ((Get-Item "portfolio-deploy.zip").Length / 1MB)
Write-Host ""
Write-Host "Done."
Write-Host "  portfolio-deploy.zip   ($mb MB)  - full deploy"
Write-Host "  deploy-namecheap.zip   (copy)"
Write-Host "  public-static-fix.zip  - FAST FIX for CSS/JS 404 (extract into portfolio/)"
Write-Host "  static files bundled: $staticCount (.next) + $publicStaticCount (public)"

