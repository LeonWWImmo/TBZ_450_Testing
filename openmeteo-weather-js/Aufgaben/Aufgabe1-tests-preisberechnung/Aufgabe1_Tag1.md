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

---

## Aufgabe 3 – Bonus
Im gegebenen Beispielcode gibt es einen Fehler in der Rabattlogik:  
Die Bedingung für 5 oder mehr Extras wird nie erreicht, weil bereits `extras >= 3` zuerst geprüft wird.  

**Falsch:**
```java
if (extras >= 3) 
    addon_discount = 10;
else if (extras >= 5)
    addon_discount = 15;

Korrekt:

if (extras >= 5)
    addon_discount = 15;
else if (extras >= 3)
    addon_discount = 10;
else
    addon_discount = 0;


Damit funktioniert auch der 15%-Rabatt ab 5 Extras korrekt.
