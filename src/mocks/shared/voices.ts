import type { Voice } from "@/genie6/types/entities";

/**
 * Voices — single source of truth (Catalogue ↔ Genie sync).
 *
 * 52 entries · voice samples across languages + tones. Used by the
 * Studio generation flow for VO and dubbing.
 *
 * Schema: see `Voice` in `@/genie6/types/entities`.
 */

const vc = (id: string, name: string, language: string, description: string): Voice => ({
  id, name, language, description,
});

export const voices: Voice[] = [
  // Hindi / Indian English
  vc("voice-priya-warm", "Priya — Warm Hindi", "hi-IN", "Warm, motherly, conversational. Best for haircare/skincare."),
  vc("voice-aarav-energetic", "Aarav — Energetic Hinglish", "en-IN", "Sharp Gen Z, energetic. Best for tech/wearables."),
  vc("voice-naina-confident", "Naina — Confident Hinglish", "en-IN", "Direct, confident, no-nonsense. Best for ratio products."),
  vc("voice-meera-mom", "Meera — Soft motherly", "hi-IN", "Soft, caring, mom-tone. Best for baby + wellness."),
  vc("voice-vikram-authority", "Vikram — Authority Hindi", "hi-IN", "Deep, authoritative. Best for finance/insurance/B2B."),
  vc("voice-rohan-corporate", "Rohan — Corporate English", "en-IN", "Crisp, clean, mid-pitch. Best for SaaS/B2B."),
  vc("voice-zoya-fashion", "Zoya — Fashion-forward English", "en-IN", "Stylish, urban, fashion-savvy. Best for makeup/apparel."),
  vc("voice-arjun-genz", "Arjun — Gen Z Hinglish", "en-IN", "Slang-friendly, expressive, fast-paced. Best for streetwear/tech."),
  vc("voice-ananya-storyteller", "Ananya — Hindi storyteller", "hi-IN", "Narrative, soft-spoken. Best for emotional storytelling/long-form."),

  // South Indian languages
  vc("voice-divya-tamil", "Divya — Tamil female", "ta-IN", "Warm, conversational. Best for South-Indian-targeted DTC."),
  vc("voice-karthik-tamil", "Karthik — Tamil male", "ta-IN", "Confident, direct. Best for Chennai-targeted finance/tech."),
  vc("voice-kavya-telugu", "Kavya — Telugu female", "te-IN", "Friendly, gen-z. Best for Hyderabad-targeted beauty/fashion."),
  vc("voice-suresh-malayalam", "Suresh — Malayalam male", "ml-IN", "Smooth, calm. Best for Kerala-targeted wellness."),
  vc("voice-nila-kannada", "Nila — Kannada female", "kn-IN", "Bright, friendly. Best for Bangalore-targeted tech/D2C."),

  // Other Indian languages
  vc("voice-rohini-marathi", "Rohini — Marathi female", "mr-IN", "Maternal, trustworthy. Best for Mumbai-targeted family products."),
  vc("voice-pranay-marathi", "Pranay — Marathi male", "mr-IN", "Conversational, mid-pitch. Best for Pune-targeted finance."),
  vc("voice-ishaan-bengali", "Ishaan — Bengali male", "bn-IN", "Soft, intellectual. Best for Kolkata-targeted books/wellness."),
  vc("voice-tara-bengali", "Tara — Bengali female", "bn-IN", "Sweet, expressive. Best for Bengal-targeted beauty/jewellery."),
  vc("voice-sanya-punjabi", "Sanya — Punjabi female", "pa-IN", "Bright, festive, expressive. Best for Punjab-targeted festivities."),
  vc("voice-jaspal-punjabi", "Jaspal — Punjabi male", "pa-IN", "Strong, festive. Best for Punjab-targeted automotive/fashion."),
  vc("voice-priti-gujarati", "Priti — Gujarati female", "gu-IN", "Warm, family-oriented. Best for Gujarat-targeted gold/festive."),
  vc("voice-rajesh-gujarati", "Rajesh — Gujarati male", "gu-IN", "Trader-confident. Best for Gujarat-targeted business products."),

  // US English
  vc("voice-emily-calm", "Emily — Calm US English", "en-US", "Premium, calm, design-led. Best for mattress/wellness."),
  vc("voice-marcus-bold", "Marcus — Bold US English", "en-US", "Bold, confident, performance copy. Best for tech."),
  vc("voice-james-finance", "James — Finance US English", "en-US", "Crisp, authoritative. Best for fintech/banking."),
  vc("voice-sarah-mom", "Sarah — Mom-next-door US", "en-US", "Relatable, warm. Best for family/parenting brands."),
  vc("voice-ethan-tech", "Ethan — Tech bro US", "en-US", "Casual, fast-paced, gen-z. Best for SaaS/tech demos."),
  vc("voice-jessica-creator", "Jessica — Creator-style US", "en-US", "TikTok-style, expressive. Best for UGC/influencer feel."),

  // UK English
  vc("voice-olivia-rp", "Olivia — Received Pronunciation", "en-GB", "Refined, premium. Best for luxury/heritage brands."),
  vc("voice-david-narrator", "David — UK narrator", "en-GB", "Documentary-style, authoritative. Best for explainer videos."),
  vc("voice-charlotte-au", "Charlotte — Australian female", "en-AU", "Friendly, beachy. Best for activewear/lifestyle."),
  vc("voice-max-au", "Max — Australian male", "en-AU", "Easy-going, sporty. Best for outdoor/lifestyle."),

  // Latin / Spanish
  vc("voice-isabella-spanish", "Isabella — LATAM Spanish female", "es", "Warm, expressive. Best for Latin-America-targeted beauty."),
  vc("voice-mateo-spanish", "Mateo — LATAM Spanish male", "es", "Confident, energetic. Best for sports/automotive."),
  vc("voice-sofia-spain", "Sofia — Spain Castilian female", "es-ES", "Polished, urban. Best for Spain-targeted luxury."),

  // East Asian
  vc("voice-yuki-bright", "Yuki — Bright Japanese", "ja", "Bright, polite, optimistic. Best for global expansion."),
  vc("voice-hiroshi-narrator", "Hiroshi — Japanese narrator", "ja", "Calm, premium. Best for design/architecture brands."),
  vc("voice-mei-mandarin", "Mei — Mandarin female", "zh-CN", "Soft, friendly. Best for China-targeted beauty/skincare."),
  vc("voice-li-mandarin", "Li Wei — Mandarin male", "zh-CN", "Authoritative. Best for China-targeted automotive/finance."),
  vc("voice-jieun-korean", "Ji-eun — Korean female", "ko", "Sweet, K-beauty-style. Best for K-beauty brands."),
  vc("voice-minjun-korean", "Min-jun — Korean male", "ko", "Cool, streetwear-energy. Best for fashion/streetwear."),

  // SEA
  vc("voice-anya-thai", "Anya — Thai female", "th", "Friendly, warm. Best for SEA-targeted wellness/beauty."),
  vc("voice-darius-tagalog", "Darius — Tagalog male", "fil", "Friendly, expressive. Best for Philippines-targeted FMCG."),
  vc("voice-rina-bahasa", "Rina — Bahasa female", "id", "Bright, gen-z. Best for Indonesia-targeted gen-z brands."),
  vc("voice-mai-vietnamese", "Mai — Vietnamese female", "vi", "Soft, friendly. Best for Vietnam-targeted beauty."),

  // MENA
  vc("voice-zara-arabic", "Zara — Arabic female", "ar", "Warm, expressive. Best for MENA-targeted modest fashion/beauty."),
  vc("voice-omar-arabic", "Omar — Arabic male", "ar", "Confident, urban. Best for MENA-targeted tech/auto."),

  // French / European
  vc("voice-marie-french", "Marie — Parisian French female", "fr", "Refined, premium. Best for luxury beauty."),
  vc("voice-pierre-french", "Pierre — French male narrator", "fr", "Authoritative, polished. Best for luxury automotive."),

  // Specialty (older, character)
  vc("voice-margaret-narrator", "Margaret — Mature US female", "en-US", "Wise, calm. Best for senior wellness/insurance."),
  vc("voice-uncle-rajan", "Uncle Rajan — Mature Hindi", "hi-IN", "Traditional, family elder. Best for traditional/heritage products."),
  vc("voice-sutradhaar", "Sutradhaar — Hindi narrator", "hi-IN", "Theatrical narrator. Best for storytelling/heritage brands."),
];
