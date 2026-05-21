-- ════════════════════════════════════════════════════════════════
-- Kandahar WMS — Full Demo Seed Data
-- Mirrors the localStore.ts mock data exactly
-- ════════════════════════════════════════════════════════════════

USE kandahar_wms_db;

SET FOREIGN_KEY_CHECKS = 0;

-- ════════════════════════════════════════════════════════════════
-- 1. ROLES
-- ════════════════════════════════════════════════════════════════
INSERT IGNORE INTO roles (id, name, label_ps, label_fa) VALUES
(1,  'Super Admin',              'سوپر ادمین',              'سوپر ادمین'),
(2,  'Admin',                    'ادمین',                    'ادمین'),
(3,  'Procurement Director',     'د تدارکاتو مدیر',          'مدیر تدارکات'),
(4,  'Warehouse Director',       'د ګدام مدیر',              'مدیر انبار'),
(5,  'Requester',                'غوښتنه کوونکی',            'درخواست‌دهنده'),
(6,  'Request Confirmer',        'د غوښتنې تاییدوونکی',     'تأییدکننده درخواست'),
(7,  'Warehouse Entry Person',   'د ګدام ثبت کوونکی',       'ثبت‌کننده انبار');

-- ════════════════════════════════════════════════════════════════
-- 2. CATEGORIES
-- ════════════════════════════════════════════════════════════════
INSERT IGNORE INTO categories (id, name_ps, name_fa, description) VALUES
(1, 'قرطاسیه',          'قرطاسیه',            'د دفتري کار لپاره قرطاسیه'),
(2, 'کمپیوټري وسایل',   'وسایل کامپیوتری',    'کمپیوټري او تخنیکي وسایل'),
(3, 'فرنیچر',           'مبل و اثاثیه',        'د دفتر او صنف فرنیچر'),
(4, 'شبکه',             'شبکه',                'د شبکې او انټرنیت وسایل'),
(5, 'برقي تجهیزات',     'تجهیزات برقی',        'برقي وسایل او تجهیزات'),
(6, 'تعلیمي وسایل',     'وسایل آموزشی',        'د تدریس او زده‌کړې وسایل'),
(7, 'نظافت',            'نظافت',               'د صفایۍ مواد');

-- ════════════════════════════════════════════════════════════════
-- 3. UNITS
-- ════════════════════════════════════════════════════════════════
INSERT IGNORE INTO units (id, name_ps, name_fa, symbol) VALUES
(1, 'ریمه',   'ریم',    'ریم'),
(2, 'دانه',   'عدد',    'عدد'),
(3, 'متر',    'متر',    'م'),
(4, 'پاکټ',   'بسته',   'بسته');

-- ════════════════════════════════════════════════════════════════
-- 4. WAREHOUSES
-- ════════════════════════════════════════════════════════════════
INSERT IGNORE INTO warehouses (id, name_ps, name_fa, location, description) VALUES
(1, 'د کندهار پوهنتون عمومي ګدام', 'انبار عمومی پوهنتون کندهار', 'کندهار، افغانستان', 'مرکزي ګدام');

-- ════════════════════════════════════════════════════════════════
-- 5. USERS
-- ════════════════════════════════════════════════════════════════
INSERT IGNORE INTO users (id, name, email, password_hash, role_id, status) VALUES
(1, 'Enayatullah Mansoor', 'superadmin@ku.edu.af', '$2b$10$demohashedpassword1', 1, 'active'),
(2, 'Fazalrahman Mayar',   'admin@ku.edu.af',       '$2b$10$demohashedpassword2', 2, 'active'),
(3, 'Abdulhadi Rahimi',    'procurement@ku.edu.af', '$2b$10$demohashedpassword3', 3, 'active'),
(4, 'Nazirahmad Bashare',  'warehouse@ku.edu.af',   '$2b$10$demohashedpassword4', 4, 'active'),
(5, 'Afghan Sahib',        'requester@ku.edu.af',   '$2b$10$demohashedpassword5', 5, 'active'),
(6, 'Doostyar Sahib',      'confirmer@ku.edu.af',   '$2b$10$demohashedpassword6', 6, 'active'),
(7, 'Mansoor Ahmad',       'entry@ku.edu.af',       '$2b$10$demohashedpassword7', 7, 'active');

-- ════════════════════════════════════════════════════════════════
-- 6. ITEMS (20 realistic warehouse items)
-- ════════════════════════════════════════════════════════════════
INSERT IGNORE INTO items (id, item_code, name_ps, name_fa, description, category_id, unit_id, warehouse_id, current_stock, minimum_stock, unit_price, supplier_source) VALUES
(1,  'KDR-001', 'A4 کاغذ',                    'کاغذ A4',                   'د دفترونو او صنفونو لپاره سپین A4 کاغذ',             1, 1, 1, 51,  15,  250,   'افغان دفتري لوازم شرکت'),
(2,  'KDR-002', 'قلم',                         'قلم',                       'د ورځني اداري کار لپاره بالپوینټ قلمونه',           1, 2, 1, 115, 30,  15,    'نجیب تجارتي شرکت'),
(3,  'KDR-003', 'پرنټر ټونر HP 12A',           'تونر پرنتر HP 12A',         'د اداري چاپ لپاره اصلي HP ټونر کارتریج',            2, 2, 1, 5,   4,   1800,  'د کندهار ټیکنالوژي شرکت'),
(4,  'KDR-004', 'چوکي',                        'چوکی',                      'د صنفونو او دفترونو لپاره فلزي چوکي',               3, 2, 1, 8,   6,   2200,  'کندهار فرنیچر شرکت'),
(5,  'KDR-005', 'شبکې کیبل Cat6',              'کابل شبکه Cat6',             'د شبکې لپاره Cat6 UTP کیبل',                        4, 3, 1, 186, 80,  25,    'د کندهار ټیکنالوژي شرکت'),
(6,  'KDR-006', 'کاپي',                        'کاپی',                      'د محصلینو او اداري کار لپاره کاپي',                 1, 2, 1, 55,  20,  40,    'نجیب تجارتي شرکت'),
(7,  'KDR-007', 'وایټ بورډ مارکر',             'ماژیک وایت‌بورد',           'د صنفونو لپاره وایټ بورډ مارکر',                   1, 2, 1, 12,  10,  45,    'افغان دفتري لوازم شرکت'),
(8,  'KDR-008', 'میز',                         'میز',                       'د دفترونو لپاره فلزي اداري میز',                   3, 2, 1, 6,   3,   3500,  'کندهار فرنیچر شرکت'),
(9,  'KDR-009', 'پرنټر HP LaserJet M1005',     'پرنتر HP LaserJet M1005',   'د اداري چاپ لپاره لیزر پرنټر',                     2, 2, 1, 4,   2,   8500,  'د کندهار ټیکنالوژي شرکت'),
(10, 'KDR-010', 'پروجیکتور',                   'پروجکتور',                  'د صنفونو لپاره XGA پروجیکتور',                     2, 2, 1, 5,   2,   15000, 'د پوهنتون تجهیزاتي شرکت'),
(11, 'KDR-011', 'ماوس',                        'ماوس',                      'د کمپیوټرونو لپاره USB ماوس',                      2, 2, 1, 22,  8,   250,   'د کندهار ټیکنالوژي شرکت'),
(12, 'KDR-012', 'کیبورډ',                      'کیبورد',                    'د کمپیوټرونو لپاره دوه ژبیز کیبورډ',               2, 2, 1, 18,  8,   400,   'د کندهار ټیکنالوژي شرکت'),
(13, 'KDR-013', 'فلش ډرایو 32GB',              'فلش درایو 32GB',            'د ډیټا لیږد لپاره USB فلش ډرایو',                  2, 2, 1, 6,   8,   350,   'د کندهار ټیکنالوژي شرکت'),
(14, 'KDR-014', 'اکسټینشن کارډ',              'کابل رابط برق',              'د دفترونو لپاره د برق اکسټینشن',                   5, 2, 1, 15,  6,   180,   'نجیب تجارتي شرکت'),
(15, 'KDR-015', 'سټیپلر',                      'منگنه',                     'د اسنادو د یوځای کولو لپاره سټیپلر',               1, 2, 1, 20,  6,   120,   'افغان دفتري لوازم شرکت'),
(16, 'KDR-016', 'قیچي',                        'قیچی',                      'د دفترونو لپاره اداري قیچي',                       1, 2, 1, 11,  5,   60,    'افغان دفتري لوازم شرکت'),
(17, 'KDR-017', 'فایل فولډر',                  'فایل فولدر',                'د اسنادو د ساتلو لپاره A4 فایل فولډر',             1, 2, 1, 78,  30,  25,    'افغان دفتري لوازم شرکت'),
(18, 'KDR-018', 'وایټ بورډ',                   'وایت‌بورد',                 'د صنفونو لپاره ممغناطیسي وایټ بورډ',               6, 2, 1, 4,   2,   3200,  'د پوهنتون تجهیزاتي شرکت'),
(19, 'KDR-019', 'حسابګر',                      'ماشین حساب',                'د مالي او حسابي کارونو لپاره حسابګر',               1, 2, 1, 9,   4,   450,   'افغان دفتري لوازم شرکت'),
(20, 'KDR-020', 'صفایی مواد',                  'مواد نظافتی',               'د دفترونو او صنفونو د صفایۍ لپاره مواد',           7, 4, 1, 28,  15,  80,    'نجیب تجارتي شرکت');

