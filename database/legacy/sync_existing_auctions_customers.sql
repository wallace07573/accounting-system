-- 第一步：自动找出还没在客户表里的 Auction 电话号码，并为他们创建全新的顾客档案
-- 使用 DISTINCT 和 GROUP BY 确保同一个电话号码就算有多笔 Auction 也只会创建一位顾客
INSERT INTO customers (tenant_id, name, attention, contact_number, balance)
SELECT 
  a.tenant_id, 
  MAX(a.name) as name, -- 如果同一个号码有不同的名字，取其中一个
  a.phone_number, 
  a.phone_number, 
  0
FROM auction_records a
WHERE a.customer_id IS NULL 
  AND a.phone_number IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM customers c 
    WHERE c.contact_number = a.phone_number 
      AND c.tenant_id = a.tenant_id
  )
GROUP BY a.tenant_id, a.phone_number;

-- 第二步：把所有还没绑定顾客的 Auction，通过电话号码，自动绑定到 CRM 里的顾客身上
-- 这一步不仅能绑定刚刚上面新建的顾客，也能顺便绑定以前就已经在 CRM 里但是没被关联上的顾客！
UPDATE auction_records a
SET customer_id = c.id
FROM customers c
WHERE a.customer_id IS NULL
  AND a.phone_number IS NOT NULL
  AND a.tenant_id = c.tenant_id
  AND a.phone_number = c.contact_number;
