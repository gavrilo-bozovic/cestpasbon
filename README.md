# cestpasbon

Site de feedback sur la restauration de l’APEMS de Côteau-Fleuri.

## Cloudflare

Configuration du déploiement Git :
- Build command : laisser vide
- Deploy command : `npx wrangler deploy`
- Preview command : `npx wrangler versions upload`
- Preview builds : activés

## Variables Cloudflare

Secrets :
- `OPENAI_API_KEY`
- `AIRTABLE_TOKEN`

Variables :
- `AIRTABLE_BASE_ID`
- `AIRTABLE_TABLE_NAME`
- `FEEDBACK_RECIPIENTS` — adresses séparées par des virgules, par ex. `adresse1@example.ch,adresse2@example.ch`
- `OPENAI_MODEL` — facultatif ; défaut : `gpt-5-mini`

## Airtable

La table doit avoir les champs suivants (orthographe exacte) :
- `Date` (date)
- `Problème` (texte)
- `Sujet` (texte)
- `Texte` (texte long)

## Local

Créer `.dev.vars` (ignoré par Git) avec les mêmes variables, puis :

```bash
npm install
npm run dev
```
