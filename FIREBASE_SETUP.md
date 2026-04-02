# Firebase Setup (`gabielucas`)

## Serviços necessários
- Habilite `Authentication > Sign-in method > Email/Password`.
- Crie o banco em `Firestore Database`.
- Habilite o `Storage`.

## Configuração usada no site
- `projectId`: `gabielucas`
- `authDomain`: `gabielucas.firebaseapp.com`
- `storageBucket`: `gabielucas.firebasestorage.app`

## Primeiro admin
1. Crie o usuário em `Authentication > Users`.
2. Abra o usuário criado e copie o `UID`.
3. Em `Firestore Database`, crie o documento `admins/{UID}`.
4. Use este conteúdo inicial:

```json
{
  "active": true,
  "email": "seu-email-admin@exemplo.com",
  "name": "Admin principal"
}
```

## Estrutura de dados da v1
- `siteSettings/main`
- `admins/{uid}`
- `gifts/{giftId}`
- `tables/{tableId}`
- `families/{familyId}`
- `families/{familyId}/guests/{guestId}`
- `inviteLinks/{slug}`

## Deploy local
```bash
firebase deploy --only hosting,firestore:rules,storage
```

## Observações
- O painel admin não usa email fixo hardcoded.
- O acesso depende de login no Firebase Auth e da presença de `admins/{uid}` com `active = true`.
- As imagens dos presentes são enviadas para `Storage > gift-images/...`.
