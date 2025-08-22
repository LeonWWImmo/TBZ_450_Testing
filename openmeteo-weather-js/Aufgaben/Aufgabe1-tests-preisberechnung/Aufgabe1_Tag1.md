## Aufgabe 1

Formen von Tests in der Informatik:

* **Unittests** – prüfen einzelne Funktionen.
* **Integrationstests** – prüfen das Zusammenspiel mehrerer Teile.
* **End-to-End-Tests** – testen die Software wie ein Benutzer.

Die Tests werden meist automatisiert mit speziellen Tools ausgeführt.

---

## Aufgabe 2

* **SW-Fehler:** z. B. falsche Berechnung einer Uhrzeit.
* **SW-Mangel:** eine gewünschte Funktion (z. B. Sprachumschaltung) fehlt.
* **Hoher Schaden:** NASA verlor 1999 eine Raumsonde wegen falscher Einheiten (über 100 Mio. \$).


## Aufgabe 3 – Preisberechnung
Im Ordner `/tests-preisberechnung` ist ein Beispiel für die unterste Teststufe umgesetzt.  
- `price.js` enthält die Berechnungslogik.  
- `price.test.js` ist ein einfacher Testtreiber, der verschiedene Fälle prüft.  

Die Tests können mit Node.js ausgeführt werden:
```bash
cd tests-preisberechnung
node price.test.js


