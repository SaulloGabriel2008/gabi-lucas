# Firebase Setup (`gabielucas`)

## ServiÃ§os necessÃ¡rios
- Habilite `Authentication > Sign-in method > Email/Password`.
- Crie o banco em `Firestore Database`.

## ConfiguraÃ§Ã£o usada no site
- `projectId`: `gabielucas`
- `authDomain`: `gabielucas.firebaseapp.com`

## Primeiro admin
1. Crie o usuÃ¡rio em `Authentication > Users`.
2. Abra o usuÃ¡rio criado e copie o `UID`.
3. Em `Firestore Database`, crie o documento `admins/{UID}`.
4. Use este conteÃºdo inicial:

```json
{
  "active": true,
  "email": "seu-email-admin@exemplo.com",
  "name": "Admin principal"
}
```

## Estrutura de dados da v2
- `siteSettings/main`
- `admins/{uid}`
- `gifts/{giftId}`
- `tables/{tableId}`
- `families/{familyId}`
- `families/{familyId}/guests/{guestId}`
- `inviteLinks/{slug}`

## Deploy local
```bash
firebase deploy --only hosting,firestore:rules
```

## ObservaÃ§Ãµes
- O site nÃ£o usa Firebase Functions.
- O site nÃ£o usa Firebase Storage.
- O painel admin nÃ£o usa email fixo hardcoded.
- O acesso depende de login no Firebase Auth e da presenÃ§a de `admins/{uid}` com `active = true`.
- As imagens dos presentes sÃ£o salvas como `imageUrl` no Firestore.
