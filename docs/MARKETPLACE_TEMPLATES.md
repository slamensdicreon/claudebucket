# CrowdMind Marketplace Templates

CrowdMind panel templates are JSON files stored in `resources/templates/`. The app can also fetch templates from this folder on GitHub, so a merged PR can appear in the Marketplace before the next desktop release.

## File Name

Use a clear kebab-case name:

```text
resources/templates/restaurantes-hoteles-colombia.json
```

## Required Shape

```json
{
  "formatVersion": 1,
  "nombre": "Panel name",
  "descripcionPublica": "Who this panel represents and what it is useful for.",
  "autorPublico": "Your name or team",
  "personas": []
}
```

Each persona must include:

```json
{
  "nombre": "Name",
  "edad": 34,
  "genero": "femenino",
  "ciudad": "Bogota",
  "pais": "Colombia",
  "ocupacion": "Operations manager",
  "nivelIngreso": "medio",
  "nivelEducativo": "universitario",
  "estadoCivil": "soltera",
  "disposicionBase": "neutro",
  "rasgos": ["pragmatica", "analitica"],
  "valores": ["eficiencia", "confianza"],
  "historiaPersonal": "Two to four concrete sentences with context, habits and decision drivers.",
  "objecionesTipicas": ["price", "lack of social proof"],
  "canalPreferido": "WhatsApp",
  "llmProviderOverride": null,
  "llmModelOverride": null
}
```

Allowed values:

- `nivelIngreso`: `bajo`, `medio`, `alto`
- `disposicionBase`: `entusiasta`, `neutro`, `esceptico`, `hostil`

## Quality Bar

- Aim for 6 to 12 personas per template.
- Vary age, gender, city, income, occupation and disposition.
- Avoid repeated names, repeated objections and generic histories.
- Make the template useful for a specific research job, not a vague audience.
- Do not include real private people or internal customer data.
- Keep `llmProviderOverride` and `llmModelOverride` as `null`.

## Validation

Run:

```bash
npm run smoke-test
```

The smoke test validates bundled templates and catches malformed JSON.
