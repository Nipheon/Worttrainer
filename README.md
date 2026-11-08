# Worttrainer

Blitzlesen für Grundschulkinder im Browser: der erste Lesewortschatz mit den 100 häufigsten
kurzen Wörtern (`der`, `die`, `das`, `Mama`, `alle` …). Lehrkraft oder Eltern wählen die
bekannten Buchstaben, die Walze zeigt dazu passende Wörter. Gleiches Aussehen und gleicher Ablauf
wie der [Silbentrainer](https://github.com/Nipheon/Silbentrainer).

## Starten

Die Seite lädt ES-Module und braucht deshalb einen Webserver (ein Doppelklick auf
`index.html` reicht nicht):

```
python3 -m http.server 8000
```

Dann `http://localhost:8000` öffnen. Tests: `npm test` (Node 20 oder neuer).

## Gespeicherte Einstellung

„Los geht's“ speichert die Auswahl im Browser (`localStorage`, nur lokal, keine Übertragung).
Beim nächsten Aufruf startet die Seite direkt mit der Walze; „Buchstaben ändern“ führt
zurück zur Auswahl. Ohne gespeicherte Auswahl erscheint zuerst die Auswahlseite.

## Regeln

- Ein Wort erscheint nur, wenn alle seine Laute bekannt sind. Laute sind einzelne Buchstaben und
  `ei au eu äu ie ch sch st sp` (`die` = d + ie, `Schule` = sch + u + l + e).
- Die Seite zeigt unter der Auswahl, wie viele der 100 Wörter damit passen.
- Ein Wort kommt erst wieder, wenn alle passenden Wörter einmal gezeigt wurden.
- Die Walze dreht sich kurz und bleibt dann auf dem Wort stehen (mit „reduzierte Bewegung“ ohne Drehen).

## Wortliste

`src/words.js` enthält 100 von Hand ausgewählte Wörter für den ersten Lesewortschatz, in fünf Gruppen:
Artikel und Fürwörter, Tunwörter, kleine Wörter, Namenwörter, Wiewörter. Alle haben höchstens sechs
Buchstaben und lassen sich mit den Lauten oben schreiben (`ß`, `x`, `y`, `c`, `qu`, `ck` kommen nicht vor).
Der Test `tests/words.test.mjs` prüft Anzahl, Doppelte und Zerlegung in Laute.

## Lizenzen

- Code und Wortliste: MIT, siehe `LICENSE`.
- Schrift **Grundschrift von Christian Urff**, [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/),
  Quelle: <https://urff.app/grundschrift/>, Lizenztext in `fonts/grundschrift/LICENSE.md`.
- Ersatzschrift **Andika** (SIL), SIL Open Font License 1.1, siehe `fonts/OFL.txt`.

## KI-Hinweis

Der Code wurde mit Unterstützung von KI geschrieben: Claude (Anthropic, Modell
Claude Sonnet 5.5). Der Autor hat die Ergebnisse geprüft und steuert das Projekt.
