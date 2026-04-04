-- Seed: EEO Investigator Certification exam definition
INSERT INTO "Exam" ("id", "slug", "title", "stripePriceId", "ceuPriceId", "active")
VALUES (
  'exam_eeo_investigator',
  'eeo-investigator',
  'EEO Investigator Certification',
  'price_1TEf1WIFF41jCM2Z8F0xlHdF',
  'price_1TGQx8IFF41jCM2ZrTgOM6Gl',
  true
)
ON CONFLICT ("slug") DO NOTHING;
