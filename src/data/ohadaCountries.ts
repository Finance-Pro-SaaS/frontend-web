// Source de vérité frontend pour les 17 pays OHADA — doit rester synchronisée
// avec backend/app/Support/OhadaCountries.php (même liste, mêmes valeurs).
// Le drapeau est calculé depuis le code ISO (pas besoin d'images/icônes :
// chaque lettre A-Z d'un code ISO a un caractère Unicode "regional indicator"
// correspondant ; les combiner donne l'emoji drapeau, comme fait nativement
// par Gmail/WhatsApp).
export interface OhadaCountry {
  name: string
  iso: string
  dialCode: string
  currency: string
  phoneDigits: number
}

export const OHADA_COUNTRIES: OhadaCountry[] = [
  { name: 'Bénin', iso: 'BJ', dialCode: '229', currency: 'XOF', phoneDigits: 10 },
  { name: 'Burkina Faso', iso: 'BF', dialCode: '226', currency: 'XOF', phoneDigits: 8 },
  { name: "Côte d'Ivoire", iso: 'CI', dialCode: '225', currency: 'XOF', phoneDigits: 10 },
  { name: 'Guinée-Bissau', iso: 'GW', dialCode: '245', currency: 'XOF', phoneDigits: 7 },
  { name: 'Mali', iso: 'ML', dialCode: '223', currency: 'XOF', phoneDigits: 8 },
  { name: 'Niger', iso: 'NE', dialCode: '227', currency: 'XOF', phoneDigits: 8 },
  { name: 'Sénégal', iso: 'SN', dialCode: '221', currency: 'XOF', phoneDigits: 9 },
  { name: 'Togo', iso: 'TG', dialCode: '228', currency: 'XOF', phoneDigits: 8 },
  { name: 'Cameroun', iso: 'CM', dialCode: '237', currency: 'XAF', phoneDigits: 9 },
  { name: 'Centrafrique', iso: 'CF', dialCode: '236', currency: 'XAF', phoneDigits: 8 },
  { name: 'Congo', iso: 'CG', dialCode: '242', currency: 'XAF', phoneDigits: 9 },
  { name: 'Gabon', iso: 'GA', dialCode: '241', currency: 'XAF', phoneDigits: 8 },
  { name: 'Guinée équatoriale', iso: 'GQ', dialCode: '240', currency: 'XAF', phoneDigits: 9 },
  { name: 'Tchad', iso: 'TD', dialCode: '235', currency: 'XAF', phoneDigits: 8 },
  { name: 'Guinée', iso: 'GN', dialCode: '224', currency: 'GNF', phoneDigits: 9 },
  { name: 'Comores', iso: 'KM', dialCode: '269', currency: 'KMF', phoneDigits: 7 },
  { name: 'RD Congo', iso: 'CD', dialCode: '243', currency: 'CDF', phoneDigits: 9 },
]

//je peux suprimer plus tard
//export function countryFlag(iso: string): string {
 // return iso
  //  .toUpperCase()
  //  .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
//}

export function findCountryByName(name: string): OhadaCountry | undefined {
  return OHADA_COUNTRIES.find((c) => c.name === name)
}
