# Planejamento Financeiro App

Aplicação web desenvolvida com React, Vite e Tailwind CSS para gerenciar orçamentos pessoais seguindo a regra 50/30/20, monitorar a evolução do fundo de reserva e gerenciar despesas diárias e fixas.

## Pré-requisitos

Para rodar este projeto, você precisará ter o Node.js e o npm (Node Package Manager) instalados na sua máquina local.

*   [Node.js (LTS recomendado)](https://nodejs.org/)

## Como instalar e rodar localmente

Siga os passos abaixo para baixar, instalar e rodar o projeto na sua máquina:

1. **Clone o repositório ou baixe o código-fonte:**

   Abra seu terminal/prompt de comando, e digite o comando abaixo (se estiver usando git):
   ```bash
   git clone <url-do-repositorio>
   cd <nome-do-repositorio>
   ```

2. **Instale as dependências:**
   No diretório raiz do projeto (onde está localizado o arquivo `package.json`), execute:
   ```bash
   npm install
   ```

3. **Inicie o servidor de desenvolvimento:**
   Após a instalação ser finalizada, rode o comando:
   ```bash
   npm run dev
   ```

4. **Acesse o aplicativo:**
   Abra seu navegador web e acesse o endereço fornecido no terminal (geralmente será algo como `http://localhost:3000` ou `http://localhost:5173`).

## Scripts Disponíveis

No diretório do projeto, você pode rodar os seguintes comandos:

*   `npm run dev` - Inicializa a aplicação em modo de desenvolvimento.
*   `npm run build` - Roda o build de produção, gerando os arquivos estáticos na pasta `dist`.
*   `npm run lint` - Roda o linter TypeScript para encontrar possíveis erros no código.

## Tecnologias Utilizadas

*   React
*   Vite
*   Tailwind CSS
*   Recharts (Para gráficos de barras)
*   Lucide React (Para os ícones)
*   JSPDF e JSPDF-Autotable (Para geração dos relatórios de exportação)
