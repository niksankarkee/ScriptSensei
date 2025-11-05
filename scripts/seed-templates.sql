-- Seed Templates for ScriptSensei
-- This file populates the templates table with initial template data

-- Clear existing templates (optional, comment out if you want to keep existing data)
-- DELETE FROM templates;

-- Social Media Templates
INSERT INTO templates (name, description, category, platform, content, variables, is_premium, usage_count, created_at, updated_at) VALUES
(
    'TikTok Viral Hook',
    'Attention-grabbing opening for viral TikTok videos with trending format',
    'social_media',
    'TikTok',
    'Did you know {{topic}}? Here''s what most people don''t realize... [Continue with 3 shocking facts] Don''t forget to {{cta}}!',
    ARRAY['topic', 'cta'],
    false,
    0,
    NOW(),
    NOW()
),
(
    'Instagram Reel Trend',
    'Fast-paced Instagram Reel following current trends',
    'social_media',
    'Instagram',
    'Wait for it... {{topic}} is about to blow your mind! [Show transformation or reveal] Follow for more tips like this!',
    ARRAY['topic'],
    false,
    0,
    NOW(),
    NOW()
),
(
    'YouTube Shorts Hook',
    'Engaging 60-second YouTube Shorts format',
    'social_media',
    'YouTube',
    'If you''re struggling with {{problem}}, this {{duration}} second video will change everything. Here''s the secret: {{solution}}. Subscribe for more!',
    ARRAY['problem', 'duration', 'solution'],
    false,
    0,
    NOW(),
    NOW()
),
(
    'Facebook Product Showcase',
    'Product demonstration for Facebook videos',
    'social_media',
    'Facebook',
    'Introducing {{product_name}}! Check out these amazing features: [Feature 1: {{feature1}}] [Feature 2: {{feature2}}] [Feature 3: {{feature3}}]. Link in comments to get yours today!',
    ARRAY['product_name', 'feature1', 'feature2', 'feature3'],
    false,
    0,
    NOW(),
    NOW()
);

-- Educational Templates
INSERT INTO templates (name, description, category, platform, content, variables, is_premium, usage_count, created_at, updated_at) VALUES
(
    'YouTube Tutorial',
    'Step-by-step educational format for YouTube',
    'education',
    'YouTube',
    'In this video, I''ll show you {{topic}}. By the end, you''ll know how to {{outcome}}. Let''s get started! [Step 1: {{step1}}] [Step 2: {{step2}}] [Step 3: {{step3}}] Thanks for watching! Hit subscribe for more tutorials.',
    ARRAY['topic', 'outcome', 'step1', 'step2', 'step3'],
    false,
    0,
    NOW(),
    NOW()
),
(
    'Explainer Video',
    'Clear explanation format for complex topics',
    'education',
    'YouTube',
    'Let me explain {{topic}} in simple terms. Think of it like {{analogy}}. Here''s how it works: {{explanation}}. Now you understand {{topic}}!',
    ARRAY['topic', 'analogy', 'explanation'],
    false,
    0,
    NOW(),
    NOW()
),
(
    'How-To Guide',
    'Practical how-to format for skill-based content',
    'education',
    'TikTok',
    'How to {{skill}} in {{duration}} seconds! Follow these steps: Step 1: {{step1}}. Step 2: {{step2}}. Step 3: {{step3}}. That''s it! Save this for later.',
    ARRAY['skill', 'duration', 'step1', 'step2', 'step3'],
    false,
    0,
    NOW(),
    NOW()
);

-- Marketing Templates
INSERT INTO templates (name, description, category, platform, content, variables, is_premium, usage_count, created_at, updated_at) VALUES
(
    'Product Launch Announcement',
    'Exciting product launch format',
    'marketing',
    'YouTube',
    'Big news! We''re launching {{product_name}} and it''s going to revolutionize {{industry}}. Here''s what makes it special: {{unique_value}}. Available {{launch_date}}. Pre-order link in description!',
    ARRAY['product_name', 'industry', 'unique_value', 'launch_date'],
    false,
    0,
    NOW(),
    NOW()
),
(
    'Testimonial Video',
    'Customer testimonial format',
    'marketing',
    'Instagram',
    'Meet {{customer_name}}, who achieved {{result}} using {{product_name}}. Here''s their story: "{{testimonial}}". You can do it too! Link in bio.',
    ARRAY['customer_name', 'result', 'product_name', 'testimonial'],
    false,
    0,
    NOW(),
    NOW()
),
(
    'Limited Time Offer',
    'Urgency-driven promotional format',
    'marketing',
    'TikTok',
    '⚠️ ALERT! {{product_name}} is {{discount}}% off but ONLY for {{timeframe}}! Here''s why you need this: {{reason1}}, {{reason2}}, {{reason3}}. Don''t miss out! Link in bio.',
    ARRAY['product_name', 'discount', 'timeframe', 'reason1', 'reason2', 'reason3'],
    true,
    0,
    NOW(),
    NOW()
);

