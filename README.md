# Chat Social com Firebase

Um aplicativo de chat em tempo real desenvolvido com HTML, CSS e JavaScript, utilizando o Firebase para autenticação e armazenamento de dados.
- Aplicação no ar: https://evertonfarias.github.io/Chat-Social-Firebase-NOSQL/
## Índice

- [Visão Geral](#visão-geral)
- [Funcionalidades](#funcionalidades)
- [Instalação](#instalação)
- [Como Usar](#como-usar)
  - [Cadastro e Login](#cadastro-e-login)
  - [Criando Chats](#criando-chats)
  - [Usando o Chat](#usando-o-chat)
- [Tipos de Chat](#tipos-de-chat)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Estrutura do Banco de Dados Firebase](#estrutura-do-banco-de-dados-firebase)
- [Segurança](#segurança)
- [Requisitos](#requisitos)

## Visão Geral

Chat Social é uma aplicação web que permite aos usuários se comunicarem em tempo real através de diferentes tipos de chat: públicos, privados ou em grupo. O sistema utiliza o Firebase para autenticação de usuários e para o armazenamento e sincronização de mensagens em tempo real.

## Funcionalidades

- **Autenticação de usuários**: Cadastro e login com email e senha
- **Criação de chats**: Públicos, privados ou em grupo
- **Mensagens em tempo real**: Receba e envie mensagens instantaneamente
- **Lista de chats disponíveis**: Visualize todos os chats que você tem acesso
- **Seleção de usuários**: Escolha com quem deseja conversar em chats privados ou em grupo

## Instalação

1. Clone este repositório ou baixe os arquivos
2. Certifique-se de manter a estrutura de pastas conforme abaixo:
   ```
   chat-social/
   ├── index.html
   ├── chat.html
   └── scripts/
   │   ├── index.js
   │   └── chat.js
   └── css/
   │   ├── index.css
   │   └── chat.css
   └── img/
       └── favicon.ico
   ```
3. Abra o arquivo `index.html` em um navegador web para começar

## Como Usar

### Cadastro e Login

1. Na página inicial (`index.html`), digite seu email e senha
2. Para criar uma nova conta, clique em "Cadastrar"
3. Para entrar em uma conta existente, clique em "Entrar"
4. Após o login bem-sucedido, você será redirecionado para a página de chat

### Criando Chats

1. Na página de chat (`chat.html`), localize a seção "Criar Novo Chat" na barra lateral
2. Digite um nome para o chat no campo "Nome do Chat"
3. Selecione o tipo de chat:
   - **Público**: Visível e acessível para todos os usuários
   - **Privado**: Conversa entre você e apenas um usuário selecionado
   - **Grupo**: Conversa entre você e vários usuários selecionados
4. Se escolher Privado ou Grupo, selecione os usuários na lista que aparecerá
   - Para chat Privado: selecione apenas um usuário
   - Para chat em Grupo: selecione múltiplos usuários (segure Ctrl ou Cmd para selecionar vários)
5. Clique em "Criar Chat" para finalizar

### Usando o Chat

1. Na barra lateral, em "Seus Chats", aparecerão todos os chats disponíveis para você
   - Chats públicos
   - Chats privados em que você participa
   - Chats em grupo em que você participa
2. Clique em um chat para abri-lo
3. Digite sua mensagem no campo de texto na parte inferior
4. Clique em "Enviar" ou pressione Enter para enviar a mensagem
5. Para sair da aplicação, clique no botão "Sair" no topo da barra lateral

## Tipos de Chat

- **Público**: Visível e acessível para todos os usuários cadastrados no sistema. Qualquer pessoa pode entrar e participar da conversa.
- **Privado**: Conversa exclusiva entre dois usuários. Apenas os participantes têm acesso às mensagens.
- **Grupo**: Conversa entre três ou mais usuários selecionados. Apenas os membros do grupo podem visualizar e enviar mensagens.

## Estrutura do Projeto

- **index.html**: Página de login e cadastro
- **chat.html**: Interface principal do chat
- **css/index.css**: Estilos para a página de login
- **css/chat.css**: Estilos para a interface de chat

## Estrutura do Banco de Dados Firebase

O projeto utiliza o Firebase Realtime Database com a seguinte estrutura:

### Usuários (`users/`)
```
users/
├── [uid1]/
│   └── email: "user1@example.com"
├── [uid2]/
│   └── email: "user2@example.com"
└── [uid3]/
    └── email: "user3@example.com"
```

### Chats (`chats/`)
```
chats/
├── [chatId1]/
│   ├── name: "Nome do Chat"
│   ├── type: "public" | "private" | "group"
│   └── members/
│       ├── [uid1]: true
│       ├── [uid2]: true
│       └── [uid3]: true
├── [chatId2]/
...
```

### Mensagens (`messages/`)
```
messages/
├── [chatId1]/
│   ├── [messageId1]/
│   │   ├── sender: [uid]
│   │   ├── text: "Conteúdo da mensagem"
│   │   └── timestamp: 1620000000000
│   ├── [messageId2]/
...
```

#### Detalhes:

- **Users**: Armazena informações básicas de cada usuário, indexado pelo UID gerado pelo Firebase Authentication
- **Chats**: Armazena informações sobre cada chat, incluindo nome, tipo e membros
  - O tipo pode ser "public" (acessível a todos), "private" (entre dois usuários) ou "group" (entre múltiplos usuários)
  - A propriedade `members` contém os UIDs dos usuários que têm acesso ao chat
- **Messages**: Armazena todas as mensagens organizadas por chat
  - Cada mensagem contém o UID do remetente, o texto e o timestamp
  - As mensagens são ordenadas cronologicamente pelo timestamp

Esta estrutura permite consultas eficientes para listar os chats de um usuário, carregar mensagens de um chat específico e verificar permissões de acesso.

## Segurança

O aplicativo utiliza o sistema de autenticação do Firebase para garantir que apenas usuários autenticados possam acessar os recursos. As regras de segurança do Firebase garantem que:

- Usuários só podem acessar chats públicos ou aqueles em que são membros
- Mensagens só podem ser enviadas por membros do chat
- Informações de usuário são protegidas

## Requisitos

- Navegador web moderno (Chrome, Firefox, Safari, Edge)
- Conexão com a internet
- Arquivos CSS referenciados no projeto (css/index.css e css/chat.css)
- Arquivos JS referenciados no projeto (scripts/index.js e css/chat.js)
- Favicon referenciado no projeto (img/favicon.ico)

---

Desenvolvido usando Firebase
