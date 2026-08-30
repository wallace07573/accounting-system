-- 修复历史数据中的电话号码格式
-- 确保所有的 '60' 或 '65' 开头的号码都统一加上 '+' 前缀
-- 这样可以防止系统未来因为少了一个 '+' 而无法匹配到同一个顾客，导致重复创建

-- 1. 修复 customers 表的 contact_number
UPDATE customers 
SET contact_number = '+' || contact_number 
WHERE contact_number NOT LIKE '+%' 
  AND (contact_number LIKE '60%' OR contact_number LIKE '65%');

-- 2. 修复 customers 表的 attention
UPDATE customers 
SET attention = '+' || attention 
WHERE attention NOT LIKE '+%' 
  AND (attention LIKE '60%' OR attention LIKE '65%');

-- 3. 修复 auction_records 表的 phone_number
UPDATE auction_records 
SET phone_number = '+' || phone_number 
WHERE phone_number NOT LIKE '+%' 
  AND (phone_number LIKE '60%' OR phone_number LIKE '65%');
