# Sicherheitsrichtlinie

> **Version:** 0.9.12 | **Letzte Aktualisierung:** April 2026

## Unterstützte Versionen

Wir bieten Sicherheitsupdates für die folgenden Versionen:

| Version  | Unterstützt |
| :------- | :---------- |
| 0.9.16   | ✅ Ja       |
| 0.9.15   | ✅ Ja       |
| 0.9.14   | ✅ Ja       |
| 0.9.13   | ✅ Ja       |
| ≤ 0.9.12 | ❌ Nein     |

## Schwachstellen melden

Wir nehmen Sicherheitsfragen sehr ernst. Bitte melde entdeckte Schwachstellen verantwortungsvoll, damit wir sie zeitnah beheben können.

### Verantwortliche Offenlegung

1. **Erstelle ein Issue** mit dem Label **`security`** im [GitHub Repository](https://github.com/marianwolf/oidarwave/issues)
2. **Beschreibe das Problem detailliert:**
   - Beschreibung der Sicherheitslücke
   - Schritte zum Reproduzieren
   - Potenzielle Auswirkungen
   - Betroffene Komponenten/Versionen
3. **Warte auf unsere Bestätigung**, bevor du Informationen öffentlich machst

### Erwartete Reaktion

- **Bestätigung:** Innerhalb von 48 Stunden
- **Erste Einschätzung:** Innerhalb von 7 Tagen
- **Updates:** Wir halten dich über den Fortschritt informiert

### Vertrauliche Behandlung

- ❌ Veröffentliche keine Details, bevor die Lücke behoben wurde
- ❌ Sende keine Patches ohne vorherige Absprache
- ❌ Veröffentliche keine Workarounds öffentlich

## Sicherer Kontakt

Für sensible Sicherheitsfragen kannst du uns auch direkt kontaktieren:

- **GitHub Issues:** [Repository Issues](https://github.com/marianwolf/oidarwave/issues)

---

Vielen Dank für deine Mithilfe, dieses Projekt sicher zu halten!

# Cloudflare Security-Audit Skill

## Installation

Install the skill with the [Skills CLI](https://skills.sh):

```bash
npx skills add https://github.com/cloudflare/security-audit-skill \ --skill security-audit
```

Use `--global` for a user-level installation:

```bash
npx skills add https://github.com/cloudflare/security-audit-skill \ --skill security-audit \ --global
```

Run `npx skills --help` for agent-selection and non-interactive options.

## Usage

Start your coding agent in (or pointed at) the codebase you want to audit, then ask it to do a security audit:

```
security audit this codebase
```

```
find security vulnerabilities in ./src
```

```
do a security review, output to ~/audits/my-project
```

The skill activates automatically when the request matches its trigger (security audit, find vulnerabilities, pen-test the code, etc.). A direct codebase audit or pen-test request uses full audit mode. Security questions and focused vulnerability work use guidance mode unless you request report artifacts. In full audit mode, an unspecified output directory defaults to `~/security-audit-skill/<repo-name>/run-<N>`. The workflow writes inside the target repository only when you explicitly select a directory that version control ignores.