-- ════════════════════════════════════════════════════════════════
-- 7. STOCK TRANSACTIONS (12 months of IN/OUT per item)
-- ════════════════════════════════════════════════════════════════

-- Item 1: A4 Paper
INSERT IGNORE INTO stock_transactions (item_id, transaction_type, quantity, previous_stock, new_stock, source_type, notes, created_by, created_at) VALUES
(1,'IN', 30,20, 50,'PROCUREMENT','د نوي ترم لپاره د ابتداي موجودي ډیرول',7,DATE_SUB(NOW(),INTERVAL 11 MONTH)),
(1,'OUT',28,50, 22,'REQUEST',    'د غوښتنې له مخې تسلیمي',               4,DATE_SUB(NOW(),INTERVAL 11 MONTH)),
(1,'IN', 25,22, 47,'PROCUREMENT','د میاشتني تدارک له مخې د ګدام ډکول',   7,DATE_SUB(NOW(),INTERVAL 10 MONTH)),
(1,'OUT',22,47, 25,'REQUEST',    'د غوښتنې له مخې تسلیمي',               4,DATE_SUB(NOW(),INTERVAL 10 MONTH)),
(1,'IN', 35,25, 60,'PROCUREMENT','د میاشتني تدارک له مخې د ګدام ډکول',   7,DATE_SUB(NOW(),INTERVAL 9 MONTH)),
(1,'OUT',32,60, 28,'REQUEST',    'د غوښتنې له مخې تسلیمي',               4,DATE_SUB(NOW(),INTERVAL 9 MONTH)),
(1,'IN', 40,28, 68,'PROCUREMENT','د نوي ترم لپاره د ابتداي موجودي ډیرول', 7,DATE_SUB(NOW(),INTERVAL 8 MONTH)),
(1,'OUT',36,68, 32,'REQUEST',    'د غوښتنې له مخې تسلیمي',               4,DATE_SUB(NOW(),INTERVAL 8 MONTH)),
(1,'IN', 20,32, 52,'PROCUREMENT','د میاشتني تدارک له مخې د ګدام ډکول',   7,DATE_SUB(NOW(),INTERVAL 7 MONTH)),
(1,'OUT',18,52, 34,'REQUEST',    'د غوښتنې له مخې تسلیمي',               4,DATE_SUB(NOW(),INTERVAL 7 MONTH)),
(1,'IN', 30,34, 64,'PROCUREMENT','د میاشتني تدارک له مخې د ګدام ډکول',   7,DATE_SUB(NOW(),INTERVAL 6 MONTH)),
(1,'OUT',25,64, 39,'REQUEST',    'د غوښتنې له مخې تسلیمي',               4,DATE_SUB(NOW(),INTERVAL 6 MONTH)),
(1,'IN', 35,39, 74,'PROCUREMENT','د نوي ترم لپاره د ابتداي موجودي ډیرول', 7,DATE_SUB(NOW(),INTERVAL 5 MONTH)),
(1,'OUT',32,74, 42,'REQUEST',    'د غوښتنې له مخې تسلیمي',               4,DATE_SUB(NOW(),INTERVAL 5 MONTH)),
(1,'IN', 25,42, 67,'PROCUREMENT','د میاشتني تدارک له مخې د ګدام ډکول',   7,DATE_SUB(NOW(),INTERVAL 4 MONTH)),
(1,'OUT',23,67, 44,'REQUEST',    'د غوښتنې له مخې تسلیمي',               4,DATE_SUB(NOW(),INTERVAL 4 MONTH)),
(1,'IN', 20,44, 64,'PROCUREMENT','د میاشتني تدارک له مخې د ګدام ډکول',   7,DATE_SUB(NOW(),INTERVAL 3 MONTH)),
(1,'OUT',18,64, 46,'REQUEST',    'د غوښتنې له مخې تسلیمي',               4,DATE_SUB(NOW(),INTERVAL 3 MONTH)),
(1,'IN', 15,46, 61,'PROCUREMENT','د میاشتني تدارک له مخې د ګدام ډکول',   7,DATE_SUB(NOW(),INTERVAL 2 MONTH)),
(1,'OUT',14,61, 47,'REQUEST',    'د غوښتنې له مخې تسلیمي',               4,DATE_SUB(NOW(),INTERVAL 2 MONTH)),
(1,'IN', 20,47, 67,'PROCUREMENT','د میاشتني تدارک له مخې د ګدام ډکول',   7,DATE_SUB(NOW(),INTERVAL 1 MONTH)),
(1,'OUT',18,67, 49,'REQUEST',    'د غوښتنې له مخې تسلیمي',               4,DATE_SUB(NOW(),INTERVAL 1 MONTH)),
(1,'IN', 25,49, 74,'PROCUREMENT','د میاشتني تدارک له مخې د ګدام ډکول',   7,DATE_SUB(NOW(),INTERVAL 15 DAY)),
(1,'OUT',23,74, 51,'REQUEST',    'د غوښتنې له مخې تسلیمي',               4,DATE_SUB(NOW(),INTERVAL 5 DAY));

-- Item 2: Pens
INSERT IGNORE INTO stock_transactions (item_id, transaction_type, quantity, previous_stock, new_stock, source_type, notes, created_by, created_at) VALUES
(2,'IN', 60,50, 110,'PROCUREMENT','د نوي ترم لپاره د ابتداي موجودي ډیرول', 7,DATE_SUB(NOW(),INTERVAL 11 MONTH)),
(2,'OUT',55,110,55, 'REQUEST',    'د غوښتنې له مخې تسلیمي',               4,DATE_SUB(NOW(),INTERVAL 11 MONTH)),
(2,'IN', 40,55, 95, 'PROCUREMENT','د میاشتني تدارک له مخې د ګدام ډکول',   7,DATE_SUB(NOW(),INTERVAL 9 MONTH)),
(2,'OUT',35,95, 60, 'REQUEST',    'د غوښتنې له مخې تسلیمي',               4,DATE_SUB(NOW(),INTERVAL 9 MONTH)),
(2,'IN', 80,60, 140,'PROCUREMENT','د نوي ترم لپاره د ابتداي موجودي ډیرول', 7,DATE_SUB(NOW(),INTERVAL 7 MONTH)),
(2,'OUT',72,140,68, 'REQUEST',    'د غوښتنې له مخې تسلیمي',               4,DATE_SUB(NOW(),INTERVAL 7 MONTH)),
(2,'IN', 70,68, 138,'PROCUREMENT','د میاشتني تدارک له مخې د ګدام ډکول',   7,DATE_SUB(NOW(),INTERVAL 5 MONTH)),
(2,'OUT',64,138,74, 'REQUEST',    'د غوښتنې له مخې تسلیمي',               4,DATE_SUB(NOW(),INTERVAL 5 MONTH)),
(2,'IN', 50,74, 124,'PROCUREMENT','د میاشتني تدارک له مخې د ګدام ډکول',   7,DATE_SUB(NOW(),INTERVAL 3 MONTH)),
(2,'OUT',45,124,79, 'REQUEST',    'د غوښتنې له مخې تسلیمي',               4,DATE_SUB(NOW(),INTERVAL 3 MONTH)),
(2,'IN', 45,79, 124,'PROCUREMENT','د میاشتني تدارک له مخې د ګدام ډکول',   7,DATE_SUB(NOW(),INTERVAL 1 MONTH)),
(2,'OUT',40,124,84, 'REQUEST',    'د غوښتنې له مخې تسلیمي',               4,DATE_SUB(NOW(),INTERVAL 1 MONTH)),
(2,'IN', 35,84, 119,'PROCUREMENT','د میاشتني تدارک له مخې د ګدام ډکول',   7,DATE_SUB(NOW(),INTERVAL 10 DAY)),
(2,'OUT',4, 119,115,'REQUEST',    'د غوښتنې له مخې تسلیمي',               4,DATE_SUB(NOW(),INTERVAL 3 DAY));

