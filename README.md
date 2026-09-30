# Feedback restauration — APEMS Côteau-Fleuri

## Architecture recommandée
Ne mettez **jamais** les clés OpenAI ou Airtable dans `index.html`: n’importe quel visiteur pourrait les récupérer. `index.html` appelle `/api/generate`; `worker.js` garde les secrets côté serveur, appelle OpenAI, puis écrit dans Airtable.

## À configurer
1. Dans `index.html`, remplacez les deux adresses dans `CONFIG.recipients` par les destinataires réels.
2. Déployez `index.html` comme frontend et `worker.js` comme backend/Worker (ou adaptez ce dernier en fonction serverless de votre hébergeur).
3. Ajoutez comme secrets serveur :
   - `OPENAI_API_KEY`
   - `OPENAI_MODEL` (optionnel ; défaut : `gpt-5-mini`)
   - `AIRTABLE_TOKEN` (Personal Access Token)
   - `AIRTABLE_BASE_ID`
   - `AIRTABLE_TABLE_NAME`
4. Dans Airtable, créez les champs : `Date` (date), `Problème` (texte long), `Texte` (texte long), `Sujet` (texte). Le PAT doit avoir l’accès à cette base et le scope permettant l’écriture de records.

## Important
Le log Airtable intervient lors de **Générer l’email**, conformément à la demande. Si Airtable échoue, le texte reste affiché et le site avertit l’utilisateur. Le bouton **Envoyer l’email** utilise `mailto:` : le visiteur garde donc la maîtrise de l’envoi depuis son propre client mail.
