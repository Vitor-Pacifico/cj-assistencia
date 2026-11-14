# CJ Assistência

Registro de serviços (máquina de lavar e geladeira). React + Vite + Firebase, plano gratuito.

## 1. Firebase (console.firebase.google.com)
1. Criar um projeto (pode desativar o Google Analytics).
2. **Authentication > Sign-in method**: ativar **E-mail/senha**.
3. **Authentication > Users > Add user**: criar o login do seu pai (e-mail e senha). Não há tela de cadastro no site de propósito: só quem você criar aqui entra.
4. **Firestore Database > Criar banco de dados** (modo produção, região `southamerica-east1`).
5. **Firestore > Regras**: colar o conteúdo de `firestore.rules` e publicar.
6. **Configurações do projeto > Seus aplicativos > Web (</>)**: registrar o app e copiar a configuração.

## 2. Rodar no VS Code
```bash
npm install
cp .env.example .env   # preencha com os dados do passo 6
npm run dev
```

## 3. Publicar na Vercel
1. Subir a pasta para um repositório no GitHub (o `.env` não vai junto, está no `.gitignore`).
2. Vercel > **Add New Project** > importar o repositório (Vite é detectado sozinho).
3. Em **Environment Variables**, cadastrar as 4 variáveis `VITE_FIREBASE_*` do `.env`.
4. Deploy. Depois, em **Firebase > Authentication > Settings > Authorized domains**, adicionar o domínio da Vercel (ex.: `cj-assistencia.vercel.app`).

## Dica para o celular do seu pai
Abrir o site no Chrome > menu ⋮ > **Adicionar à tela inicial**.