-- Item 3: Toner
INSERT IGNORE INTO stock_transactions (item_id, transaction_type, quantity, previous_stock, new_stock, source_type, notes, created_by, created_at) VALUES
(3,'IN', 5,4,  9, 'PROCUREMENT','د نوي ترم لپاره د ابتداي موجودي ډیرول', 7,DATE_SUB(NOW(),INTERVAL 11 MONTH)),
(3,'OUT',4,9,  5, 'REQUEST',    'د غوښتنې له مخې تسلیمي',               4,DATE_SUB(NOW(),INTERVAL 11 MONTH)),
(3,'IN', 6,5,  11,'PROCUREMENT','د میاشتني تدارک له مخې د ګدام ډکول',   7,DATE_SUB(NOW(),INTERVAL 8 MONTH)),
(3,'OUT',5,11, 6, 'REQUEST',    'د غوښتنې له مخې تسلیمي',               4,DATE_SUB(NOW(),INTERVAL 8 MONTH)),
(3,'IN', 6,6,  12,'PROCUREMENT','د میاشتني تدارک له مخې د ګدام ډکول',   7,DATE_SUB(NOW(),INTERVAL 5 MONTH)),
(3,'OUT',5,12, 7, 'REQUEST',    'د غوښتنې له مخې تسلیمي',               4,DATE_SUB(NOW(),INTERVAL 5 MONTH)),
(3,'IN', 4,7,  11,'PROCUREMENT','د میاشتني تدارک له مخې د ګدام ډکول',   7,DATE_SUB(NOW(),INTERVAL 2 MONTH)),
(3,'OUT',3,11, 8, 'REQUEST',    'د غوښتنې له مخې تسلیمي',               4,DATE_SUB(NOW(),INTERVAL 2 MONTH)),
(3,'OUT',3,8,  5, 'REQUEST',    'د غوښتنې له مخې تسلیمي',               4,DATE_SUB(NOW(),INTERVAL 10 DAY));

-- Item 4: Chairs
INSERT IGNORE INTO stock_transactions (item_id, transaction_type, quantity, previous_stock, new_stock, source_type, notes, created_by, created_at) VALUES
(4,'IN', 12,4, 16,'PROCUREMENT','د نوو صنفونو لپاره د فرنیچر تدارک', 7,DATE_SUB(NOW(),INTERVAL 9 MONTH)),
(4,'OUT',12,16,4, 'REQUEST',    'د حقوقو پوهنځي ته تسلیمي',          4,DATE_SUB(NOW(),INTERVAL 9 MONTH)),
(4,'IN', 14,4, 18,'PROCUREMENT','د اقتصاد پوهنځي لپاره چوکۍ',        7,DATE_SUB(NOW(),INTERVAL 5 MONTH)),
(4,'OUT',4, 18,14,'REQUEST',    'د غوښتنې له مخې تسلیمي',            4,DATE_SUB(NOW(),INTERVAL 5 MONTH)),
(4,'OUT',2, 14,12,'REQUEST',    'د غوښتنې له مخې تسلیمي',            4,DATE_SUB(NOW(),INTERVAL 3 MONTH)),
(4,'OUT',4, 12,8, 'REQUEST',    'د غوښتنې له مخې تسلیمي',            4,DATE_SUB(NOW(),INTERVAL 1 MONTH));

-- Item 5: Network Cable
INSERT IGNORE INTO stock_transactions (item_id, transaction_type, quantity, previous_stock, new_stock, source_type, notes, created_by, created_at) VALUES
(5,'IN', 200,42, 242,'PROCUREMENT','د نوي تعلیمي ودانۍ لپاره د شبکې کیبل', 7,DATE_SUB(NOW(),INTERVAL 10 MONTH)),
(5,'OUT',25, 242,217,'REQUEST',    'د غوښتنې له مخې تسلیمي',               4,DATE_SUB(NOW(),INTERVAL 10 MONTH)),
(5,'OUT',30, 217,187,'REQUEST',    'د غوښتنې له مخې تسلیمي',               4,DATE_SUB(NOW(),INTERVAL 9 MONTH)),
(5,'IN', 150,187,337,'PROCUREMENT','د میاشتني تدارک له مخې د ګدام ډکول',   7,DATE_SUB(NOW(),INTERVAL 7 MONTH)),
(5,'OUT',28, 337,309,'REQUEST',    'د غوښتنې له مخې تسلیمي',               4,DATE_SUB(NOW(),INTERVAL 7 MONTH)),
(5,'OUT',22, 309,287,'REQUEST',    'د غوښتنې له مخې تسلیمي',               4,DATE_SUB(NOW(),INTERVAL 6 MONTH)),
(5,'OUT',18, 287,269,'REQUEST',    'د غوښتنې له مخې تسلیمي',               4,DATE_SUB(NOW(),INTERVAL 5 MONTH)),
(5,'IN', 80, 269,349,'PROCUREMENT','د میاشتني تدارک له مخې د ګدام ډکول',   7,DATE_SUB(NOW(),INTERVAL 3 MONTH)),
(5,'OUT',12, 349,337,'REQUEST',    'د غوښتنې له مخې تسلیمي',               4,DATE_SUB(NOW(),INTERVAL 3 MONTH)),
(5,'OUT',16, 337,321,'REQUEST',    'د غوښتنې له مخې تسلیمي',               4,DATE_SUB(NOW(),INTERVAL 2 MONTH)),
(5,'OUT',12, 321,309,'REQUEST',    'د غوښتنې له مخې تسلیمي',               4,DATE_SUB(NOW(),INTERVAL 1 MONTH)),
(5,'OUT',16, 309,293,'REQUEST',    'د غوښتنې له مخې تسلیمي',               4,DATE_SUB(NOW(),INTERVAL 15 DAY)),
(5,'OUT',107,293,186,'REQUEST',    'د غوښتنې له مخې تسلیمي',               4,DATE_SUB(NOW(),INTERVAL 5 DAY));

-- Item 6: Notebooks
INSERT IGNORE INTO stock_transactions (item_id, transaction_type, quantity, previous_stock, new_stock, source_type, notes, created_by, created_at) VALUES
(6,'IN', 30,20,50, 'PROCUREMENT','د نوي ترم لپاره د ابتداي موجودي ډیرول', 7,DATE_SUB(NOW(),INTERVAL 11 MONTH)),
(6,'OUT',25,50,25, 'REQUEST',    'د غوښتنې له مخې تسلیمي',               4,DATE_SUB(NOW(),INTERVAL 11 MONTH)),
(6,'IN', 50,25,75, 'PROCUREMENT','د نوي ترم لپاره د ابتداي موجودي ډیرول', 7,DATE_SUB(NOW(),INTERVAL 8 MONTH)),
(6,'OUT',44,75,31, 'REQUEST',    'د غوښتنې له مخې تسلیمي',               4,DATE_SUB(NOW(),INTERVAL 8 MONTH)),
(6,'IN', 45,31,76, 'PROCUREMENT','د نوي ترم لپاره د ابتداي موجودي ډیرول', 7,DATE_SUB(NOW(),INTERVAL 5 MONTH)),
(6,'OUT',40,76,36, 'REQUEST',    'د غوښتنې له مخې تسلیمي',               4,DATE_SUB(NOW(),INTERVAL 5 MONTH)),
(6,'IN', 25,36,61, 'PROCUREMENT','د میاشتني تدارک له مخې د ګدام ډکول',   7,DATE_SUB(NOW(),INTERVAL 2 MONTH)),
(6,'OUT',21,61,40, 'REQUEST',    'د غوښتنې له مخې تسلیمي',               4,DATE_SUB(NOW(),INTERVAL 2 MONTH)),
(6,'IN', 25,40,65, 'PROCUREMENT','د میاشتني تدارک له مخې د ګدام ډکول',   7,DATE_SUB(NOW(),INTERVAL 15 DAY)),
(6,'OUT',10,65,55, 'REQUEST',    'د غوښتنې له مخې تسلیمي',               4,DATE_SUB(NOW(),INTERVAL 5 DAY));

