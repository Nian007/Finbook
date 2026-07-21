-- Seed default subscription plans (only insert if table is empty)
INSERT INTO subscription_plans (name, price_in_paise, duration_days, description, display_order, is_active)
SELECT 'Monthly', 75000, 30, 'Perfect to get started', 1, true
WHERE NOT EXISTS (SELECT 1 FROM subscription_plans WHERE name = 'Monthly');

INSERT INTO subscription_plans (name, price_in_paise, duration_days, description, display_order, is_active)
SELECT 'Quarterly', 200000, 90, 'Save ₹250 vs monthly', 2, true
WHERE NOT EXISTS (SELECT 1 FROM subscription_plans WHERE name = 'Quarterly');

INSERT INTO subscription_plans (name, price_in_paise, duration_days, description, display_order, is_active)
SELECT 'Half-yearly', 375000, 180, 'Save ₹750 vs monthly', 3, true
WHERE NOT EXISTS (SELECT 1 FROM subscription_plans WHERE name = 'Half-yearly');

INSERT INTO subscription_plans (name, price_in_paise, duration_days, description, display_order, is_active)
SELECT 'Yearly', 750000, 365, 'Best value — 2 months free', 4, true
WHERE NOT EXISTS (SELECT 1 FROM subscription_plans WHERE name = 'Yearly');
