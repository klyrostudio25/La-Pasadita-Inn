-- =========================================================================
-- LA PASADITA INN - FULL SUPABASE DATABASE SCHEMA MIGRATION & SEED DATA
-- Copy and execute this complete script in your Supabase SQL Editor.
-- =========================================================================

-- Enable uuid-ossp extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================================================
-- 1. SITE SETTINGS TABLE (Live Storefront Customizer)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.site_settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    primary_accent_color TEXT NOT NULL DEFAULT '#DDA843',
    dark_theme_background TEXT NOT NULL DEFAULT '#08080A',
    hero_title TEXT NOT NULL DEFAULT 'LA PASADITA INN',
    hero_subtext TEXT NOT NULL DEFAULT 'Denver Historic Triangular Landmark • Grandma-Led Authentic Mexican Cooking',
    announcement_banner_text TEXT NOT NULL DEFAULT '🔥 Denver Historic Landmark · Scratch Grandma-Led Mexican Cooking · Walk-Ins & Phone Orders Welcome!',
    announcement_enabled BOOLEAN NOT NULL DEFAULT true,
    open_closed_status TEXT NOT NULL DEFAULT 'auto', -- 'auto', 'open', 'closed'
    custom_closed_message TEXT DEFAULT 'Closed for private family preparation · Opens at 11:00 AM',
    estimated_pickup_minutes TEXT DEFAULT '15 – 20',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- 2. CATEGORIES TABLE
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- 3. MENU ITEMS TABLE
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.menu_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    spanish_name TEXT,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL,
    badge TEXT,
    is_available BOOLEAN DEFAULT true,
    image_url TEXT,
    spice_level TEXT,
    grandma_note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- 4. ORDERS TABLE
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    order_type TEXT NOT NULL DEFAULT 'Takeout', -- 'Takeout', 'Dine-In Pickup', 'Delivery'
    delivery_address TEXT,
    delivery_fee NUMERIC(10, 2) DEFAULT 0,
    total_amount NUMERIC(10, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',     -- 'pending', 'preparing', 'ready', 'completed', 'cancelled'
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- 5. ORDER ITEMS TABLE
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE SET NULL,
    item_name TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price NUMERIC(10, 2) NOT NULL,
    selected_option TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- 6. RESERVATIONS TABLE (Table & Event Bookings)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.reservations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT,
    party_size INTEGER NOT NULL DEFAULT 2,
    reservation_date DATE NOT NULL,
    reservation_time TEXT NOT NULL,
    special_requests TEXT,
    status TEXT NOT NULL DEFAULT 'confirmed', -- 'confirmed', 'cancelled'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES — PRODUCTION HARDENED
-- =========================================================================

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- 1. Site Settings Policies
DROP POLICY IF EXISTS "Public can view site settings" ON public.site_settings;
CREATE POLICY "Public can view site settings"
    ON public.site_settings FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Anyone can update site settings" ON public.site_settings;
DROP POLICY IF EXISTS "Only authenticated admins can update site settings" ON public.site_settings;
CREATE POLICY "Only authenticated admins can update site settings"
    ON public.site_settings FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 2. Categories Policies
DROP POLICY IF EXISTS "Public can view categories" ON public.categories;
CREATE POLICY "Public can view categories"
    ON public.categories FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Anyone can insert categories" ON public.categories;
DROP POLICY IF EXISTS "Only authenticated admins can manage categories" ON public.categories;
CREATE POLICY "Only authenticated admins can manage categories"
    ON public.categories FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 3. Menu Items Policies (Public Read, Admin Write Only)
DROP POLICY IF EXISTS "Public can view available menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Public can view all menu items" ON public.menu_items;
CREATE POLICY "Public can view all menu items"
    ON public.menu_items FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Admin can insert menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Only authenticated admins can insert menu items" ON public.menu_items;
CREATE POLICY "Only authenticated admins can insert menu items"
    ON public.menu_items FOR INSERT
    TO authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Admin can update menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Only authenticated admins can update menu items" ON public.menu_items;
CREATE POLICY "Only authenticated admins can update menu items"
    ON public.menu_items FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Admin can delete menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Only authenticated admins can delete menu items" ON public.menu_items;
CREATE POLICY "Only authenticated admins can delete menu items"
    ON public.menu_items FOR DELETE
    TO authenticated
    USING (true);

-- 4. Orders Policies (Secure PII Protection)
-- Public customers can insert new orders
DROP POLICY IF EXISTS "Public can insert orders" ON public.orders;
CREATE POLICY "Public can insert orders"
    ON public.orders FOR INSERT
    WITH CHECK (true);

-- Only authenticated restaurant staff can view all orders
-- Note: Anonymous users cannot dump the orders table
DROP POLICY IF EXISTS "Public can view orders" ON public.orders;
DROP POLICY IF EXISTS "Staff can view all orders" ON public.orders;
CREATE POLICY "Staff can view all orders"
    ON public.orders FOR SELECT
    USING (auth.role() = 'authenticated');

-- Only authenticated restaurant staff can update order status
DROP POLICY IF EXISTS "Public can update order status" ON public.orders;
DROP POLICY IF EXISTS "Staff can update orders" ON public.orders;
CREATE POLICY "Staff can update orders"
    ON public.orders FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Only authenticated restaurant staff can delete orders
DROP POLICY IF EXISTS "Public can delete orders" ON public.orders;
DROP POLICY IF EXISTS "Staff can delete orders" ON public.orders;
CREATE POLICY "Staff can delete orders"
    ON public.orders FOR DELETE
    TO authenticated
    USING (true);

-- 5. Order Items Policies
DROP POLICY IF EXISTS "Public can insert order items" ON public.order_items;
CREATE POLICY "Public can insert order items"
    ON public.order_items FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Public can view order items" ON public.order_items;
DROP POLICY IF EXISTS "Staff can view order items" ON public.order_items;
CREATE POLICY "Staff can view order items"
    ON public.order_items FOR SELECT
    USING (auth.role() = 'authenticated');

-- 6. Reservations Policies
DROP POLICY IF EXISTS "Public can create reservations" ON public.reservations;
CREATE POLICY "Public can create reservations"
    ON public.reservations FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Staff can view reservations" ON public.reservations;
CREATE POLICY "Staff can view reservations"
    ON public.reservations FOR SELECT
    TO authenticated
    USING (true);


-- =========================================================================
-- ENABLE SUPABASE REALTIME REPLICATION FOR LIVE STOREFRONT & ORDERS
-- =========================================================================

-- Safely add tables to supabase_realtime publication
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'site_settings'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.site_settings;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'menu_items'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.menu_items;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'orders'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'order_items'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.order_items;
    END IF;
END $$;

-- =========================================================================
-- SEED INITIAL DATA FOR LA PASADITA INN
-- =========================================================================

-- 1. Seed Site Settings
INSERT INTO public.site_settings (
    id,
    primary_accent_color,
    dark_theme_background,
    hero_title,
    hero_subtext,
    announcement_banner_text,
    announcement_enabled,
    open_closed_status,
    custom_closed_message,
    estimated_pickup_minutes
) VALUES (
    'default',
    '#DDA843',
    '#08080A',
    'LA PASADITA INN',
    'Denver Historic Triangular Landmark • Grandma-Led Authentic Mexican Cooking',
    '🔥 Denver Historic Landmark · Scratch Grandma-Led Mexican Cooking · Walk-Ins & Phone Orders Welcome!',
    true,
    'auto',
    'Closed for private family preparation · Opens at 11:00 AM',
    '15 – 20'
) ON CONFLICT (id) DO UPDATE SET
    updated_at = NOW();

-- 2. Seed Categories & Menu Items
DO $$
DECLARE
    cat_specials UUID := uuid_generate_v4();
    cat_tacos UUID := uuid_generate_v4();
    cat_soups UUID := uuid_generate_v4();
    cat_drinks UUID := uuid_generate_v4();
BEGIN
    -- Only seed categories if empty
    IF NOT EXISTS (SELECT 1 FROM public.categories LIMIT 1) THEN
        -- Insert Categories
        INSERT INTO public.categories (id, name, display_order) VALUES
        (cat_specials, 'Signature Specials', 1),
        (cat_tacos, 'Tacos & Tortas', 2),
        (cat_soups, 'Caldos & Soups', 3),
        (cat_drinks, 'Drinks & Desserts', 4);

        -- Insert Signature Specials
        INSERT INTO public.menu_items (category_id, name, spanish_name, description, price, badge, is_available, image_url, spice_level, grandma_note) VALUES
        (cat_specials, 'Crispy Chile Rellenos', 'Rellenos Crujientes de la Casa',
         'Fresh roasted poblano pepper stuffed with molten Monterey Jack cheese, crispy fried in home-style batter, and generously smothered in house pork green chile.',
         15.19, 'Grandma''s Favorite', true, '/src/assets/images/hero_chile_relleno_1792550221170.jpg', 'Medium', 'Denver-style crispy comal fried. Served with Spanish rice and refried pinto beans.'),

        (cat_specials, 'Sizzling Fajitas', 'Fajitas al Comal Caliente',
         'Choice of seasoned Chicken, tender flank Steak, or wild Gulf Shrimp served on a piping hot skillet with grilled bell peppers, onions, Spanish rice, beans, and warm tortillas.',
         17.99, 'Popular', true, '/src/assets/images/sizzling_fajitas_skillet_1792550222395.jpg', 'Mild', 'Arrives smoking hot with lime wedges and house guacamole.'),

        (cat_specials, 'Homemade Tamales Plate', 'Platillo de Tamales Caseros',
         'Traditional pork or tender chicken tamales hand-wrapped in corn husks, steamed daily, topped with grandma’s famous green chile sauce and melted Jack cheese.',
         14.99, 'House Special', true, '/src/assets/images/la_pasadita_story_kitchen_1792550223270.jpg', 'Medium', 'Hand-ground masa steamed fresh every morning.'),

        (cat_specials, 'Smothered Green Chile Burrito', 'Burrito Ahogado en Chile Verde',
         'Warm flour tortilla packed with choice of savory meat, pinto beans, and rice, generously smothered edge-to-edge in legendary Denver green chile and melted cheese.',
         14.99, 'Grandma''s Favorite', true, '/src/assets/images/hero_chile_relleno_1792550221170.jpg', 'Fiery', 'Fork-and-knife classic. A local Denver staple.');

        -- Insert Tacos & Tortas
        INSERT INTO public.menu_items (category_id, name, spanish_name, description, price, badge, is_available, image_url, spice_level, grandma_note) VALUES
        (cat_tacos, 'Street Tacos', 'Tacos Callejeros al Pastor y Asada',
         'Double warm corn tortillas stuffed with Carne Asada, Al Pastor with pineapple, Pollo, Carnitas, or Chorizo. Topped with cilantro, diced onions, and fresh lime.',
         3.75, 'Popular', true, '/src/assets/images/street_tacos_platter_1792550349202.jpg', 'Medium', 'Served with grilled jalapeño and charred scallions.'),

        (cat_tacos, 'Mexican Torta', 'Torta Tradicional en Pan Bollito',
         'Toasted warm bollito roll layered with slow-simmered refried beans, choice of meat, crisp lettuce, ripe tomato, creamy avocado slices, and queso panela.',
         14.99, 'Popular', true, '/src/assets/images/street_tacos_platter_1792550349202.jpg', 'Mild', 'Crisped on the flat-top with butter until golden and flaky.'),

        (cat_tacos, 'Nachos La Pasadita', 'Nachos Especiales La Pasadita',
         'Mountain of fresh fried tortilla chips, blanketed in melted cheese, steak, house chorizo, refried beans, pickled jalapeños, sour cream, and guacamole.',
         17.99, 'Popular', true, '/src/assets/images/sizzling_fajitas_skillet_1792550222395.jpg', 'Medium', 'Ideal for 2 to 4 people to share.');

        -- Insert Caldos & Soups
        INSERT INTO public.menu_items (category_id, name, spanish_name, description, price, badge, is_available, image_url, spice_level, grandma_note) VALUES
        (cat_soups, 'Pozole Rojo', 'Pozole Tradicional de Puerco',
         'Traditional slow-simmered pork shoulder and white hominy soup in a rich red chili broth, garnished with fresh shredded cabbage, radishes, oregano, and crispy tostadas.',
         14.99, 'Grandma''s Favorite', true, '/src/assets/images/pozole_rojo_bowl_1792550223047.jpg', 'Warm Spice', 'Simmered overnight for 10 hours for maximum richness.'),

        (cat_soups, 'Menudo Casero', 'Menudo Tradicional con Pata',
         'Classic Mexican honeycomb beef tripe soup in an authentic spiced red chili broth. Simmered patiently with fresh herbs, served with limes and warm tortillas.',
         15.99, 'House Special', true, '/src/assets/images/pozole_rojo_bowl_1792550223047.jpg', 'Medium', 'Soul-nourishing comfort food.');

        -- Insert Drinks & Desserts
        INSERT INTO public.menu_items (category_id, name, spanish_name, description, price, badge, is_available, image_url, spice_level, grandma_note) VALUES
        (cat_drinks, 'House Margaritas', 'Margaritas Clásicas de Tequila',
         '100% blue agave tequila shaken with fresh lime juice, organic agave nectar, and orange liqueur. Available on the rocks with a salted rim or blended frozen.',
         9.00, 'Popular', true, '/src/assets/images/churros_and_flan_dessert_1792550348343.jpg', 'Refreshing', 'Made with fresh-squeezed limes.'),

        (cat_drinks, 'Horchata & Jamaica', 'Aguas Frescas Hechas a Mano',
         'Fresh house-made daily beverages. Creamy cinnamon-vanilla Horchata or refreshing tart Hibiscus Jamaica flower tea.',
         4.50, NULL, true, '/src/assets/images/churros_and_flan_dessert_1792550348343.jpg', 'Sweet', 'Steeped in small batches.'),

        (cat_drinks, 'Crispy Churros', 'Churros Crujientes con Chocolate',
         'Fried golden pastry dusted in cinnamon and raw cane sugar, served with warm spiced Mexican dark chocolate dipping sauce.',
         7.99, 'Popular', true, '/src/assets/images/churros_and_flan_dessert_1792550348343.jpg', 'Sweet', 'Fried fresh to order.'),

        (cat_drinks, 'House Flan', 'Flan Casero al Caramelo',
         'Silky smooth Mexican vanilla bean egg custard draped in bittersweet golden caramelized sugar glaze. Grandma’s 50-year-old family secret.',
         8.99, 'Grandma''s Favorite', true, '/src/assets/images/churros_and_flan_dessert_1792550348343.jpg', 'Sweet', 'Steamed in water bath with real vanilla bean.');
    END IF;
END $$;