-- Item 7: Whiteboard Markers
INSERT IGNORE INTO stock_transactions (item_id, transaction_type, quantity, previous_stock, new_stock, source_type, notes, created_by, created_at) VALUES
(7,'IN', 15,8, 23,'PROCUREMENT','د نوي ترم لپاره د ابتداي موجودي ډیرول', 7,DATE_SUB(NOW(),INTERVAL 11 MONTH)),
(7,'OUT',14,23,9, 'REQUEST',    'د غوښتنې له مخې تسلیمي',               4,DATE_SUB(NOW(),INTERVAL 11 MONTH)),
(7,'IN', 20,9, 29,'PROCUREMENT','د نوي ترم لپاره د ابتداي موجودي ډیرول', 7,DATE_SUB(NOW(),INTERVAL 8 MONTH)),
(7,'OUT',19,29,10,'REQUEST',    'د غوښتنې له مخې تسلیمي',               4,DATE_SUB(NOW(),INTERVAL 8 MONTH)),
(7,'IN', 18,10,28,'PROCUREMENT','د نوي ترم لپاره د ابتداي موجودي ډیرول', 7,DATE_SUB(NOW(),INTERVAL 5 MONTH)),
(7,'OUT',17,28,11,'REQUEST',    'د غوښتنې له مخې تسلیمي',               4,DATE_SUB(NOW(),INTERVAL 5 MONTH)),
(7,'IN', 12,11,23,'PROCUREMENT','د میاشتني تدارک له مخې د ګدام ډکول',   7,DATE_SUB(NOW(),INTERVAL 2 MONTH)),
(7,'OUT',11,23,12,'REQUEST',    'د غوښتنې له مخې تسلیمي',               4,DATE_SUB(NOW(),INTERVAL 1 MONTH));

-- Item 8: Desks
INSERT IGNORE INTO stock_transactions (item_id, transaction_type, quantity, previous_stock, new_stock, source_type, notes, created_by, created_at) VALUES
(8,'IN', 4,0,4,'PROCUREMENT','د نوو صنفونو لپاره د فرنیچر تدارک', 7,DATE_SUB(NOW(),INTERVAL 9 MONTH)),
(8,'OUT',1,4,3,'REQUEST',    'د غوښتنې له مخې تسلیمي',           4,DATE_SUB(NOW(),INTERVAL 9 MONTH)),
(8,'IN', 5,3,8,'PROCUREMENT','د صنفونو لپاره اضافي میزونه',       7,DATE_SUB(NOW(),INTERVAL 6 MONTH)),
(8,'OUT',1,8,7,'REQUEST',    'د غوښتنې له مخې تسلیمي',           4,DATE_SUB(NOW(),INTERVAL 6 MONTH)),
(8,'OUT',1,7,6,'REQUEST',    'د غوښتنې له مخې تسلیمي',           4,DATE_SUB(NOW(),INTERVAL 3 MONTH));

-- Item 9: Printer
INSERT IGNORE INTO stock_transactions (item_id, transaction_type, quantity, previous_stock, new_stock, source_type, notes, created_by, created_at) VALUES
(9,'IN', 2,0,2,'PROCUREMENT','د لابراتوار پرنټر تدارک',   7,DATE_SUB(NOW(),INTERVAL 8 MONTH)),
(9,'IN', 3,2,5,'PROCUREMENT','د صنفونو لپاره پرنټر تدارک', 7,DATE_SUB(NOW(),INTERVAL 5 MONTH)),
(9,'OUT',1,5,4,'REQUEST',    'د غوښتنې له مخې تسلیمي',   4,DATE_SUB(NOW(),INTERVAL 4 MONTH));

-- Item 10: Projector
INSERT IGNORE INTO stock_transactions (item_id, transaction_type, quantity, previous_stock, new_stock, source_type, notes, created_by, created_at) VALUES
(10,'IN', 3,0,3,'PROCUREMENT','د لابراتوار پروجیکتور تدارک',   7,DATE_SUB(NOW(),INTERVAL 8 MONTH)),
(10,'IN', 3,3,6,'PROCUREMENT','د صنفونو لپاره پروجیکتور تدارک', 7,DATE_SUB(NOW(),INTERVAL 5 MONTH)),
(10,'OUT',1,6,5,'REQUEST',    'د غوښتنې له مخې تسلیمي',        4,DATE_SUB(NOW(),INTERVAL 4 MONTH));

-- Item 11: Mouse
INSERT IGNORE INTO stock_transactions (item_id, transaction_type, quantity, previous_stock, new_stock, source_type, notes, created_by, created_at) VALUES
(11,'IN', 8, 10,18,'PROCUREMENT','د نوي ترم لپاره د ابتداي موجودي ډیرول', 7,DATE_SUB(NOW(),INTERVAL 11 MONTH)),
(11,'OUT',6, 18,12,'REQUEST',    'د غوښتنې له مخې تسلیمي',               4,DATE_SUB(NOW(),INTERVAL 11 MONTH)),
(11,'IN', 12,12,24,'PROCUREMENT','د میاشتني تدارک له مخې د ګدام ډکول',   7,DATE_SUB(NOW(),INTERVAL 8 MONTH)),
(11,'OUT',10,24,14,'REQUEST',    'د غوښتنې له مخې تسلیمي',               4,DATE_SUB(NOW(),INTERVAL 8 MONTH)),
(11,'IN', 10,14,24,'PROCUREMENT','د میاشتني تدارک له مخې د ګدام ډکول',   7,DATE_SUB(NOW(),INTERVAL 5 MONTH)),
(11,'OUT',8, 24,16,'REQUEST',    'د غوښتنې له مخې تسلیمي',               4,DATE_SUB(NOW(),INTERVAL 5 MONTH)),
(11,'IN', 8, 16,24,'PROCUREMENT','د میاشتني تدارک له مخې د ګدام ډکول',   7,DATE_SUB(NOW(),INTERVAL 2 MONTH)),
(11,'OUT',6, 24,18,'REQUEST',    'د غوښتنې له مخې تسلیمي',               4,DATE_SUB(NOW(),INTERVAL 2 MONTH)),
(11,'OUT',4, 18,14,'REQUEST',    'د غوښتنې له مخې تسلیمي',               4,DATE_SUB(NOW(),INTERVAL 20 DAY)),
(11,'IN', 8, 14,22,'PROCUREMENT','د میاشتني تدارک له مخې د ګدام ډکول',   7,DATE_SUB(NOW(),INTERVAL 7 DAY));

