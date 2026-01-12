CREATE TABLE "topic_content_assets" (
  "asset_id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "topic_id" uuid NOT NULL,
  "course_id" uuid NOT NULL,
  "content_key" text NOT NULL,
  "content_type" text NOT NULL,
  "persona_key" "LearnerPersonaProfileKey",
  "payload" jsonb NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "topic_content_assets_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "topics" ("topic_id") ON DELETE CASCADE,
  CONSTRAINT "topic_content_assets_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses" ("course_id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "uq_topic_content_assets_topic_key_persona"
  ON "topic_content_assets" ("topic_id", "content_key", "persona_key");
CREATE INDEX "idx_topic_content_assets_course" ON "topic_content_assets" ("course_id");
CREATE INDEX "idx_topic_content_assets_topic" ON "topic_content_assets" ("topic_id");
CREATE INDEX "idx_topic_content_assets_key" ON "topic_content_assets" ("content_key");

WITH target AS (
  SELECT "topic_id", "course_id"
  FROM "topics"
  WHERE "module_no" = 1
    AND "topic_number" = 1
    AND "topic_name" ILIKE 'Introduction to Web Development in the AI Era'
  LIMIT 1
)
INSERT INTO "topic_content_assets" (
  "asset_id",
  "topic_id",
  "course_id",
  "content_key",
  "content_type",
  "persona_key",
  "payload",
  "created_at",
  "updated_at"
)
SELECT
  gen_random_uuid(),
  target."topic_id",
  target."course_id",
  't1-intro-text',
  'text',
  NULL,
  jsonb_build_object(
    'format',
    'markdown',
    'content',
    $$Welcome to the Future of Web Development
You're about to start something incredible!

This isn't your typical coding course where you memorize syntax and struggle through boring theory. You're entering the revolutionary world of AI-powered web development where artificial intelligence becomes your coding partner, making complex development accessible to everyone.

Whether you're completely new to coding or just curious about modern development, AI will be your constant companion, helping you build real applications from day one.$$,
    'variants',
    jsonb_build_object(
      'normal',
      $$Welcome to the Future of Web Development
You're about to start something incredible!

This isn't your typical coding course where you memorize syntax and struggle through boring theory. You're entering the revolutionary world of AI-powered web development where artificial intelligence becomes your coding partner, making complex development accessible to everyone.

Whether you're completely new to coding or just curious about modern development, AI will be your constant companion, helping you build real applications from day one.$$,
      'sports',
      $$Introduction to Web Development

in the AI Era becomes the Team Playbook.
It's the master guide every player studies before stepping onto the field. Just like a Playbook explains the offensive strategies, defensive formations, and how every role works together, this introduction shows you the entire landscape of modern web development - how websites look, how they move, and how they win games in the digital arena.

Web development itself is your full-field offense:
- The UI design is your route-running - how smooth and clear your movement looks to the fans.
- The functionality is your passing and running game - what actually pushes the ball down the field.
- Deployment is like lining up under stadium lights so the world can see what you've built.

But here's the twist: In today's league, you're not grinding alone through endless drills trying to memorize every play. You've got the newest addition to the coaching staff - AI as your Assistant Coach.

The Assistant Coach watches game tape at impossible speed, knows every play in the league, and whispers precise instructions into your helmet mic:
- "Here's the best formation for that play."
- "That route needs to shift left - fixed your syntax for you."
- "Defender incoming - here's the bug and I've patched it."
- "Here's a cleaner version of that play you just drew up."

That frees you, the Rookie Quarterback, to focus on reading the field, making smart decisions, and executing strategy instead of wrestling with tiny mechanical details.

Every time you build a component, you're calling a play.
Every time you adjust a layout, you're shifting formation.
Every time you test your app, the Referee Crew (debugging & testing) steps in to make sure no penalties - broken links, crashes, bad logic - slip through and cost you yards.

And just like a championship team builds momentum by running plays in sequence, you'll follow a structured season:
Study the Playbook -> Draft your game idea -> Design the play routes -> Build your offense -> Test for penalties -> Run it live in a real stadium.

By the time you finish this module, you won't just understand the Playbook - you'll know how to run the entire offense of a modern web application with an AI Assistant Coach constantly supporting you, keeping you safe, and helping you execute winning plays every time.$$,
      'cooking',
      $$Imagine stepping into a modern Michelin-level kitchen where the entire brigade works alongside advanced robotic sous-chefs. The station you're entering today is the Chef's Table Orientation - the moment where a new apprentice is shown not the recipes, but the philosophy and flow of the entire kitchen.
Web Development in the AI Era is like learning how a world-class restaurant creates unforgettable dining experiences - not just chopping vegetables, but understanding how every station, every tool, and every flavor works together to serve guests flawlessly.
In this kitchen analogy, web development becomes the art of designing and running a complete tasting menu that customers enjoy every day.
The "website" is the final plated dish that guests see.
The frontend is the plating, aroma, and presentation.
The backend is the simmering stock room, prep kitchen, and storage that powers everything behind the scenes.
And the deployment is sending your dish from the pass to the dining room, hot and perfect.
But here's the twist:
In this AI-powered era, you're not expected to memorize every cut, heat level, or classical French technique. Instead, you're partnered with a robotic sous-chef - an assistant that handles all tedious prep: it dices every vegetable to exact measurements, follows your spoken instructions for sauces, and even spots burnt reductions before you do.
When you say, "I want a smooth lemon-thyme vinaigrette with a hint of sweetness,"
the AI handles the whisking, balancing, and emulsifying - the syntax -
so you can focus on the flavor intention, the story of the dish, and the guest experience.
This transforms you from a recipe-follower into a menu architect.
Instead of drowning in technique, you shape:
- the ambiance (UI/UX design),
- the layers of flavor (features),
- the timing of each course (workflow and architecture),
- and the emotional journey each guest takes (user experience).
AI ensures your mise en place is always spotless, your ingredients measured perfectly, and your sauces consistent - freeing your mind for big creative decisions.
And just like every great kitchen sends dishes to the tasting counter for quality checks, your web creations go through tasting and debugging. You sample the textures, test the seasoning, ensure the plating is flawless - adjusting until the dish is worthy of service. AI even alerts you if a garnish is off-balance or a flavor clashes, helping you refine with precision.
Learning AI-powered web development is stepping into a kitchen where creativity is unlimited, mistakes are caught early, and you develop mastery 10x faster. By the time your first full tasting menu (your web app) leaves the pass, you'll understand how every station works - and know how to lead the kitchen confidently.
Your apprenticeship begins not with peeling onions, but with crafting experiences.$$,
      'adventure',
      $$Beginning your journey into AI-powered web development is like gearing up for your first long, multi-country digital nomad expedition, where every website you've ever visited becomes another city pinned on the world map. This phase of the journey is your Essential Gear Orientation - the moment you unzip your brand-new travel pack, check your GPS, and realize you're no longer traveling with paper maps alone.
Web development becomes your art of building destinations along your route - tiny cafes, pop-up hostels, scenic lookouts, roadside libraries - crafted for other travelers to stop by, experience, and enjoy. Each digital destination you create has its own atmosphere (design), its own activities (functionality), and its own address on the global internet (deployment).
In the old travel world, explorers spent years learning how to read every foreign sign, navigate every road manually, and decode every cultural nuance. Today, you've got an AI co-pilot riding shotgun - an advanced planner who understands every possible route, every regional dialect of code, and every hidden shortcut. Tell it, "I want a page where people can see my travel stories," and it instantly drafts the layout, handles the documentation, warns you of dead-end routes (bugs), and smooths out the rough patches.
This frees you to focus on the fun parts of the journey: curating experiences, deciding the vibe of your destination, choosing the paths travelers will walk, and solving unexpected detours along the way. The AI co-pilot quietly manages the logistics - like checking border requirements (syntax rules), optimizing your driving route (architecture), and translating street signs you don't understand (complex code).
Learning AI-powered development is like choosing to hit the road with better maps, instant translators, smarter booking systems, and a dashboard that can re-route instantly when a mountain pass shuts down. You travel farther, faster, and with more creativity.
Each module of this course becomes another leg of your Grand Tour:
packing your gear (tools), mapping your adventure (brainstorming), designing your campsite (UI design), building your shelters and scenic stops (coding), cross-checking your travel logs (testing), and finally opening your destination to global travelers (launching).
And just like any epic road trip, every detour teaches you something, every challenge builds confidence, and every new destination strengthens your identity as a creator. By the end, you'll not only have journeyed across the digital world - you'll have built your own places within it.$$)
  ),
  now(),
  now()
FROM target;

WITH target AS (
  SELECT "topic_id", "course_id"
  FROM "topics"
  WHERE "module_no" = 1
    AND "topic_number" = 1
    AND "topic_name" ILIKE 'Introduction to Web Development in the AI Era'
  LIMIT 1
)
INSERT INTO "topic_content_assets" (
  "asset_id",
  "topic_id",
  "course_id",
  "content_key",
  "content_type",
  "persona_key",
  "payload",
  "created_at",
  "updated_at"
)
SELECT
  gen_random_uuid(),
  target."topic_id",
  target."course_id",
  't1-hero-image',
  'image',
  persona_key,
  jsonb_build_object(
    'url',
    url_value,
    'alt',
    'Developer workspace',
    'caption',
    'A modern AI-powered workflow.'
  ),
  now(),
  now()
FROM target
CROSS JOIN (
  VALUES
    ('non_it_migrant', 'https://cp-ppts.s3.ap-south-2.amazonaws.com/Images/WhatsApp+Image+2025-12-10+at+11.56.14+AM.jpeg'),
    ('rote_memorizer', 'https://cp-ppts.s3.ap-south-2.amazonaws.com/Images/WhatsApp+Image+2025-12-10+at+11.56.14+AM.jpeg'),
    ('english_hesitant', 'https://cp-ppts.s3.ap-south-2.amazonaws.com/Images/WhatsApp+Image+2025-12-10+at+11.56.14+AM.jpeg'),
    ('last_minute_panic', 'https://cp-ppts.s3.ap-south-2.amazonaws.com/Images/WhatsApp+Image+2025-12-10+at+11.56.14+AM.jpeg'),
    ('pseudo_coder', 'https://plus.unsplash.com/premium_photo-1683121710572-7723bd2e235d?q=80&w=1332&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')
) AS persona_map(persona_key, url_value);

WITH target AS (
  SELECT "topic_id", "course_id"
  FROM "topics"
  WHERE "module_no" = 1
    AND "topic_number" = 1
    AND "topic_name" ILIKE 'Introduction to Web Development in the AI Era'
  LIMIT 1
)
INSERT INTO "topic_content_assets" (
  "asset_id",
  "topic_id",
  "course_id",
  "content_key",
  "content_type",
  "persona_key",
  "payload",
  "created_at",
  "updated_at"
)
SELECT
  gen_random_uuid(),
  target."topic_id",
  target."course_id",
  't1-webdev-text',
  'text',
  NULL,
  jsonb_build_object(
    'format',
    'markdown',
    'content',
    $$What is Web Development?
Think about every website you visit - Facebook, Netflix, your favorite online store, even this learning platform. That's all web development!

Web development is the art of creating digital experiences that millions of people use daily. It involves:

Designing how websites look and feel
Building the functionality that makes them work
Launching them live on the internet

Here's the game-changer: Traditional web development required years of studying multiple programming languages. But in 2025, AI tools have completely transformed this landscape, making professional development accessible to anyone willing to learn.$$,
    'variants',
    jsonb_build_object(
      'normal',
      $$What is Web Development?
Think about every website you visit - Facebook, Netflix, your favorite online store, even this learning platform. That's all web development!

Web development is the art of creating digital experiences that millions of people use daily. It involves:

Designing how websites look and feel
Building the functionality that makes them work
Launching them live on the internet

Here's the game-changer: Traditional web development required years of studying multiple programming languages. But in 2025, AI tools have completely transformed this landscape, making professional development accessible to anyone willing to learn.$$,
      'sports',
      $$What is Web Development?
Think of every website like game day - the stadium, the scoreboard, the crowd, and the full experience. That is web development.

Web development is building the full game plan fans experience:
- Designing how the play looks and feels (formation and visuals)
- Building the functionality that makes it work (execution and timing)
- Launching it live for the crowd (kickoff in the stadium)

The game-changer: you no longer need years of film study alone. In 2025, AI is the assistant coach that helps you run the playbook faster and smarter.$$,
      'cooking',
      $$What is Web Development?
Every website is like a dish served to guests. Web development is the craft of designing and delivering that dish.

It involves:
- Designing how the dish looks and feels (presentation and plating)
- Building the functionality that makes it work (the recipe and kitchen flow)
- Launching it live to the dining room (service and delivery)

The game-changer: you no longer need years of traditional training. In 2025, AI is the sous-chef that accelerates learning and helps you ship real creations faster.$$,
      'adventure',
      $$What is Web Development?
Every website is a destination on your journey - a place people visit and experience. Web development is building those destinations.

It involves:
- Designing how the place looks and feels (map, layout, vibe)
- Building the functionality that makes it work (paths and interactions)
- Launching it live for travelers (opening the destination to the world)

The game-changer: you no longer need years of manual navigation. In 2025, AI is the co-pilot that speeds up the journey and helps you build faster.$$)
  ),
  now(),
  now()
FROM target;

WITH target AS (
  SELECT "topic_id", "course_id"
  FROM "topics"
  WHERE "module_no" = 1
    AND "topic_number" = 1
    AND "topic_name" ILIKE 'Introduction to Web Development in the AI Era'
  LIMIT 1
)
INSERT INTO "topic_content_assets" (
  "asset_id",
  "topic_id",
  "course_id",
  "content_key",
  "content_type",
  "persona_key",
  "payload",
  "created_at",
  "updated_at"
)
SELECT
  gen_random_uuid(),
  target."topic_id",
  target."course_id",
  't1-intro-video',
  'video',
  persona_key,
  jsonb_build_object(
    'url',
    url_value,
    'title',
    'Lesson walkthrough'
  ),
  now(),
  now()
FROM target
CROSS JOIN (
  VALUES
    ('non_it_migrant', 'https://www.youtube.com/embed/cclX1YodSEQ?si=s4Vek5Ks4YRGncr7'),
    ('rote_memorizer', 'https://www.youtube.com/embed/cclX1YodSEQ?si=s4Vek5Ks4YRGncr7'),
    ('english_hesitant', 'https://www.youtube.com/embed/cclX1YodSEQ?si=s4Vek5Ks4YRGncr7'),
    ('last_minute_panic', 'https://www.youtube.com/embed/cclX1YodSEQ?si=s4Vek5Ks4YRGncr7'),
    ('pseudo_coder', 'https://youtu.be/JkuHKE_jfeI?si=ZlYfErLponFamu8q')
) AS persona_map(persona_key, url_value);

WITH target AS (
  SELECT "topic_id", "course_id"
  FROM "topics"
  WHERE "module_no" = 1
    AND "topic_number" = 1
    AND "topic_name" ILIKE 'Introduction to Web Development in the AI Era'
  LIMIT 1
)
INSERT INTO "topic_content_assets" (
  "asset_id",
  "topic_id",
  "course_id",
  "content_key",
  "content_type",
  "persona_key",
  "payload",
  "created_at",
  "updated_at"
)
SELECT
  gen_random_uuid(),
  target."topic_id",
  target."course_id",
  't1-ai-text',
  'text',
  NULL,
  jsonb_build_object(
    'format',
    'markdown',
    'content',
    $$How AI is Revolutionizing Web Development
AI has changed everything about how we build websites and applications.

Instead of writing every line of code manually, AI now:
- Generates code from simple descriptions you provide
- Creates designs and layouts based on your ideas
- Finds and fixes bugs automatically
- Suggests improvements and optimizations
- Provides instant solutions when you get stuck

What this means for you: You can focus on creativity and problem-solving while AI handles the technical heavy lifting. It's like having a senior developer sitting next to you, ready to help 24/7.

Why Learn AI-Powered Web Development?
This isn't just about learning to code - it's about future-proofing your career.$$,
    'variants',
    jsonb_build_object(
      'normal',
      $$How AI is Revolutionizing Web Development
AI has changed everything about how we build websites and applications.

Instead of writing every line of code manually, AI now:
- Generates code from simple descriptions you provide
- Creates designs and layouts based on your ideas
- Finds and fixes bugs automatically
- Suggests improvements and optimizations
- Provides instant solutions when you get stuck

What this means for you: You can focus on creativity and problem-solving while AI handles the technical heavy lifting. It's like having a senior developer sitting next to you, ready to help 24/7.

Why Learn AI-Powered Web Development?
This isn't just about learning to code - it's about future-proofing your career.$$,
      'sports',
      $$How AI is Revolutionizing Web Development
AI has changed the way teams run the game.

Instead of executing every play manually, AI now:
- Draws up code from your play calls
- Designs formations and layouts from your ideas
- Flags bugs like penalties before they cost you yards
- Suggests better routes and optimizations
- Gives instant help when you get stuck

What this means for you: you focus on strategy and decision-making while AI handles the details. It is like having a senior coach on the headset at all times.

Why Learn AI-Powered Web Development?
This is about building a winning career with the tools top teams already use.$$,
      'cooking',
      $$How AI is Revolutionizing Web Development
AI has changed how the kitchen runs.

Instead of prepping every ingredient by hand, AI now:
- Generates code from your descriptions
- Creates layouts and designs from your ideas
- Spots bugs like a sous-chef catching a burnt sauce
- Suggests improvements and refinements
- Provides instant help when you get stuck

What this means for you: you focus on flavor, experience, and creativity while AI handles the prep. It is like having a senior sous-chef beside you 24/7.

Why Learn AI-Powered Web Development?
This is about future-proofing your career with the tools modern kitchens already rely on.$$,
      'adventure',
      $$How AI is Revolutionizing Web Development
AI has changed how travelers build and navigate the journey.

Instead of doing every step manually, AI now:
- Generates code from your directions
- Creates layouts and designs from your ideas
- Detects bugs like a co-pilot warning about a detour
- Suggests better routes and optimizations
- Gives instant help when you get stuck

What this means for you: you focus on the experience and creativity while AI handles the logistics. It is like having a skilled co-pilot beside you at all times.

Why Learn AI-Powered Web Development?
This is about building a future-proof path with the tools explorers already use.$$)
  ),
  now(),
  now()
FROM target;

WITH target AS (
  SELECT "topic_id", "course_id"
  FROM "topics"
  WHERE "module_no" = 1
    AND "topic_number" = 1
    AND "topic_name" ILIKE 'Introduction to Web Development in the AI Era'
  LIMIT 1
)
INSERT INTO "topic_content_assets" (
  "asset_id",
  "topic_id",
  "course_id",
  "content_key",
  "content_type",
  "persona_key",
  "payload",
  "created_at",
  "updated_at"
)
SELECT
  gen_random_uuid(),
  target."topic_id",
  target."course_id",
  't1-intro-ppt',
  'ppt',
  persona_key,
  jsonb_build_object(
    'url',
    url_value,
    'title',
    'Slides deck'
  ),
  now(),
  now()
FROM target
CROSS JOIN (
  VALUES
    ('non_it_migrant', 'https://cp-ppts.s3.ap-south-2.amazonaws.com/slides+1.1.pptx'),
    ('rote_memorizer', 'https://cp-ppts.s3.ap-south-2.amazonaws.com/slides+1.1.pptx'),
    ('english_hesitant', 'https://cp-ppts.s3.ap-south-2.amazonaws.com/slides+1.1.pptx'),
    ('last_minute_panic', 'https://cp-ppts.s3.ap-south-2.amazonaws.com/slides+1.1.pptx'),
    ('pseudo_coder', 'https://cp-ppts.s3.ap-south-2.amazonaws.com/ppt/Self-Hosting.pptx')
) AS persona_map(persona_key, url_value);

UPDATE "topics"
SET "text_content" = $${
  "version": "1.0",
  "blocks": [
    { "id": "block-1", "type": "text", "contentKey": "t1-intro-text" },
    { "id": "block-2", "type": "image", "contentKey": "t1-hero-image" },
    { "id": "block-3", "type": "text", "contentKey": "t1-webdev-text" },
    { "id": "block-4", "type": "video", "contentKey": "t1-intro-video" },
    { "id": "block-5", "type": "text", "contentKey": "t1-ai-text" },
    { "id": "block-6", "type": "ppt", "contentKey": "t1-intro-ppt" }
  ]
}$$
WHERE "topic_id" = (
  SELECT "topic_id"
  FROM "topics"
  WHERE "module_no" = 1
    AND "topic_number" = 1
    AND "topic_name" ILIKE 'Introduction to Web Development in the AI Era'
  LIMIT 1
);
