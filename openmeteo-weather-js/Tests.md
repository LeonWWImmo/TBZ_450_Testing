# Dokumentation Test 
## Tests im Backend 

**`openMeteoService.test.js`**
| Nr. | Testname | Beschreibung (Einsteigerfreundlich erklärt) |
|-----|-----------|---------------------------------------------|
| **1** | **„setzt nur definierte Query-Parameter und Accept-Header“** | Prüft, dass nur wirklich ausgefüllte Parameter in der URL landen. Leere Werte (`undefined`, `null`, `""`) werden **nicht** gesendet. Ausserdem wird kontrolliert, dass der HTTP-Header `Accept: application/json` gesetzt ist, damit die API JSON zurückgibt. |
| **2** | **„verwendet Cache: gleiche Params → nur 1 fetch()“** | Wenn `getForecast()` mit denselben Parametern zweimal hintereinander aufgerufen wird, soll nur **einmal** ein echter API-Aufruf (`fetch`) passieren. Der zweite Aufruf kommt direkt aus dem Cache. |
| **3** | **„wirft bei HTTP-Fehlern eine klare Fehlermeldung“** | Wenn die API einen HTTP-Fehler (z. B. 502) meldet, soll die Funktion eine aussagekräftige Fehlermeldung werfen, z. B. `Open-Meteo returned 502`. |
| **4** | **„wrappt/propagiert Netzwerkfehler von fetch()“** | Wenn beim Request ein echter Netzwerkfehler passiert (z. B. Internetverbindung unterbrochen), wird dieser Fehler **nicht unterdrückt**, sondern an den Aufrufer weitergegeben. |
| **5** | **„propagiert Fehler, wenn response.json() wirft“** | Wenn das Umwandeln der Serverantwort in JSON scheitert (z. B. kaputte Antwort), soll der Fehler „bad json“ weitergegeben werden. |
| **6** | **„nutzt den Cache innerhalb der TTL, aber erneuert nach Ablauf“** | Der Cache hat eine „Lebensdauer“ (TTL = Time To Live). Innerhalb dieser Zeit wird der gespeicherte Wert verwendet. Wenn die Zeit abläuft, wird die API wieder neu aufgerufen. Das spart API-Aufrufe, aber sorgt trotzdem für aktuelle Daten. |
| **7** | **„entfernt undefined/null/Leerstring-Parameter aus der Request-URL“** | Nochmals gezielte Prüfung: Es dürfen **keine leeren Query-Parameter** in der finalen URL stehen. Zum Beispiel darf `&daily=` **nicht** vorkommen. |
| **8** | **„reicht forecast_days und past_days korrekt durch“** | Testet, dass zusätzliche Parameter wie `forecast_days` und `past_days` korrekt in der Anfrage-URL auftauchen, z. B. `forecast_days=3&past_days=2`. |
| **9** | **„cached trotz unterschiedlicher Param-Reihenfolge (stabiler cacheKey)“** | Prüft, dass der Cache-Schlüssel unabhängig von der Reihenfolge der Objektfelder ist. Beispiel: `{a:1,b:2}` und `{b:2,a:1}` sollen denselben Cache-Eintrag nutzen. |
| **10** | **„resetCache() invalidiert Cache (nächster Call → Netz)“** | Nach einem Aufruf von `resetCache()` wird der Cache gelöscht. Danach wird `getForecast()` beim nächsten Mal wieder übers Netz ausgeführt (nicht aus dem Cache). |
| **11** | **„soll cacheKey deterministisch sortieren“** | Kontrolliert direkt die Funktion `cacheKey()`: Sie muss denselben String erzeugen, auch wenn die Parameter unterschiedlich sortiert sind. So bleibt der Cache konsistent. |
| **12** | **„soll Forecast aus API holen und cachen (Basis)“** | Basis-Test: Wenn `getForecast()` zweimal mit den gleichen Daten aufgerufen wird, liefert der zweite Aufruf **dasselbe Objekt** (aus dem Cache). |
| **13** | **„soll Fehler werfen bei API-Error (Basis)“** | Wenn die API mit Status 500 antwortet (`ok: false, status: 500`), soll `getForecast()` eine Fehlermeldung wie „Open-Meteo returned 500“ werfen. |

---

**`openMeteo.test.js`**
| Nr. | Testname | Beschreibung |
|----:|-----------|--------------|
| **1** | **setzt nur definierte Query-Parameter und Accept-Header** | Testet, dass nur gesetzte bzw. gültige Parameter (`latitude`, `longitude`, `hourly`, `timezone`) an die API gesendet werden. Werte wie `undefined`, `null` oder leere Strings (`""`) werden ignoriert. Ausserdem wird überprüft, dass der HTTP-Header `Accept: application/json` gesetzt ist. |
| **2** | **verwendet Cache: gleiche Params → nur 1 fetch()** | Prüft, dass zwei direkte Aufrufe mit identischen Parametern nur **einen** echten API-Aufruf auslösen. Das zweite Ergebnis wird aus dem Cache geliefert, wodurch unnötige Requests vermieden werden. |
| **3** | **wirft bei HTTP-Fehlern eine klare Fehlermeldung** | Überprüft, dass bei einem fehlerhaften API-Antwortstatus (`ok: false`, z. B. 502) eine verständliche Fehlermeldung geworfen wird: `Open-Meteo returned 502`. Damit reagiert die Funktion korrekt auf API-Fehler. |

---

**`weatherController.test.js`**
| Nr. | Testname | Beschreibung |
|----:|----------|--------------|
| **1** | **soll 400 zurückgeben, wenn latitude fehlt** | Request ohne `latitude` (`/api/forecast?longitude=7&hourly=temp`) führt zu **HTTP 400**. Die Fehlermeldung im Body enthält den Hinweis auf `latitude`. |
| **2** | **soll 400 zurückgeben, wenn keine hourly/daily/current Parameter gesetzt sind** | Request ohne **mindestens einen** Daten-Selektor (`hourly`, `daily` oder `current`) führt zu **HTTP 400**. Die Fehlermeldung enthält „Mindestens“. |
| **3** | **soll Forecast zurückgeben (Happy Path)** | Gültiger Request mit `latitude`, `longitude` und `hourly` liefert **HTTP 200** und den vom gemockten Service zurückgegebenen Payload `{ mock: true, params }`. Es wird u. a. geprüft, dass `latitude` in `params` ankommt. |
| **4** | **soll 502 zurückgeben, wenn Service einen Fehler wirft** | Wirft der Service (`getForecast`) einen Fehler, antwortet der Controller mit **HTTP 502** und Body `{ error: "Failed to fetch forecast" }`. |

---
