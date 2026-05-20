-- Kandahar WMS Initial Seed Data

USE kandahar_wms_db;

-- Insert Roles
INSERT IGNORE INTO roles (id, name, label_ps, label_fa) VALUES
(1, 'super_admin', 'سوپر اډمین', 'سوپر ادمین'),
(2, 'admin', 'اډمین', 'ادمین'),
(3, 'warehouse_director', 'د ګدام مدیر', 'مدیر گدام'),
(4, 'warehouse_entry', 'معتمد', 'معتمد'),
(5, 'procurement_director', 'تدارکاتو مدیر', 'مدیر تدارکات'),
(6, 'requester', 'غوښتونکی', 'درخواست کننده'),
(7, 'request_confirmer', 'تاییدوونکی', 'تایید کننده');

-- Insert Basic Categories
INSERT IGNORE INTO categories (id, name_ps, name_fa, description) VALUES
(1, 'قرطاسیه', 'قرطاسیه', 'دفتري وسایل او قلمونه'),
(2, 'کمپیوټري وسایل', 'وسایل کامپیوتری', 'لپټاپ، پرنټر، ټونر'),
(3, 'فرنیچر', 'فرنیچر', 'میز، چوکۍ، المارۍ'),
(4, 'برقي وسایل', 'وسایل برقی', 'کیبل، سویچ، ګروپ');

-- Insert Basic Units
INSERT IGNORE INTO units (id, name_ps, name_fa, symbol) VALUES
(1, 'دانه', 'دانه', 'pcs'),
(2, 'ریمه', 'ریمه', 'ream'),
(3, 'متر', 'متر', 'm'),
(4, 'کیلوګرام', 'کیلوگرام', 'kg'),
(5, 'کارتن', 'کارتن', 'box');

-- Insert Default Warehouse
INSERT IGNORE INTO warehouses (id, name_ps, name_fa, location, description) VALUES
(1, 'مرکزي ګدام', 'گدام مرکزی', 'مرکزي ودانۍ', 'د کندهار پوهنتون عمومي ګدام');

-- Insert Faculties
INSERT IGNORE INTO faculties (id, name_ps, name_fa) VALUES
(1, 'کمپیوټر ساینس پوهنځی', 'پوهنځی کمپیوتر ساینس'),
(2, 'انجنیري پوهنځی', 'پوهنځی انجنیری');

-- Insert Departments
INSERT IGNORE INTO departments (id, faculty_id, name_ps, name_fa, department_type) VALUES
(1, NULL, 'ریاست', 'ریاست', 'ADMIN'),
(2, NULL, 'تدارکات', 'تدارکات', 'ADMIN'),
(3, 1, 'سافټویر انجینري', 'انجینری نرم افزار', 'FACULTY'),
(4, 2, 'سیول انجینري', 'سیول انجینری', 'FACULTY');

-- Insert People
INSERT IGNORE INTO people (id, department_id, full_name, position, phone, email) VALUES
(1, 3, 'احمد جاوید', 'استاد', '0700000001', 'ahmad@example.com'),
(2, 4, 'محمود خان', 'استاد', '0700000002', 'mahmood@example.com');

-- Insert Vendors
INSERT IGNORE INTO vendors (id, name, phone, email, address) VALUES
(1, 'کندهار ایټي شرکت', '0701111111', 'kandahar.it@example.com', 'کندهار ښار، شهیدانو چوک'),
(2, 'الکوزی قرطاسیه فروش', '0702222222', 'alokozay.stat@example.com', 'کندهار ښار، ارګ بازار'),
(3, 'احمدي فرنیچر', '0703333333', 'ahmadi.furniture@example.com', 'کندهار ښار، هرات دروازه');
