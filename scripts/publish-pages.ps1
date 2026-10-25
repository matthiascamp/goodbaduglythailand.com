$ErrorActionPreference = 'Stop'
$repo = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Push-Location $repo
try {
    npm run build:pages
    if ($LASTEXITCODE -ne 0) { throw 'Static build failed.' }
    $stage = Join-Path ([System.IO.Path]::GetTempPath()) ('goodbadugly-pages-' + [guid]::NewGuid().ToString('N'))
    New-Item -ItemType Directory -Path $stage | Out-Null
    Copy-Item -Path (Join-Path $repo 'pages-dist\*') -Destination $stage -Recurse
    New-Item -ItemType File -Path (Join-Path $stage '.nojekyll') | Out-Null
    git -C $stage init -b gh-pages
    if ($LASTEXITCODE -ne 0) { throw 'Could not initialize publish branch.' }
    git -C $stage remote add origin 'https://github.com/matthiascamp/goodbaduglythailand.com.git'
    git -C $stage add --all
    git -C $stage commit -m 'Publish static site'
    if ($LASTEXITCODE -ne 0) { throw 'Could not commit the generated site.' }
    git -C $stage push --force origin HEAD:gh-pages
    if ($LASTEXITCODE -ne 0) { throw 'Could not push the generated site.' }
    Write-Host 'Published the generated site to gh-pages.'
} finally {
    Pop-Location
}
