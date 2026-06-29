# fix-docker.ps1
Write-Host "=== CREATING DOCKERFILE FOR RAILWAY ===" -ForegroundColor Cyan

# 1. Tạo Dockerfile
Write-Host "[1/3] Creating Dockerfile..." -ForegroundColor Yellow
@"
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .
RUN npm run build

RUN npm install -g serve

EXPOSE 3000

CMD ["serve", "-s", "build", "-l", "3000"]
"@ | Out-File -FilePath Dockerfile -Encoding UTF8

# 2. Tạo .dockerignore
Write-Host "[2/3] Creating .dockerignore..." -ForegroundColor Yellow
@"
node_modules
npm-debug.log
build
.git
.env
*.log
.DS_Store
"@ | Out-File -FilePath .dockerignore -Encoding UTF8

# 3. Commit và push
Write-Host "[3/3] Committing..." -ForegroundColor Yellow
git add Dockerfile .dockerignore
git commit -m "fix: use Dockerfile for Railway deployment"

Write-Host "`n=== DONE! ===" -ForegroundColor Green
Write-Host "Now run:" -ForegroundColor Cyan
Write-Host "git push" -ForegroundColor White
Write-Host "`nThen on Railway:" -ForegroundColor Cyan
Write-Host "1. Settings -> Build Settings" -ForegroundColor White
Write-Host "2. Builder: Chọn 'Dockerfile'" -ForegroundColor White
Write-Host "3. Clear Build Cache" -ForegroundColor White
Write-Host "4. Deploy" -ForegroundColor White
