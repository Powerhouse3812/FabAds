import type { Category } from "@/genie6/types/entities";

/**
 * Catalogue categories — single source of truth (Catalogue ↔ Genie sync).
 *
 * Iter-6 A-9 expansion: from 6 entries → 55 entries spanning the full DTC + SaaS
 * landscape we run ads for. Realistic Indian DTC + global verticals; no Lorem
 * Ipsum filler.
 *
 * Schema matches `Category` from `@/genie6/types/entities`:
 *   id, name, similarCategoryIds, referenceUrls, instruction, winnerCount, feedbackCount
 *
 * Used by:
 *   - Catalogue list page (/catalogue/categories)
 *   - Genie 6.0 Assets workspace
 *   - Affiliate Ad mode (product → category lookup)
 *   - Knowledge Base (per-category instruction surface)
 */

const c = (
  id: string,
  name: string,
  instruction: string,
  similarCategoryIds: string[] = [],
  winnerCount: number = 0,
  feedbackCount: number = 0,
  referenceUrls: string[] = []
): Category => ({ id, name, similarCategoryIds, referenceUrls, instruction, winnerCount, feedbackCount });

export const categories: Category[] = [
  // Personal Care & Beauty
  c("hair-care", "Hair Care", "Lead with the active ingredient (onion / argan / biotin) and the visible problem it solves. Show before/after on real Indian hair textures.", ["hair-oil", "anti-dandruff", "hair-color"], 142, 38),
  c("hair-oil", "Hair Oil", "Quote the time-to-result (e.g. 'visible in 6 weeks'). Pair with hand-massage shots; avoid generic salon stock.", ["hair-care"], 87, 24),
  c("hair-color", "Hair Color", "Show real before/after on Indian skin tones. Lead with no-ammonia / 100%-grey-coverage promise.", ["hair-care"], 41, 12),
  c("anti-dandruff", "Anti-Dandruff", "Hero the flake-free shoulder shot. Mention key actives (ZPTO, ketoconazole, neem) up front.", ["hair-care"], 34, 9),
  c("skin-care", "Skin Care", "Visible-claims first (X% reduction in fine lines, dark spots in 4 weeks). Texture shots > face shots.", ["anti-aging", "acne", "pigmentation", "sunscreen"], 218, 61),
  c("anti-aging", "Anti-Aging Skincare", "Lead with retinol / peptide / niacinamide concentrations. Clinical-trial language ok.", ["skin-care"], 64, 17),
  c("acne", "Acne Care", "Salicylic / BHA / niacinamide claims. Real spot-clearing before/after, not generic glow shots.", ["skin-care"], 51, 14),
  c("pigmentation", "Pigmentation Care", "Vitamin C, alpha-arbutin, kojic acid. 6-8 week clinical comparison shots work best.", ["skin-care"], 38, 11),
  c("sunscreen", "Sunscreen", "SPF + PA+++ rating in the first frame. No-white-cast for Indian skin tones is the hook.", ["skin-care"], 73, 19),
  c("body-care", "Body Care", "Lotions, body washes, scrubs. Target dryness + post-shower moisturization angle.", ["skin-care"], 29, 7),
  c("foot-care", "Foot Care", "Cracked-heel before/after. Urea + AHA-based creams convert best.", ["body-care"], 18, 4),
  c("lip-care", "Lip Care", "Tinted balms with SPF. Visible color payoff + softness claim.", ["skin-care", "makeup-lip"], 24, 6),
  c("baby-care", "Baby Care", "Toxin-free / paraben-free / pediatrician-tested. Calming bath-time imagery.", ["body-care"], 31, 8),
  c("mens-grooming", "Men's Grooming", "Beard care + grooming kits. Direct, no-fluff copy. Premium black/copper aesthetic.", ["beard-care"], 55, 15),
  c("beard-care", "Beard Care", "Beard oil, balm, wash. Show the beard transformation arc, not just the product.", ["mens-grooming"], 32, 9),
  c("oral-care", "Oral Care", "Whitening + sensitivity claims. Dentist-recommended badge converts.", [], 19, 5),
  c("personal-hygiene", "Personal Hygiene", "Deodorants, razors, intimate care. Tasteful, never preachy.", ["fragrance"], 26, 7),
  c("fragrance", "Fragrance", "Top/heart/base notes. Stage-by-stage video of the wear journey.", ["personal-hygiene"], 41, 11),
  c("makeup", "Makeup", "Across lip / eye / face. Real Indian skin tone application shots.", ["makeup-lip", "makeup-eye", "makeup-face"], 78, 21),
  c("makeup-lip", "Lip Makeup", "Lipsticks, glosses, tints. Swatch + on-lip combo. Indian skin tone curated.", ["makeup", "lip-care"], 47, 12),
  c("makeup-eye", "Eye Makeup", "Mascaras, kajal, eyeshadow. Cat-eye / smoky-eye demo.", ["makeup"], 35, 10),
  c("makeup-face", "Face Makeup", "Foundation, concealer, blush. Shade-match app integration is a strong hook.", ["makeup"], 42, 12),

  // Wearables & Audio
  c("smartwatches", "Smartwatches", "AMOLED display + battery life + sport modes. Show the watch on a real wrist, not floating.", ["fitness-trackers", "wireless-earbuds"], 167, 44),
  c("wireless-earbuds", "Wireless Earbuds", "ANC + battery + dual-device. Wear-test scene > unboxing.", ["smartwatches", "bluetooth-speakers"], 132, 35),
  c("bluetooth-speakers", "Bluetooth Speakers", "Bass + waterproof rating + battery. Outdoor/party scene works.", ["wireless-earbuds"], 58, 14),
  c("fitness-trackers", "Fitness Trackers", "Step + heart-rate + sleep. Daily-use morning routine montage.", ["smartwatches"], 43, 11),
  c("gaming-headsets", "Gaming Headsets", "Surround sound + mic clarity. Stream-deck / esports aesthetic.", ["wireless-earbuds"], 22, 6),
  c("smart-rings", "Smart Rings", "Sleep tracking + minimalist form factor. Premium product photography.", ["fitness-trackers", "smartwatches"], 12, 3),

  // Sleep & Wellness
  c("mattresses", "Mattresses", "Memory-foam / orthopedic / cooling. 100-night-trial guarantee is the hero.", ["bedding", "pillows"], 84, 22),
  c("pillows", "Pillows", "Neck-pain / cervical / cooling-gel. Alignment shots > glamour shots.", ["mattresses", "bedding"], 38, 10),
  c("bedding", "Bedding", "300-thread-count + breathable + machine-washable. Real-bedroom styling.", ["mattresses", "pillows"], 41, 11),
  c("wellness", "Wellness", "Vitamins, probiotics, supplements. Doctor / dietitian credibility wrapper.", ["vitamins", "probiotics"], 62, 16),
  c("vitamins", "Vitamins & Supplements", "Specific deficiency targeting (D3, B12, biotin, multivitamin). Pill-count + price/day math.", ["wellness"], 47, 12),
  c("probiotics", "Probiotics & Gut Health", "CFU count + strain count + delayed-release capsule tech.", ["wellness"], 28, 7),

  // Fashion & Apparel
  c("apparel-casual", "Casual Wear", "T-shirts, jeans, casual shirts. Lifestyle outdoor shots.", ["streetwear", "innerwear"], 113, 31),
  c("apparel-formal", "Formal Wear", "Shirts, trousers, suits. Office-meeting context.", ["apparel-casual"], 56, 15),
  c("apparel-ethnic", "Ethnic Wear", "Sarees, kurtas, lehengas. Festive + wedding season hooks.", ["apparel-formal"], 89, 24),
  c("streetwear", "Streetwear", "Oversized fits, bold prints, Gen-Z language. UGC > studio.", ["apparel-casual", "activewear"], 71, 19),
  c("activewear", "Activewear", "Performance fabrics, sweat-wicking, four-way stretch. Gym + studio context.", ["streetwear", "yoga"], 64, 17),
  c("yoga", "Yoga & Studio", "Yoga pants, sports bras, mats. Calm-morning aesthetic.", ["activewear"], 32, 9),
  c("innerwear", "Innerwear", "Comfort + fabric tech (modal, bamboo, cotton blends). Tasteful, not provocative.", ["sleepwear"], 38, 10),
  c("sleepwear", "Sleepwear & Loungewear", "Soft fabrics, lounge cuts. WFH / cosy aesthetic.", ["innerwear"], 24, 6),

  // Footwear
  c("sneakers", "Sneakers & Casual Footwear", "Sole tech + colorway + comfort claim. Real-foot-on-pavement shot.", ["footwear-formal", "activewear"], 78, 21),
  c("footwear-formal", "Formal Footwear", "Leather quality + craftsmanship. Office / wedding context.", ["sneakers"], 32, 8),
  c("sandals", "Sandals & Slippers", "Comfort fit + arch support. Beach / casual context.", ["sneakers"], 21, 5),

  // Accessories
  c("eyewear-sunglasses", "Sunglasses", "UV protection + frame fit + lens tech. On-face shot at varied angles.", ["eyewear-optical"], 47, 12),
  c("eyewear-optical", "Optical Frames", "Anti-glare + lens material + frame fit. Try-on AR is a strong CTA.", ["eyewear-sunglasses"], 53, 14),
  c("jewellery-gold", "Gold Jewellery", "Hallmark + craftsmanship + gifting occasion (Diwali, wedding).", ["jewellery-silver", "diamond"], 41, 11),
  c("jewellery-silver", "Silver Jewellery", "925 sterling + minimalist daily-wear angle.", ["jewellery-gold"], 28, 7),
  c("diamond", "Diamond Jewellery", "Cut/clarity/color/carat. Story-driven (anniversary, milestone).", ["jewellery-gold", "lab-diamond"], 36, 10),
  c("lab-diamond", "Lab-Grown Diamonds", "Same brilliance, ethical, lower price. The disruption story.", ["diamond"], 18, 5),

  // Furniture & Home
  c("furniture-sofa", "Sofas & Recliners", "Modular + fabric + warranty. Living-room scene styling.", ["furniture-bed"], 39, 10),
  c("furniture-bed", "Beds & Bedroom", "Hydraulic storage + mattress combo + warranty.", ["furniture-sofa", "mattresses"], 33, 9),
  c("kitchen-appliances", "Kitchen Appliances", "Mixers, air fryers, induction. Time-saved or healthier-meals angle.", ["cookware"], 51, 13),
  c("cookware", "Cookware", "Non-stick + ceramic + induction-compatible. Sizzle reels work.", ["kitchen-appliances"], 24, 6),

  // Pet
  c("pet-care", "Pet Care", "Grooming, treats, toys. Real pets always — never stock animals.", ["pet-food"], 27, 7),
  c("pet-food", "Pet Food & Nutrition", "Vet-formulated + grain-free + life-stage-specific (puppy, adult, senior).", ["pet-care"], 19, 5),

  // Travel & Bags
  c("travel-bags", "Travel Bags & Luggage", "Cabin-size + spinner wheels + warranty. Airport/hotel context.", [], 22, 6),
];

/* ───────── Lookup helper — preserved from the original mocks/categories.ts ───────── */
export function getCategory(id: string) {
  return categories.find((c) => c.id === id);
}
