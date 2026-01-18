#!/bin/bash

# Script de configuração do Cloudflare Tunnel
# Este script ajuda a configurar o Cloudflare Tunnel para seu projeto

set -e

echo "🚀 Configuração do Cloudflare Tunnel"
echo "======================================"
echo ""

# Verificar se cloudflared está instalado
if ! command -v cloudflared &> /dev/null; then
    echo "❌ cloudflared não encontrado!"
    echo ""
    echo "Instale o cloudflared primeiro:"
    echo "  Linux (Ubuntu/Debian):"
    echo "    wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb"
    echo "    sudo dpkg -i cloudflared-linux-amd64.deb"
    echo ""
    echo "  Ou use via Docker (não é necessário instalar localmente)"
    exit 1
fi

echo "✅ cloudflared encontrado"
echo ""

# Solicitar informações
read -p "Digite o nome do tunnel (ex: thomaz-navajas): " TUNNEL_NAME
read -p "Digite o hostname do seu domínio (ex: seu-dominio.com): " HOSTNAME

echo ""
echo "📝 Criando tunnel..."
cloudflared tunnel create "$TUNNEL_NAME"

# Obter o ID do tunnel
TUNNEL_ID=$(cloudflared tunnel list | grep "$TUNNEL_NAME" | awk '{print $1}')

if [ -z "$TUNNEL_ID" ]; then
    echo "❌ Erro ao criar ou encontrar o tunnel"
    exit 1
fi

echo "✅ Tunnel criado com ID: $TUNNEL_ID"
echo ""

# Criar diretório .cloudflared se não existir
mkdir -p .cloudflared

# Verificar se as credenciais existem
CREDENTIALS_FILE="$HOME/.cloudflared/$TUNNEL_ID.json"
if [ -f "$CREDENTIALS_FILE" ]; then
    echo "📋 Copiando credenciais..."
    cp "$CREDENTIALS_FILE" ".cloudflared/$TUNNEL_ID.json"
    echo "✅ Credenciais copiadas para .cloudflared/"
else
    echo "⚠️  Arquivo de credenciais não encontrado em $CREDENTIALS_FILE"
    echo "   As credenciais podem estar em outro local."
fi

echo ""
echo "📝 Atualizando cloudflared-config.yml..."

# Atualizar o arquivo de configuração
if [ -f "cloudflared-config.yml" ]; then
    sed -i.bak "s/<TUNNEL_ID>/$TUNNEL_ID/g" cloudflared-config.yml
    sed -i.bak "s/\${CLOUDFLARE_HOSTNAME:-seu-dominio.com}/$HOSTNAME/g" cloudflared-config.yml
    rm -f cloudflared-config.yml.bak 2>/dev/null || true
    echo "✅ Configuração atualizada"
else
    echo "⚠️  Arquivo cloudflared-config.yml não encontrado"
fi

echo ""
echo "🌐 Configurando DNS no Cloudflare..."
echo ""
echo "IMPORTANTE: Agora você precisa configurar o DNS no painel do Cloudflare:"
echo ""
echo "1. Acesse: https://dash.cloudflare.com"
echo "2. Selecione seu domínio"
echo "3. Vá em DNS > Records"
echo "4. Adicione um registro CNAME:"
echo "   - Type: CNAME"
echo "   - Name: @ (ou www para subdomínio)"
echo "   - Target: $TUNNEL_ID.cfargotunnel.com"
echo "   - Proxy status: Proxied (laranja)"
echo ""

# Criar ou atualizar .env.example
if [ ! -f ".env.example" ]; then
    echo "📝 Criando .env.example..."
    cat > .env.example << EOF
# Abacus AI (Obrigatórias)
ABACUS_DEPLOYMENT_TOKEN=seu_token_aqui
ABACUS_DEPLOYMENT_ID=seu_id_aqui

# Abacus AI (Opcionais)
ABACUS_API_KEY=sua_chave_opcional
ABACUS_API_URL=https://apps.abacus.ai

# Cloudflare Tunnel
CLOUDFLARE_CREDENTIALS_PATH=./.cloudflared
CLOUDFLARE_HOSTNAME=$HOSTNAME
EOF
    echo "✅ Arquivo .env.example criado"
fi

echo ""
echo "✅ Configuração concluída!"
echo ""
echo "📋 Próximos passos:"
echo "1. Configure o DNS no Cloudflare (veja instruções acima)"
echo "2. Crie um arquivo .env com suas variáveis de ambiente (use .env.example como base)"
echo "3. Execute: docker-compose up -d"
echo ""
echo "🔍 Para ver os logs: docker-compose logs -f"