-- Item 12: Keyboard
INSERT IGNORE INTO stock_transactions (item_id, transaction_type, quantity, previous_stock, new_stock, source_type, notes, created_by, created_at) VALUES
(12,'IN', 8, 6, 14,'PROCUREMENT','د نوي ترم لپاره د ابتداي موجودي ډیرول', 7,DATE_SUB(NOW(),INTERVAL 11 MONTH)),
(12,'OUT',6, 14,8, 'REQUEST',    'د غوښتنې له مخې تسلیمي',               4,DATE_SUB(NOW(),INTERVAL 11 MONTH)),
(12,'IN', 12,8, 20,'PROCUREMENT','د میاشتني تدارک له مخې د ګدام ډکول',   7,DATE_SUB(NOW(),INTERVAL 8 MONTH)),
(12,'OUT',10,20,10,'REQUEST',    'د غوښتنې له مخې تسلیمي',               4,DATE_SUB(NOW(),INTERVAL 8 MONTH)),
(12,'IN', 10,10,20,'PROCUREMENT','د میاشتني تدارک له مخې د ګدام ډکول',   7,DATE_SUB(NOW(),INTERVAL 5 MONTH)),
(12,'OUT',8, 20,12,'REQUEST',    'د غوښتنې له مخې تسلیمي',               4,DATE_SUB(NOW(),INTERVAL 5 MONTH)),
(12,'IN', 8, 12,20,'PROCUREMENT','د میاشتني تدارک له مخې د ګدام ډکول',   7,DATE_SUB(NOW(),INTERVAL 2 MONTH)),
(12,'OUT',6, 20,14,'REQUEST',    'د غوښتنې له مخې تسلیمي',               4,DATE_SUB(NOW(),INTERVAL 2 MONTH)),
(12,'OUT',3, 14,11,'REQUEST',    'د غوښتنې له مخې تسلیمي',               4,DATE_SUB(NOW(),INTERVAL 15 DAY)),
(12,'IN', 8, 11,19,'PROCUREMENT','د میاشتني تدارک له مخې د ګدام ډکول',   7,DATE_SUB(NOW(),INTERVAL 5 DAY)),
(12,'OUT',1, 19,18,'REQUEST',    'د غوښتنې له مخې تسلیمي',               4,DATE_SUB(NOW(),INTERVAL 2 DAY));

-- Item 13: Flash Drive (intentionally below min stock)
INSERT IGNORE INTO stock_transactions (item_id, transaction_type, quantity, previous_stock, new_stock, source_type, notes, created_by, created_at) VALUES
(13,'IN', 10,8, 18,'PROCUREMENT','د نوي ترم لپاره د ابتداي موجودي ډیرول', 7,DATE_SUB(NOW(),INTERVAL 11 MONTH)),
(13,'OUT',8, 18,10,'REQUEST',    'د غوښتنې له مخې تسلیمي',               4,DATE_SUB(NOW(),INTERVAL 11 MONTH)),
(13,'IN', 12,10,22,'PROCUREMENT','د میاشتني تدارک له مخې د ګدام ډکول',   7,DATE_SUB(NOW(),INTERVAL 8 MONTH)),
(13,'OUT',10,22,12,'REQUEST',    'د غوښتنې له مخې تسلیمي',               4,DATE_SUB(NOW(),INTERVAL 8 MONTH)),
(13,'IN', 12,12,24,'PROCUREMENT','د میاشتني تدارک له مخې د ګدام ډکول',   7,DATE_SUB(NOW(),INTERVAL 5 MONTH)),
(13,'OUT',11,24,13,'REQUEST',    'د غوښتنې له مخې تسلیمي',               4,DATE_SUB(NOW(),INTERVAL 5 MONTH)),
(13,'OUT',7, 13,6, 'REQUEST',    'د غوښتنې له مخې تسلیمي',               4,DATE_SUB(NOW(),INTERVAL 2 MONTH));

-- Item 14: Extension Cord
INSERT IGNORE INTO stock_transactions (item_id, transaction_type, quantity, previous_stock, new_stock, source_type, notes, created_by, created_at) VALUES
(14,'IN', 5, 6, 11,'PROCUREMENT','د نوي ترم لپاره د ابتداي موجودي ډیرول', 7,DATE_SUB(NOW(),INTERVAL 11 MONTH)),
(14,'OUT',4, 11,7, 'REQUEST',    'د غوښتنې له مخې تسلیمي',               4,DATE_SUB(NOW(),INTERVAL 11 MONTH)),
(14,'IN', 8, 7, 15,'PROCUREMENT','د میاشتني تدارک له مخې د ګدام ډکول',   7,DATE_SUB(NOW(),INTERVAL 8 MONTH)),
(14,'OUT',7, 15,8, 'REQUEST',    'د غوښتنې له مخې تسلیمي',               4,DATE_SUB(NOW(),INTERVAL 8 MONTH)),
(14,'IN', 6, 8, 14,'PROCUREMENT','د میاشتني تدارک له مخې د ګدام ډکول',   7,DATE_SUB(NOW(),INTERVAL 5 MONTH)),
(14,'OUT',5, 14,9, 'REQUEST',    'د غوښتنې له مخې تسلیمي',               4,DATE_SUB(NOW(),INTERVAL 5 MONTH)),
(14,'IN', 4, 9, 13,'PROCUREMENT','د میاشتني تدارک له مخې د ګدام ډکول',   7,DATE_SUB(NOW(),INTERVAL 2 MONTH)),
(14,'OUT',3, 13,10,'REQUEST',    'د غوښتنې له مخې تسلیمي',               4,DATE_SUB(NOW(),INTERVAL 2 MONTH)),
(14,'IN', 10,10,20,'PROCUREMENT','د میاشتني تدارک له مخې د ګدام ډکول',   7,DATE_SUB(NOW(),INTERVAL 7 DAY)),
(14,'OUT',5, 20,15,'REQUEST',    'د غوښتنې له مخې تسلیمي',               4,DATE_SUB(NOW(),INTERVAL 2 DAY));

-- Item 15: Stapler
INSERT IGNORE INTO stock_transactions (item_id, transaction_type, quantity, previous_stock, new_stock, source_type, notes, created_by, created_at) VALUES
(15,'IN', 5, 8, 13,'PROCUREMENT','د نوي ترم لپاره د ابتداي موجودي ډیرول', 7,DATE_SUB(NOW(),INTERVAL 11 MONTH)),
(15,'OUT',3, 13,10,'REQUEST',    'د غوښتنې له مخې تسلیمي',               4,DATE_SUB(NOW(),INTERVAL 11 MONTH)),
(15,'IN', 8, 10,18,'PROCUREMENT','د میاشتني تدارک له مخې د ګدام ډکول',   7,DATE_SUB(NOW(),INTERVAL 8 MONTH)),
(15,'OUT',6, 18,12,'REQUEST',    'د غوښتنې له مخې تسلیمي',               4,DATE_SUB(NOW(),INTERVAL 8 MONTH)),
(15,'IN', 6, 12,18,'PROCUREMENT','د میاشتني تدارک له مخې د ګدام ډکول',   7,DATE_SUB(NOW(),INTERVAL 5 MONTH)),
(15,'OUT',5, 18,13,'REQUEST',    'د غوښتنې له مخې تسلیمي',               4,DATE_SUB(NOW(),INTERVAL 5 MONTH)),
(15,'IN', 10,13,23,'PROCUREMENT','د میاشتني تدارک له مخې د ګدام ډکول',   7,DATE_SUB(NOW(),INTERVAL 2 MONTH)),
(15,'OUT',3, 23,20,'REQUEST',    'د غوښتنې له مخې تسلیمي',               4,DATE_SUB(NOW(),INTERVAL 10 DAY));

-- Item 16: Scissors
INSERT IGNORE INTO stock_transactions (item_id, transaction_type, quantity, previous_stock, new_stock, source_type, notes, created_by, created_at) VALUES
(16,'IN', 3,6, 9, 'PROCUREMENT','د نوي ترم لپاره د ابتداي موجودي ډیرول', 7,DATE_SUB(NOW(),INTERVAL 11 MONTH)),
(16,'OUT',2,9, 7, 'REQUEST',    'د غوښتنې له مخې تسلیمي',               4,DATE_SUB(NOW(),INTERVAL 11 MONTH)),
(16,'IN', 5,7, 12,'PROCUREMENT','د میاشتني تدارک له مخې د ګدام ډکول',   7,DATE_SUB(NOW(),INTERVAL 7 MONTH)),
(16,'OUT',4,12,8, 'REQUEST',    'د غوښتنې له مخې تسلیمي',               4,DATE_SUB(NOW(),INTERVAL 7 MONTH)),
(16,'IN', 4,8, 12,'PROCUREMENT','د میاشتني تدارک له مخې د ګدام ډکول',   7,DATE_SUB(NOW(),INTERVAL 4 MONTH)),
(16,'OUT',3,12,9, 'REQUEST',    'د غوښتنې له مخې تسلیمي',               4,DATE_SUB(NOW(),INTERVAL 4 MONTH)),
(16,'OUT',2,9, 7, 'REQUEST',    'د غوښتنې له مخې تسلیمي',               4,DATE_SUB(NOW(),INTERVAL 2 MONTH)),
(16,'IN', 6,7, 13,'PROCUREMENT','د میاشتني تدارک له مخې د ګدام ډکول',   7,DATE_SUB(NOW(),INTERVAL 10 DAY)),
(16,'OUT',2,13,11,'REQUEST',    'د غوښتنې له مخې تسلیمي',               4,DATE_SUB(NOW(),INTERVAL 3 DAY));

