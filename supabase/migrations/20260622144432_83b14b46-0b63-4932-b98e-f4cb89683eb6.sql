
-- Deactivate any existing ads and insert a new Primlink ad featuring 5 images
UPDATE public.site_ads SET is_active = false;

INSERT INTO public.site_ads (heading, tagline, link_url, image_urls, video_url, is_active, sort_order)
VALUES (
  'Primlink International',
  'Your Quality. Our Commitment.',
  'https://primlink.com',
  ARRAY[
    '/__l5e/assets-v1/ed84164f-3c69-4946-aa38-55d1157c920c/prim_1.jpg',
    '/__l5e/assets-v1/26b2fcbe-57f7-4d0f-b5eb-0143da068793/prim_2.jpg',
    '/__l5e/assets-v1/09215d00-c392-45a6-92ae-7fc940ea18b6/prim_3.jpg',
    '/__l5e/assets-v1/b5539a0c-7b80-47de-b23f-b04c72d67f89/prim_4.jpg',
    '/__l5e/assets-v1/f1dae16b-8909-4e6c-9430-ad922da151a0/prim_5.jpg'
  ],
  NULL,
  true,
  0
);
