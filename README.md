# 👶 Boletim da Sofia

Aplicação web premium e moderna para acompanhamento e registo do desenvolvimento da bebé (marcos, peso, saúde, documentos e vacinas).

## 🐳 Docker / Unraid

A imagem oficial Docker é construída automaticamente e publicada no GitHub Container Registry (GHCR):

```text
ghcr.io/barroso88/boletim-sofia:latest
```

### Como Adicionar no Unraid (Docker Container)

1. No Unraid, vá ao separador **Docker** -> **Add Container**.
2. Preencha os seguintes campos:
   - **Name**: `boletim-sofia`
   - **Repository**: `ghcr.io/barroso88/boletim-sofia:latest`
   - **Network Type**: `bridge`
   - **Host Port 1**: `8085` (ou outra porta livre) -> **Container Port**: `80`
3. Clique em **Apply**!

### Docker Compose

```yaml
version: '3.8'

services:
  boletim-sofia:
    image: ghcr.io/barroso88/boletim-sofia:latest
    container_name: boletim-sofia
    ports:
      - "8085:80"
    restart: unless-stopped
```