-- Item 17: File Folders
INSERT IGNORE INTO stock_transactions (item_id, transaction_type, quantity, previous_stock, new_stock, source_type, notes, created_by, created_at) VALUES
(17,'IN', 25,20,45, 'PROCUREMENT','د نوي ترم لپاره د ابتداي موجودي ډیرول', 7,DATE_SUB(NOW(),INTERVAL 11 MONTH)),
(17,'OUT',20,45,25, 'REQUEST',    'د غوښتنې له مخې تسلیمي',               4,DATE_SUB(NOW(),INTERVAL 11 MONTH)),
(17,'IN', 35,25,60, 'PROCUREMENT','د نوي ترم لپاره د ابتداي موجودي ډیرول', 7,DATE_SUB(NOW(),INTERVAL 8 MONTH)),
(17,'OUT',30,60,30, 'REQUEST',    'د غوښتنې له مخې تسلیمي',               4,DATE_SUB(NOW(),INTERVAL 8 MONTH)),
(17,'IN', 35,30,65, 'PROCUREMENT','د نوي ترم لپاره د ابتداي موجودي ډیرول', 7,DATE_SUB(NOW(),INTERVAL 5 MONTH)),
(17,'OUT',30,65,35, 'REQUEST',    'د غوښتنې له مخې تسلیمي',               4,DATE_SUB(NOW(),INTERVAL 5 MONTH)),
(17,'IN', 20,35,55, 'PROCUREMENT','د میاشتني تدارک له مخې د ګدام ډکول',   7,DATE_SUB(NOW(),INTERVAL 2 MONTH)),
(17,'OUT',17,55,38, 'REQUEST',    'د غوښتنې له مخې تسلیمي',               4,DATE_SUB(NOW(),INTERVAL 2 MONTH)),
(17,'IN', 40,38,78, 'PROCUREMENT','د میاشتني تدارک له مخې د ګدام ډکول',   7,DATE_SUB(NOW(),INTERVAL 10 DAY)),
(17,'OUT',10,78,68, 'REQUEST',    'د غوښتنې له مخې تسلیمي',               4,DATE_SUB(NOW(),INTERVAL 5 DAY)),
(17,'OUT',10,68,58, 'REQUEST',    'د غوښتنې له مخې تسلیمي',               4,DATE_SUB(NOW(),INTERVAL 2 DAY));

-- Item 18: Whiteboard
INSERT IGNORE INTO stock_transactions (item_id, transaction_type, quantity, previous_stock, new_stock, source_type, notes, created_by, created_at) VALUES
(18,'IN', 2,1,3,'PROCUREMENT','د لابراتوار صنفونو لپاره وایټ بورډونه',   7,DATE_SUB(NOW(),INTERVAL 9 MONTH)),
(18,'OUT',1,3,2,'REQUEST',    'د غوښتنې له مخې تسلیمي',                 4,DATE_SUB(NOW(),INTERVAL 9 MONTH)),
(18,'IN', 3,2,5,'PROCUREMENT','د صنفونو لپاره اضافي وایټ بورډونه',       7,DATE_SUB(NOW(),INTERVAL 6 MONTH)),
(18,'OUT',1,5,4,'REQUEST',    'د غوښتنې له مخې تسلیمي',                 4,DATE_SUB(NOW(),INTERVAL 4 MONTH));

-- Item 19: Calculator
INSERT IGNORE INTO stock_transactions (item_id, transaction_type, quantity, previous_stock, new_stock, source_type, notes, created_by, created_at) VALUES
(19,'IN', 5,3, 8, 'PROCUREMENT','د نوي ترم لپاره د ابتداي موجودي ډیرول', 7,DATE_SUB(NOW(),INTERVAL 11 MONTH)),
(19,'OUT',4,8, 4, 'REQUEST',    'د غوښتنې له مخې تسلیمي',               4,DATE_SUB(NOW(),INTERVAL 11 MONTH)),
(19,'IN', 8,4, 12,'PROCUREMENT','د نوي ترم لپاره د ابتداي موجودي ډیرول', 7,DATE_SUB(NOW(),INTERVAL 8 MONTH)),
(19,'OUT',7,12,5, 'REQUEST',    'د غوښتنې له مخې تسلیمي',               4,DATE_SUB(NOW(),INTERVAL 8 MONTH)),
(19,'IN', 7,5, 12,'PROCUREMENT','د میاشتني تدارک له مخې د ګدام ډکول',   7,DATE_SUB(NOW(),INTERVAL 5 MONTH)),
(19,'OUT',6,12,6, 'REQUEST',    'د غوښتنې له مخې تسلیمي',               4,DATE_SUB(NOW(),INTERVAL 5 MONTH)),
(19,'IN', 4,6, 10,'PROCUREMENT','د میاشتني تدارک له مخې د ګدام ډکول',   7,DATE_SUB(NOW(),INTERVAL 2 MONTH)),
(19,'OUT',3,10,7, 'REQUEST',    'د غوښتنې له مخې تسلیمي',               4,DATE_SUB(NOW(),INTERVAL 2 MONTH)),
(19,'IN', 4,7, 11,'PROCUREMENT','د میاشتني تدارک له مخې د ګدام ډکول',   7,DATE_SUB(NOW(),INTERVAL 15 DAY)),
(19,'OUT',2,11,9, 'REQUEST',    'د غوښتنې له مخې تسلیمي',               4,DATE_SUB(NOW(),INTERVAL 5 DAY));

-- Item 20: Cleaning Supplies
INSERT IGNORE INTO stock_transactions (item_id, transaction_type, quantity, previous_stock, new_stock, source_type, notes, created_by, created_at) VALUES
(20,'IN', 8, 10,18,'PROCUREMENT','د نوي ترم لپاره د ابتداي موجودي ډیرول', 7,DATE_SUB(NOW(),INTERVAL 11 MONTH)),
(20,'OUT',6, 18,12,'REQUEST',    'د غوښتنې له مخې تسلیمي',               4,DATE_SUB(NOW(),INTERVAL 11 MONTH)),
(20,'IN', 10,12,22,'PROCUREMENT','د میاشتني تدارک له مخې د ګدام ډکول',   7,DATE_SUB(NOW(),INTERVAL 8 MONTH)),
(20,'OUT',9, 22,13,'REQUEST',    'د غوښتنې له مخې تسلیمي',               4,DATE_SUB(NOW(),INTERVAL 8 MONTH)),
(20,'IN', 10,13,23,'PROCUREMENT','د نوي ترم لپاره د ابتداي موجودي ډیرول', 7,DATE_SUB(NOW(),INTERVAL 5 MONTH)),
(20,'OUT',9, 23,14,'REQUEST',    'د غوښتنې له مخې تسلیمي',               4,DATE_SUB(NOW(),INTERVAL 5 MONTH)),
(20,'IN', 8, 14,22,'PROCUREMENT','د میاشتني تدارک له مخې د ګدام ډکول',   7,DATE_SUB(NOW(),INTERVAL 2 MONTH)),
(20,'OUT',7, 22,15,'REQUEST',    'د غوښتنې له مخې تسلیمي',               4,DATE_SUB(NOW(),INTERVAL 2 MONTH)),
(20,'IN', 12,15,27,'PROCUREMENT','د میاشتني تدارک له مخې د ګدام ډکول',   7,DATE_SUB(NOW(),INTERVAL 7 DAY)),
(20,'OUT',7, 27,20,'REQUEST',    'د غوښتنې له مخې تسلیمي',               4,DATE_SUB(NOW(),INTERVAL 3 DAY)),
(20,'IN', 8, 20,28,'PROCUREMENT','د میاشتني تدارک له مخې د ګدام ډکول',   7,DATE_SUB(NOW(),INTERVAL 1 DAY));

