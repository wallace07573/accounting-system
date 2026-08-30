-- 彻底清理历史数据中的空格，以确保最佳的数据匹配效果
-- 新版本的系统已经会在存入数据库时自动过滤空格
-- 这个脚本可以帮你把以前带空格的旧号码（例如 '+60 12 345 6789'）一并清理成 '+60123456789'

UPDATE customers SET contact_number = REPLACE(contact_number, ' ', '');
UPDATE customers SET attention = REPLACE(attention, ' ', '');
UPDATE auction_records SET phone_number = REPLACE(phone_number, ' ', '');
