# ── PowerShell script — run from your frontend/ folder ───────────────────────
# Open PowerShell, cd into your frontend folder, then paste this whole block.

$base = "https://github.com/justadudewhohacks/face-api.js/raw/master/weights"
$dest = ".\public\models"

New-Item -ItemType Directory -Force -Path $dest | Out-Null

$files = @(
    "tiny_face_detector_model-shard1",
    "tiny_face_detector_model-weights_manifest.json"
)

foreach ($f in $files) {
    $url = "$base/$f"
    $out = "$dest\$f"
    Write-Host "Downloading $f ..."
    Invoke-WebRequest -Uri $url -OutFile $out
}

Write-Host "Done! Frontend model files saved to $dest"
