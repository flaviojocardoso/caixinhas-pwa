# 📦 Caixinhas – Gestão Financeira Inteligente

🔗 **Acesse online:** https://contascaixinhas.netlify.app/

O **Caixinhas** é uma aplicação PWA (Progressive Web App) criada para ajudar pequenos empreendedores e autônomos a organizarem suas finanças através de metas financeiras inteligentes.

O grande diferencial está no seu **Algoritmo de Priorização Financeira**, que distribui automaticamente valores disponíveis com base em urgência e proximidade de vencimento.

---

## 🧠 Diferencial Técnico

O sistema opera em dois modos:

### 🟢 Modo Abundância
Quando o valor disponível cobre todas as metas:
- Todas as metas são quitadas automaticamente
- O sistema calcula e exibe o saldo livre restante

### 🔴 Modo Escassez (Algoritmo de Peso Dinâmico)
Quando o valor é insuficiente:
- Contas vencidas recebem prioridade máxima
- Contas com menos de 3 dias têm peso triplicado
- Distribuição proporcional baseada em urgência e valor restante
- Depósito mínimo de R$ 1,00 para evitar fragmentação irrelevante

---

## 🚀 Funcionalidades

- ✅ Distribuição Inteligente de Valores
- 📱 Instalável como App (PWA)
- 🌙 Dark & Light Mode
- 📄 Geração de Relatórios em PDF
- 🔒 Armazenamento local (Privacidade total)
- ⚡ Funciona offline (Service Worker)

---

## 🛠️ Tecnologias

- HTML5
- CSS3 (Variáveis + Temas Dinâmicos)
- JavaScript Vanilla
- Service Workers
- LocalStorage

---

## 🎯 Caso de Uso Real

Este projeto nasceu da necessidade real de organizar as finanças de uma barbearia, unindo gestão financeira prática com desenvolvimento de software.

---

## 📦 Instalação Local

```bash
git clone https://github.com/flaviojocardoso/caixinhas-pwa.git
