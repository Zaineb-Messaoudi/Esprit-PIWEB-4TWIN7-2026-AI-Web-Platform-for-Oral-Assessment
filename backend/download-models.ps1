# ── PowerShell script — run from your backend/ folder ────────────────────────
# Open PowerShell, cd into your backend folder, then paste this whole block.

$base = "https://github.com/justadudewhohacks/face-api.js/raw/master/weights"
$dest = ".\models"

# Create models folder if it doesn't exist
New-Item -ItemType Directory -Force -Path $dest | Out-Null

$files = @(
    "face_landmark_68_tiny_model-shard1",
    "face_landmark_68_tiny_model-weights_manifest.json",
    "face_recognition_model-shard1",
    "face_recognition_model-shard2",
    "face_recognition_model-weights_manifest.json"
)

foreach ($f in $files) {
    $url  = "$base/$f"
    $out  = "$dest\$f"
    Write-Host "Downloading $f ..."
    Invoke-WebRequest -Uri $url -OutFile $out
}

Write-Host "Done! All model files saved to $dest"
