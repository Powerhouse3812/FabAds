/**
 * Languages — one list, two consumers (Genie 2.0 §5, §8).
 *
 * Studio's Configure step gets a LANGUAGE SELECTOR for choosing the output
 * language of the ad (§5 "Updates to Studio in this release"). Translate Videos
 * gets a MULTI-SELECT over the same list — the app spec says "175 available"
 * (§8), so this file holds exactly 175 and TOTAL_LANGUAGES is derived from the
 * array rather than typed as a literal, so the copy can never drift from the
 * data.
 *
 * One list, because a user who sets Hindi in Studio and then cannot find Hindi
 * in Translate would read that as a bug.
 */
export interface LanguageOption {
  /** BCP-47-ish code. Also the value stored in wizard state + app fields. */
  code: string;
  /** "Hindi" — the language. */
  name: string;
  /** "India" / "Mandarin · Simplified" — disambiguates same-name entries. */
  region: string;
}

/** Ordered so the roster's real markets sit at the top of an unfiltered list. */
export const LANGUAGES: LanguageOption[] = [
  { code: "en-US", name: "English", region: "United States" },
  { code: "en-GB", name: "English", region: "United Kingdom" },
  { code: "en-IN", name: "English", region: "India" },
  { code: "en-AU", name: "English", region: "Australia" },
  { code: "en-CA", name: "English", region: "Canada" },
  { code: "hi", name: "Hindi", region: "India" },
  { code: "bn", name: "Bengali", region: "India" },
  { code: "ta", name: "Tamil", region: "India" },
  { code: "te", name: "Telugu", region: "India" },
  { code: "mr", name: "Marathi", region: "India" },
  { code: "gu", name: "Gujarati", region: "India" },
  { code: "kn", name: "Kannada", region: "India" },
  { code: "ml", name: "Malayalam", region: "India" },
  { code: "pa", name: "Punjabi", region: "India" },
  { code: "or", name: "Odia", region: "India" },
  { code: "as", name: "Assamese", region: "India" },
  { code: "ur", name: "Urdu", region: "Pakistan" },
  { code: "ne", name: "Nepali", region: "Nepal" },
  { code: "si", name: "Sinhala", region: "Sri Lanka" },
  { code: "es-ES", name: "Spanish", region: "Spain" },
  { code: "es-MX", name: "Spanish", region: "Mexico" },
  { code: "es-AR", name: "Spanish", region: "Argentina" },
  { code: "pt-BR", name: "Portuguese", region: "Brazil" },
  { code: "pt-PT", name: "Portuguese", region: "Portugal" },
  { code: "fr-FR", name: "French", region: "France" },
  { code: "fr-CA", name: "French", region: "Canada" },
  { code: "de", name: "German", region: "Germany" },
  { code: "de-AT", name: "German", region: "Austria" },
  { code: "de-CH", name: "German", region: "Switzerland" },
  { code: "it", name: "Italian", region: "Italy" },
  { code: "nl", name: "Dutch", region: "Netherlands" },
  { code: "nl-BE", name: "Dutch", region: "Belgium" },
  { code: "sv", name: "Swedish", region: "Sweden" },
  { code: "no", name: "Norwegian", region: "Norway" },
  { code: "da", name: "Danish", region: "Denmark" },
  { code: "fi", name: "Finnish", region: "Finland" },
  { code: "is", name: "Icelandic", region: "Iceland" },
  { code: "pl", name: "Polish", region: "Poland" },
  { code: "cs", name: "Czech", region: "Czechia" },
  { code: "sk", name: "Slovak", region: "Slovakia" },
  { code: "hu", name: "Hungarian", region: "Hungary" },
  { code: "ro", name: "Romanian", region: "Romania" },
  { code: "bg", name: "Bulgarian", region: "Bulgaria" },
  { code: "el", name: "Greek", region: "Greece" },
  { code: "tr", name: "Turkish", region: "Türkiye" },
  { code: "ru", name: "Russian", region: "Russia" },
  { code: "uk", name: "Ukrainian", region: "Ukraine" },
  { code: "be", name: "Belarusian", region: "Belarus" },
  { code: "sr", name: "Serbian", region: "Serbia" },
  { code: "hr", name: "Croatian", region: "Croatia" },
  { code: "bs", name: "Bosnian", region: "Bosnia" },
  { code: "sl", name: "Slovenian", region: "Slovenia" },
  { code: "mk", name: "Macedonian", region: "North Macedonia" },
  { code: "sq", name: "Albanian", region: "Albania" },
  { code: "lt", name: "Lithuanian", region: "Lithuania" },
  { code: "lv", name: "Latvian", region: "Latvia" },
  { code: "et", name: "Estonian", region: "Estonia" },
  { code: "ar-SA", name: "Arabic", region: "Saudi Arabia" },
  { code: "ar-EG", name: "Arabic", region: "Egypt" },
  { code: "ar-AE", name: "Arabic", region: "UAE" },
  { code: "he", name: "Hebrew", region: "Israel" },
  { code: "fa", name: "Persian", region: "Iran" },
  { code: "ps", name: "Pashto", region: "Afghanistan" },
  { code: "ku", name: "Kurdish", region: "Iraq" },
  { code: "hy", name: "Armenian", region: "Armenia" },
  { code: "ka", name: "Georgian", region: "Georgia" },
  { code: "az", name: "Azerbaijani", region: "Azerbaijan" },
  { code: "kk", name: "Kazakh", region: "Kazakhstan" },
  { code: "uz", name: "Uzbek", region: "Uzbekistan" },
  { code: "ky", name: "Kyrgyz", region: "Kyrgyzstan" },
  { code: "tg", name: "Tajik", region: "Tajikistan" },
  { code: "tk", name: "Turkmen", region: "Turkmenistan" },
  { code: "mn", name: "Mongolian", region: "Mongolia" },
  { code: "zh-CN", name: "Chinese", region: "Mandarin · Simplified" },
  { code: "zh-TW", name: "Chinese", region: "Mandarin · Traditional" },
  { code: "yue", name: "Chinese", region: "Cantonese" },
  { code: "ja", name: "Japanese", region: "Japan" },
  { code: "ko", name: "Korean", region: "South Korea" },
  { code: "th", name: "Thai", region: "Thailand" },
  { code: "vi", name: "Vietnamese", region: "Vietnam" },
  { code: "id", name: "Indonesian", region: "Indonesia" },
  { code: "ms", name: "Malay", region: "Malaysia" },
  { code: "tl", name: "Filipino", region: "Philippines" },
  { code: "km", name: "Khmer", region: "Cambodia" },
  { code: "lo", name: "Lao", region: "Laos" },
  { code: "my", name: "Burmese", region: "Myanmar" },
  { code: "jv", name: "Javanese", region: "Indonesia" },
  { code: "su", name: "Sundanese", region: "Indonesia" },
  { code: "sw", name: "Swahili", region: "Kenya" },
  { code: "am", name: "Amharic", region: "Ethiopia" },
  { code: "ha", name: "Hausa", region: "Nigeria" },
  { code: "yo", name: "Yoruba", region: "Nigeria" },
  { code: "ig", name: "Igbo", region: "Nigeria" },
  { code: "zu", name: "Zulu", region: "South Africa" },
  { code: "xh", name: "Xhosa", region: "South Africa" },
  { code: "af", name: "Afrikaans", region: "South Africa" },
  { code: "st", name: "Sesotho", region: "Lesotho" },
  { code: "tn", name: "Setswana", region: "Botswana" },
  { code: "sn", name: "Shona", region: "Zimbabwe" },
  { code: "ny", name: "Chichewa", region: "Malawi" },
  { code: "rw", name: "Kinyarwanda", region: "Rwanda" },
  { code: "so", name: "Somali", region: "Somalia" },
  { code: "ti", name: "Tigrinya", region: "Eritrea" },
  { code: "om", name: "Oromo", region: "Ethiopia" },
  { code: "wo", name: "Wolof", region: "Senegal" },
  { code: "ff", name: "Fulah", region: "West Africa" },
  { code: "bm", name: "Bambara", region: "Mali" },
  { code: "mg", name: "Malagasy", region: "Madagascar" },
  { code: "lg", name: "Luganda", region: "Uganda" },
  { code: "ak", name: "Akan", region: "Ghana" },
  { code: "ee", name: "Ewe", region: "Ghana" },
  { code: "tw", name: "Twi", region: "Ghana" },
  { code: "ca", name: "Catalan", region: "Spain" },
  { code: "gl", name: "Galician", region: "Spain" },
  { code: "eu", name: "Basque", region: "Spain" },
  { code: "cy", name: "Welsh", region: "United Kingdom" },
  { code: "ga", name: "Irish", region: "Ireland" },
  { code: "gd", name: "Scottish Gaelic", region: "Scotland" },
  { code: "mt", name: "Maltese", region: "Malta" },
  { code: "lb", name: "Luxembourgish", region: "Luxembourg" },
  { code: "fo", name: "Faroese", region: "Faroe Islands" },
  { code: "la", name: "Latin", region: "Classical" },
  { code: "eo", name: "Esperanto", region: "Constructed" },
  { code: "yi", name: "Yiddish", region: "Global" },
  { code: "haw", name: "Hawaiian", region: "United States" },
  { code: "mi", name: "Maori", region: "New Zealand" },
  { code: "sm", name: "Samoan", region: "Samoa" },
  { code: "to", name: "Tongan", region: "Tonga" },
  { code: "fj", name: "Fijian", region: "Fiji" },
  { code: "ty", name: "Tahitian", region: "French Polynesia" },
  { code: "ceb", name: "Cebuano", region: "Philippines" },
  { code: "hil", name: "Hiligaynon", region: "Philippines" },
  { code: "ilo", name: "Ilocano", region: "Philippines" },
  { code: "war", name: "Waray", region: "Philippines" },
  { code: "pam", name: "Kapampangan", region: "Philippines" },
  { code: "bcl", name: "Bikol", region: "Philippines" },
  { code: "sd", name: "Sindhi", region: "Pakistan" },
  { code: "bo", name: "Tibetan", region: "China" },
  { code: "dz", name: "Dzongkha", region: "Bhutan" },
  { code: "dv", name: "Dhivehi", region: "Maldives" },
  { code: "ks", name: "Kashmiri", region: "India" },
  { code: "sa", name: "Sanskrit", region: "India" },
  { code: "kok", name: "Konkani", region: "India" },
  { code: "mni", name: "Manipuri", region: "India" },
  { code: "brx", name: "Bodo", region: "India" },
  { code: "doi", name: "Dogri", region: "India" },
  { code: "mai", name: "Maithili", region: "India" },
  { code: "bho", name: "Bhojpuri", region: "India" },
  { code: "awa", name: "Awadhi", region: "India" },
  { code: "mag", name: "Magahi", region: "India" },
  { code: "raj", name: "Rajasthani", region: "India" },
  { code: "hne", name: "Chhattisgarhi", region: "India" },
  { code: "tcy", name: "Tulu", region: "India" },
  { code: "gom", name: "Goan Konkani", region: "India" },
  { code: "kha", name: "Khasi", region: "India" },
  { code: "lus", name: "Mizo", region: "India" },
  { code: "nag", name: "Nagamese", region: "India" },
  { code: "sat", name: "Santali", region: "India" },
  { code: "kru", name: "Kurukh", region: "India" },
  { code: "bpy", name: "Bishnupriya", region: "India" },
  { code: "quz", name: "Quechua", region: "Peru" },
  { code: "ay", name: "Aymara", region: "Bolivia" },
  { code: "gn", name: "Guarani", region: "Paraguay" },
  { code: "nah", name: "Nahuatl", region: "Mexico" },
  { code: "myn", name: "Maya", region: "Guatemala" },
  { code: "ht", name: "Haitian Creole", region: "Haiti" },
  { code: "pap", name: "Papiamento", region: "Curaçao" },
  { code: "jam", name: "Jamaican Patois", region: "Jamaica" },
  { code: "srn", name: "Sranan", region: "Suriname" },
  { code: "kl", name: "Greenlandic", region: "Greenland" },
  { code: "se", name: "Northern Sami", region: "Norway" },
  { code: "iu", name: "Inuktitut", region: "Canada" },
  { code: "cr", name: "Cree", region: "Canada" },
  { code: "oj", name: "Ojibwe", region: "Canada" },
  { code: "nv", name: "Navajo", region: "United States" },
]

/** 175 — quoted in the Translate Videos copy. Derived, never hardcoded. */
export const TOTAL_LANGUAGES = LANGUAGES.length;

/** Studio's default output language. */
export const DEFAULT_LANGUAGE = "en-IN";

export function getLanguage(code: string): LanguageOption | undefined {
  return LANGUAGES.find((l) => l.code === code);
}

/** "English (India)" — one label for chips, selects and banner copy. */
export function languageLabel(code: string): string {
  const l = getLanguage(code);
  return l ? `${l.name} (${l.region})` : code;
}

/** Case-insensitive search across name, region and code. */
export function searchLanguages(q: string): LanguageOption[] {
  const t = q.trim().toLowerCase();
  if (!t) return LANGUAGES;
  return LANGUAGES.filter(
    (l) =>
      l.name.toLowerCase().includes(t) ||
      l.region.toLowerCase().includes(t) ||
      l.code.toLowerCase().includes(t),
  );
}
