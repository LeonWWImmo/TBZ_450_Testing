export function calculatePrice(baseprice, specialprice, extraprice, extras, discount) {
  let addon_discount = 0;

  if (extras >= 5) {
    addon_discount = 15;
  } else if (extras >= 3) {
    addon_discount = 10;
  }

  let result =
    (baseprice * (100 - discount)) / 100 +
    specialprice +
    (extraprice * (100 - addon_discount)) / 100;

  return result;
}
