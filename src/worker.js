const SYSTEM_PROMPT = `Tu rédiges un email de feedback concernant la restauration collective de l’APEMS de Côteau-Fleuri à Lausanne.

Le message est adressé aux responsables de la restauration collective de la Ville de Lausanne et au prestataire Eldora. Lors d’une séance de présentation le 29 septembre 2026, Mme Nadia Maturo, responsable de l’offre de restauration collective de la Ville de Lausanne, a indiqué être à l’écoute de tous les retours et les transmettre le jour même aux prestataires.

Rédige un email en français, formel, poli, factuel et ferme sans être agressif. Il doit :
- rappeler brièvement ce contexte et la demande de feedback formulée le 29 septembre ;
- décrire clairement le problème fourni par l’utilisateur, sans inventer de faits, de causes, de fréquence, de conséquences ou de personnes impliquées ;
- inclure le problème rapporté naturellement dans le contenu de l'email, plutôt que de l'insérer entre guillements. Par exemple, si le problème rapporté est "pâtes trop cuites", ne dis pas: Le problème rapporté est le suivant : « pâtes trop cuites », mais crée une formulation autour de ça. Par exemple: "Le 30 septembre 2026, il a été rapporté que les pâtes étaient trop cuites"
- préciser la date de l’incident, de nouveau en l'insérant naturellement dans le texte, comme indiqué ci-dessus ;
- ne dis pas systématiquement "sans autre commentaire compémentaire", ce n'est pas une formulation naturelle
- demander un retour expliquant quelles mesures concrètes ont été prises ou seront prises pour remédier au problème et éviter sa répétition ;
- rester concis (environ 120 à 220 mots) ;
- varier naturellement la formulation et la structure d’un message à l’autre tout en restant dans ce cadre ;
- ne pas inventer le nom de l’expéditeur ; terminer par une formule de politesse neutre, sans signature nominative.

Retourne UNIQUEMENT un objet JSON valide sous la forme {"subject":"...","body":"..."}. Le sujet doit être descriptif, sobre et inclure si possible la date et la nature générale du problème.

Réponds exclusivement sous la forme d'un objet JSON valide avec exactement deux propriétés :

"subject" : le sujet de l'email

"body" : le corps complet de l'email`;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

function requireEnv(env, names) {
  const missing = names.filter((name) => !env[name]);
  if (missing.length) throw new Error(`Configuration manquante: ${missing.join(", ")}`);
}

async function generateEmail(date, problem, env) {
  requireEnv(env, ["OPENAI_API_KEY"]);

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: env.OPENAI_MODEL || "gpt-5-mini",
      instructions: SYSTEM_PROMPT,
      input: `Retourne la réponse au format JSON demandé dans les instructions.

Date de l'incident : ${date}
Problème rapporté : ${problem}`,
      text: {
        format: {
          type: "json_object"
        }
      },
    }),
  });

  if (!response.ok) {
    throw new Error(
      `OpenAI ${response.status}: ${await response.text()}`
    );
  }

  const data = await response.json();

  const text =
    data.output_text ||
    data.output
      ?.flatMap((item) => item.content || [])
      .find((item) => item.type === "output_text")?.text;

  if (!text) {
    throw new Error("Réponse OpenAI vide");
  }

  const parsed = JSON.parse(text);

  if (!parsed.subject || !parsed.body) {
    throw new Error("Réponse OpenAI incomplète");
  }

  return parsed;
}

async function logToAirtable(date, problem, subject, body, env) {
  requireEnv(env, ["AIRTABLE_TOKEN", "AIRTABLE_BASE_ID", "AIRTABLE_TABLE_NAME"]);
  const endpoint = `https://api.airtable.com/v0/${env.AIRTABLE_BASE_ID}/${encodeURIComponent(env.AIRTABLE_TABLE_NAME)}`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.AIRTABLE_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ records: [{ fields: { Date: date, "Problème": problem, Sujet: subject, Texte: body } }] }),
  });
  if (!response.ok) throw new Error(`Airtable ${response.status}: ${await response.text()}`);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/api/config") {
      const recipients = (env.FEEDBACK_RECIPIENTS || "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
      return json({ recipients });
    }

    if (request.method === "POST" && url.pathname === "/api/generate") {
      try {
        const payload = await request.json();
        const date = String(payload.date || "").trim();
        const problem = String(payload.problem || "").trim();
        if (!date || !problem) return json({ error: "Date et problème requis." }, 400);
        if (problem.length > 3000) return json({ error: "Le problème décrit est trop long." }, 400);

        const output = await generateEmail(date, problem, env);
        let logged = true;
        try {

          await saveToAirtable(...);

        } catch (error) {

          console.error(

            "Airtable logging failed:",

            error?.message,

            error?.stack

          );

        }
        return json({ ...output, logged });
      } catch (error) {

        console.error("Generation failed:", error?.message, error?.stack);

        return json(

          {

            error: "Impossible de générer l’email pour le moment.",

            debug: error?.message || String(error)

          },

          500

        );

      }
    }

    return env.ASSETS.fetch(request);
  },
};
