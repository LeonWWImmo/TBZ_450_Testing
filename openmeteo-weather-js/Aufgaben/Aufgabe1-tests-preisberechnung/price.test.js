import { calculatePrice } from "./price.js";

function test_calculate_price() {
  let ok = true;

  // Testfall 1: Kein Rabatt
  let p1 = calculatePrice(10000, 1000, 2000, 0, 0);
  if (p1 !== 13000) {
    console.error("Fehler bei Test 1", p1);
    ok = false;
  }

  // Testfall 2: Händlerrabatt 10%
  let p2 = calculatePrice(10000, 1000, 2000, 0, 10);
  if (p2 !== 12000) {
    console.error("Fehler bei Test 2", p2);
    ok = false;
  }

  // Testfall 3: Mehr als 3 Extras -> 10% Rabatt
  let p3 = calculatePrice(10000, 1000, 2000, 3, 0);
  if (p3 !== 12800) {
    console.error("Fehler bei Test 3", p3);
    ok = false;
  }

  return ok;
}

console.log("Testergebnis:", test_calculate_price() ? "OK" : "Fehler");