-- Entertainment Templates
INSERT INTO templates (name, description, category, platform, content, variables, is_premium, usage_count, created_at, updated_at) VALUES
(
    'Storytime Format',
    'Engaging narrative storytelling format',
    'entertainment',
    'YouTube',
    'You won''t believe what happened to me {{when}}! So there I was, {{situation}}, when suddenly {{event}}. What happened next was {{outcome}}. Let me know in the comments what you would have done!',
    ARRAY['when', 'situation', 'event', 'outcome'],
    false,
    0,
    NOW(),
    NOW()
),
(
    'Comedy Sketch',
    'Humorous short-form content',
    'entertainment',
    'TikTok',
    'POV: You''re {{character}} trying to {{action}}. *{{reaction1}}* Wait, that didn''t work. *{{reaction2}}* Finally! *{{resolution}}* Tag someone who needs to see this!',
    ARRAY['character', 'action', 'reaction1', 'reaction2', 'resolution'],
    false,
    0,
    NOW(),
    NOW()
),
(
    'Behind the Scenes',
    'Behind-the-scenes content format',
    'entertainment',
    'Instagram',
    'Ever wondered how we make {{product}}? Here''s a behind-the-scenes look! [Show process 1: {{process1}}] [Show process 2: {{process2}}] [Final result: {{result}}] Pretty cool, right?',
    ARRAY['product', 'process1', 'process2', 'result'],
    false,
    0,
    NOW(),
    NOW()
);

-- Premium Templates
INSERT INTO templates (name, description, category, platform, content, variables, is_premium, usage_count, created_at, updated_at) VALUES
(
    'Viral Growth Formula',
    'Proven viral video structure with psychological triggers',
    'social_media',
    'TikTok',
    'STOP SCROLLING! 🛑 You''re making this {{mistake}} and it''s costing you {{cost}}. I discovered {{solution}} and in just {{timeframe}}, I achieved {{result}}. Here''s the exact system: [Hook them with {{hook}}] [Build tension with {{tension}}] [Deliver transformation with {{transformation}}] [End with strong CTA: {{cta}}] Watch this {{urgency}} because {{reason}}!',
    ARRAY['mistake', 'cost', 'solution', 'timeframe', 'result', 'hook', 'tension', 'transformation', 'cta', 'urgency', 'reason'],
    true,
    0,
    NOW(),
    NOW()
),
(
    'Sales Conversion Script',
    'High-converting sales video with proven framework',
    'marketing',
    'YouTube',
    'Are you tired of {{pain_point}}? Imagine if {{dream_outcome}}. That''s exactly what {{product_name}} delivers. Here''s proof: {{social_proof}}. But here''s the thing - {{scarcity}}. Here''s what you get: [Benefit 1: {{benefit1}}] [Benefit 2: {{benefit2}}] [Benefit 3: {{benefit3}}] [Bonus: {{bonus}}] Usually {{original_price}}, but today only {{discount_price}}. Click the link before {{deadline}}. 100% money-back guarantee because {{guarantee_reason}}.',
    ARRAY['pain_point', 'dream_outcome', 'product_name', 'social_proof', 'scarcity', 'benefit1', 'benefit2', 'benefit3', 'bonus', 'original_price', 'discount_price', 'deadline', 'guarantee_reason'],
    true,
    0,
    NOW(),
    NOW()
),
(
    'Authority Builder',
    'Establish expertise and credibility',
    'education',
    'YouTube',
    'After {{years}} years and {{achievement}}, I''ve learned {{key_insight}}. Most people get {{topic}} wrong because {{common_mistake}}. Here''s the truth: {{truth}}. Let me break down the {{framework_name}} framework: [Pillar 1: {{pillar1}}] [Pillar 2: {{pillar2}}] [Pillar 3: {{pillar3}}] [Implementation: {{implementation}}] This is how {{case_study}} achieved {{case_study_result}}. Your turn - start with {{action_step}}.',
    ARRAY['years', 'achievement', 'key_insight', 'topic', 'common_mistake', 'truth', 'framework_name', 'pillar1', 'pillar2', 'pillar3', 'implementation', 'case_study', 'case_study_result', 'action_step'],
    true,
    0,
    NOW(),
    NOW()
);

-- Platform-Specific Optimization Templates
INSERT INTO templates (name, description, category, platform, content, variables, is_premium, usage_count, created_at, updated_at) VALUES
(
    'TikTok Algorithm Hack',
    'Optimized for TikTok''s recommendation algorithm',
    'social_media',
    'TikTok',
    '{{hook_emoji}} This {{topic}} hack got me {{result}}! Here''s what nobody tells you: {{secret}}. Try this: {{step1}}. Then: {{step2}}. Finally: {{step3}}. Works every time! {{cta_emoji}} Drop a ❤️ if this helped!',
    ARRAY['hook_emoji', 'topic', 'result', 'secret', 'step1', 'step2', 'step3', 'cta_emoji'],
    true,
    0,
    NOW(),
    NOW()
),
(
    'YouTube Algorithm Optimizer',
    'Structured for YouTube''s watch time and CTR',
    'social_media',
    'YouTube',
    'In this video about {{topic}}, I''ll reveal {{promise}} in the next {{duration}} minutes. But first, {{pattern_interrupt}}. Here''s the roadmap: [0:30 - {{section1}}] [{{time2}} - {{section2}}] [{{time3}} - {{section3}}] [{{time4}} - {{section4}}] By the way, {{mid_roll_hook}}. Make sure you subscribe because {{subscribe_reason}}. Now let''s dive into {{topic}}...',
    ARRAY['topic', 'promise', 'duration', 'pattern_interrupt', 'section1', 'time2', 'section2', 'time3', 'section3', 'time4', 'section4', 'mid_roll_hook', 'subscribe_reason'],
    true,
    0,
    NOW(),
    NOW()
);

-- Display inserted count
SELECT COUNT(*) as total_templates FROM templates;