-- ════════════════════════════════════════════════════════════════
-- 8. FACULTIES
-- ════════════════════════════════════════════════════════════════
INSERT IGNORE INTO faculties (id, name_ps, name_fa) VALUES
(1,  'د کمپیوټر ساینس پوهنځی',    'پوهنځی کامپیوتر ساینس'),
(2,  'د انجینري پوهنځی',           'پوهنځی انجینری'),
(3,  'د طب پوهنځی',                'پوهنځی طب'),
(4,  'د اقتصاد پوهنځی',            'پوهنځی اقتصاد'),
(5,  'د حقوقو پوهنځی',             'پوهنځی حقوق'),
(6,  'د زراعت پوهنځی',             'پوهنځی زراعت'),
(7,  'د اسلامي علومو پوهنځی',      'پوهنځی علوم اسلامی'),
(8,  'د اجتماعي علومو پوهنځی',     'پوهنځی علوم اجتماعی'),
(9,  'د ژورنالیزم پوهنځی',         'پوهنځی ژورنالیزم'),
(10, 'مرکزي اداره',                 'اداره مرکزی');

-- ════════════════════════════════════════════════════════════════
-- 9. DEPARTMENTS
-- ════════════════════════════════════════════════════════════════
INSERT IGNORE INTO departments (id, faculty_id, name_ps, name_fa, department_type) VALUES
(1,  1,  'د معلوماتي سیستمونو څانګه', 'بخش سیستم‌های اطلاعاتی',    'FACULTY'),
(2,  1,  'د نرم افزار لابراتوار',      'لابراتوار نرم‌افزار',         'FACULTY'),
(3,  2,  'د شبکې او IT لابراتوار',     'لابراتوار شبکه و IT',         'FACULTY'),
(4,  2,  'د کمپیوټر لابراتوار',        'لابراتوار کامپیوتر',          'FACULTY'),
(5,  2,  'د IT مدیریت',               'مدیریت IT',                   'FACULTY'),
(6,  2,  'د تعمیراتو شعبه',            'بخش تعمیرات',                 'FACULTY'),
(7,  3,  'کتابتون',                    'کتابخانه',                    'FACULTY'),
(8,  3,  'اداري دفتر',                 'دفتر اداری',                  'FACULTY'),
(9,  3,  'د رادیولوژۍ شعبه',           'بخش رادیولوژی',               'FACULTY'),
(10, 4,  'د مالي چارو شعبه',           'بخش امور مالی',               'FACULTY'),
(11, 4,  'اداري مدیریت',               'مدیریت اداری',                'FACULTY'),
(12, 5,  'اداري مدیریت',               'مدیریت اداری',                'FACULTY'),
(13, 5,  'اداري دفتر',                 'دفتر اداری',                  'FACULTY'),
(14, 6,  'د لابراتوار شعبه',           'بخش لابراتوار',               'FACULTY'),
(15, 6,  'د صنف مدیریت',              'مدیریت صنف',                  'FACULTY'),
(16, 7,  'د لومړي کال محصلین',         'دانشجویان سال اول',           'FACULTY'),
(17, 8,  'د احصایې شعبه',             'بخش آمار',                    'FACULTY'),
(18, 9,  'د رسنیو لابراتوار',          'لابراتوار رسانه',             'FACULTY'),
(19, 10, 'د ودانیو او خدماتو شعبه',    'بخش ابنیه و خدمات',           'ADMIN');

-- ════════════════════════════════════════════════════════════════
-- 10. PEOPLE
-- ════════════════════════════════════════════════════════════════
INSERT IGNORE INTO people (id, department_id, full_name, position, phone, email) VALUES
(1,  1,  'ډاکټر احمدشاه رحیمي',   'د پوهنځي رئیس',      '0700201001', 'cs.dean@ku.edu.af'),
(2,  2,  'انجینر محمد ظاهر',        'د لابراتوار مسئول',  '0700201002', 'lab.it@ku.edu.af'),
(3,  3,  'انجینر لطیف الله نوري',  'د شبکې مسئول',       '0700201003', 'network@ku.edu.af'),
(4,  7,  'ذبیح الله مجاهد',         'کتابوال',             '0700201004', 'library@ku.edu.af'),
(5,  10, 'نورالله تمیم',            'د مالي چارو مدیر',   '0700201005', 'finance@ku.edu.af'),
(6,  12, 'حبیب الله رحمان',         'اداري مدیر',          '0700201006', 'law.admin@ku.edu.af'),
(7,  14, 'بسم الله اخلاصي',         'د لابراتوار مسئول',  '0700201007', 'agri.lab@ku.edu.af'),
(8,  16, 'ملا عبدالمنان',            'د پوهنځي مسئول',     '0700201008', 'islamic@ku.edu.af'),
(9,  17, 'شیرمحمد ناصري',           'د احصایې مسئول',     '0700201009', 'stats@ku.edu.af'),
(10, 19, 'عبدالطیف مصطفی',          'د ودانیو مسئول',     '0700201010', 'facilities@ku.edu.af');

-- ════════════════════════════════════════════════════════════════
-- 11. REQUESTS (20 realistic requests)
-- ════════════════════════════════════════════════════════════════
INSERT IGNORE INTO requests (id, tracking_id, requester_id, faculty_id, department_id, person_id, request_level, status, progress_percent, notes, created_at, updated_at) VALUES
(1,  'REQ-Y1-001', 5, 1,  1,  1,    'URGENT', 'DELIVERED',           100, 'د نوي ترم لپاره د لابراتوار قرطاسیه او ټونر ته اړتیا ده.',    DATE_SUB(NOW(),INTERVAL 11 MONTH), DATE_SUB(NOW(),INTERVAL 11 MONTH)),
(2,  'REQ-Y1-002', 5, 2,  3,  3,    'URGENT', 'DELIVERED',           100, 'د نوي تعلیمي ودانۍ لپاره د شبکې کیبل ته اړتیا ده.',           DATE_SUB(NOW(),INTERVAL 11 MONTH), DATE_SUB(NOW(),INTERVAL 10 MONTH)),
(3,  'REQ-Y1-003', 5, 3,  7,  4,    'NORMAL', 'DELIVERED',           100, 'د محصلینو لپاره کاپۍ او د صنف وایټ بورډ مارکرونه.',           DATE_SUB(NOW(),INTERVAL 10 MONTH), DATE_SUB(NOW(),INTERVAL 10 MONTH)),
(4,  'REQ-Y1-004', 5, 4,  10, 5,    'NORMAL', 'DELIVERED',           100, 'د مالي چارو لپاره حسابګر او فایل فولډرونه.',                  DATE_SUB(NOW(),INTERVAL 10 MONTH), DATE_SUB(NOW(),INTERVAL 10 MONTH)),
(5,  'REQ-Y1-005', 5, 5,  12, 6,    'URGENT', 'DELIVERED',           100, 'د نوو صنفونو لپاره فلزي چوکیو ته اړتیا ده.',                  DATE_SUB(NOW(),INTERVAL 9 MONTH),  DATE_SUB(NOW(),INTERVAL 9 MONTH)),
(6,  'REQ-Y1-006', 5, 6,  14, 7,    'NORMAL', 'DELIVERED',           100, 'د لابراتوار صنفونو لپاره وایټ بورډونه.',                      DATE_SUB(NOW(),INTERVAL 9 MONTH),  DATE_SUB(NOW(),INTERVAL 9 MONTH)),
(7,  'REQ-Y1-007', 5, 7,  16, 8,    'URGENT', 'DELIVERED',           100, 'د نوي اکاډمیک کال لپاره قرطاسیه - کاغذ، قلم، مارکر.',        DATE_SUB(NOW(),INTERVAL 8 MONTH),  DATE_SUB(NOW(),INTERVAL 8 MONTH)),
(8,  'REQ-Y1-008', 5, 1,  2,  2,    'URGENT', 'DELIVERED',           100, 'د لابراتوار صنفونو لپاره پروجیکتور ته اړتیا ده.',             DATE_SUB(NOW(),INTERVAL 8 MONTH),  DATE_SUB(NOW(),INTERVAL 7 MONTH)),
(9,  'REQ-Y1-009', 5, 2,  4,  NULL, 'URGENT', 'DELIVERED',           100, 'د لابراتوار کمپیوټرونو لپاره ماوس او کیبورډ.',                DATE_SUB(NOW(),INTERVAL 7 MONTH),  DATE_SUB(NOW(),INTERVAL 7 MONTH)),
(10, 'REQ-Y1-010', 5, 3,  8,  NULL, 'NORMAL', 'DELIVERED',           100, 'د اسنادو لپاره فایل فولډر او سټیپلرونه.',                     DATE_SUB(NOW(),INTERVAL 7 MONTH),  DATE_SUB(NOW(),INTERVAL 7 MONTH)),
(11, 'REQ-Y1-011', 5, 8,  17, 9,    'NORMAL', 'DELIVERED',           100, 'د احصایوي او مالي کارونو لپاره حسابګرونه.',                   DATE_SUB(NOW(),INTERVAL 6 MONTH),  DATE_SUB(NOW(),INTERVAL 6 MONTH)),
(12, 'REQ-Y1-012', 5, 4,  11, NULL, 'NORMAL', 'READY_FOR_DELIVERY',   75, 'د اوسني کال لپاره د دفتر چوکیو ته اړتیا ده.',                 DATE_SUB(NOW(),INTERVAL 6 MONTH),  DATE_SUB(NOW(),INTERVAL 5 MONTH)),
(13, 'REQ-Y1-013', 5, 9,  18, NULL, 'NORMAL', 'DELIVERED',           100, 'د خپرولو لپاره کاغذ او کاپۍ.',                               DATE_SUB(NOW(),INTERVAL 5 MONTH),  DATE_SUB(NOW(),INTERVAL 5 MONTH)),
(14, 'REQ-Y1-014', 5, 2,  5,  NULL, 'NORMAL', 'DELIVERED',           100, 'د فایلونو د لیږد لپاره فلش ډرایو او اضافي ماوس.',             DATE_SUB(NOW(),INTERVAL 5 MONTH),  DATE_SUB(NOW(),INTERVAL 5 MONTH)),
(15, 'REQ-Y1-015', 5, 5,  13, NULL, 'NORMAL', 'DELIVERED',           100, 'د دفتر اکسټینشن کارډونه او نوي کیبورډونه.',                   DATE_SUB(NOW(),INTERVAL 4 MONTH),  DATE_SUB(NOW(),INTERVAL 4 MONTH)),
(16, 'REQ-Y1-016', 5, 1,  1,  NULL, 'URGENT', 'CONFIRMED',            20, 'د پاتې نیمه کال لپاره ټونر او کاغذ.',                        DATE_SUB(NOW(),INTERVAL 3 MONTH),  DATE_SUB(NOW(),INTERVAL 3 MONTH)),
(17, 'REQ-Y1-017', 5, 10, 19, 10,   'NORMAL', 'SENT_TO_PROCUREMENT',  25, 'د پوهنتون ودانیو د صفایۍ لپاره مواد ته اړتیا ده.',           DATE_SUB(NOW(),INTERVAL 3 MONTH),  DATE_SUB(NOW(),INTERVAL 2 MONTH)),
(18, 'REQ-Y1-018', 5, 6,  15, NULL, 'NORMAL', 'SENT_TO_PROCUREMENT',  40, 'د نوو صنفونو لپاره وایټ بورډ مارکرونه.',                      DATE_SUB(NOW(),INTERVAL 2 MONTH),  DATE_SUB(NOW(),INTERVAL 1 MONTH)),
(19, 'REQ-Y1-019', 5, 3,  9,  NULL, 'URGENT', 'CONFIRMED',            10, 'د پرنټ لابراتوار لپاره نوي لیزر پرنټر ته اړتیا ده.',         DATE_SUB(NOW(),INTERVAL 1 MONTH),  DATE_SUB(NOW(),INTERVAL 1 MONTH)),
(20, 'REQ-Y1-020', 5, 2,  6,  NULL, 'URGENT', 'PENDING',               0, 'د نوي سیمسټر لپاره د صنف چوکیو ته اړتیا ده.',                DATE_SUB(NOW(),INTERVAL 14 DAY),   DATE_SUB(NOW(),INTERVAL 14 DAY));

-- ════════════════════════════════════════════════════════════════
-- 12. REQUEST ITEMS
-- ════════════════════════════════════════════════════════════════
INSERT IGNORE INTO request_items (request_id, item_id, item_name, quantity, unit_id) VALUES
(1,  1,  'A4 کاغذ',                    5,   1),
(1,  3,  'پرنټر ټونر HP 12A',          2,   2),
(2,  5,  'شبکې کیبل Cat6',            200,  3),
(3,  6,  'کاپي',                       20,  2),
(3,  7,  'وایټ بورډ مارکر',            8,   2),
(4,  19, 'حسابګر',                      5,   2),
(4,  17, 'فایل فولډر',                 20,  2),
(5,  4,  'چوکي',                       12,  2),
(6,  18, 'وایټ بورډ',                   2,   2),
(7,  1,  'A4 کاغذ',                    10,  1),
(7,  2,  'قلم',                        50,  2),
(7,  7,  'وایټ بورډ مارکر',            12,  2),
(8,  10, 'پروجیکتور',                   2,   2),
(9,  11, 'ماوس',                        10,  2),
(9,  12, 'کیبورډ',                      10,  2),
(10, 17, 'فایل فولډر',                  30,  2),
(10, 15, 'سټیپلر',                       5,  2),
(11, 19, 'حسابګر',                       8,  2),
(12, 4,  'چوکي',                        14,  2),
(13, 1,  'A4 کاغذ',                     6,   1),
(13, 6,  'کاپي',                        15,  2),
(14, 13, 'فلش ډرایو 32GB',              8,   2),
(14, 11, 'ماوس',                         5,  2),
(15, 14, 'اکسټینشن کارډ',               6,   2),
(15, 12, 'کیبورډ',                       4,   2),
(16, 3,  'پرنټر ټونر HP 12A',           4,   2),
(16, 1,  'A4 کاغذ',                     8,   1),
(17, 20, 'صفایی مواد',                  30,  4),
(18, 7,  'وایټ بورډ مارکر',            20,   2),
(19, 9,  'پرنټر HP LaserJet M1005',     1,   2),
(20, 4,  'چوکي',                        10,  2);

-- ════════════════════════════════════════════════════════════════
-- 13. VENDORS
-- ════════════════════════════════════════════════════════════════
INSERT IGNORE INTO vendors (id, name, phone, email, address) VALUES
(1, 'افغان دفتري لوازم شرکت',   '0700300001', 'afghan.office@gmail.com',  'کندهار، شهر نو'),
(2, 'نجیب تجارتي شرکت',         '0700300002', 'najib.trading@gmail.com',  'کندهار، بازار'),
(3, 'د کندهار ټیکنالوژي شرکت', '0700300003', 'kdh.tech@gmail.com',       'کندهار، چهار راهی ایوب'),
(4, 'کندهار فرنیچر شرکت',       '0700300004', 'kdh.furniture@gmail.com',  'کندهار، اسپین بولدک شاهراه'),
(5, 'د پوهنتون تجهیزاتي شرکت', '0700300005', 'uni.equipment@gmail.com',  'کندهار، میرویس میدان');

-- ════════════════════════════════════════════════════════════════
-- 14. PROCUREMENT CASES
-- ════════════════════════════════════════════════════════════════
INSERT IGNORE INTO procurement_cases (id, request_id, status, reason) VALUES
(1, 17, 'OPEN', 'د صفایۍ موادو لپاره د آفر غوښتنه. درجه: عادي.'),
(2, 18, 'OPEN', 'د وایټ بورډ مارکر لپاره د آفر غوښتنه. برنده ټاکل شوی.');

-- ════════════════════════════════════════════════════════════════
-- 15. VENDOR OFFERS
-- ════════════════════════════════════════════════════════════════
INSERT IGNORE INTO vendor_offers (procurement_case_id, vendor_id, total_price, currency, is_winner) VALUES
(1, 1, 2200.00, 'AFN', FALSE),
(1, 2, 2400.00, 'AFN', FALSE),
(1, 4, 2000.00, 'AFN', TRUE),
(2, 1,  850.00, 'AFN', FALSE),
(2, 2,  900.00, 'AFN', FALSE),
(2, 3,  820.00, 'AFN', TRUE);

SET FOREIGN_KEY_CHECKS = 1;
