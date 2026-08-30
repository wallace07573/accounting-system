-- 1. 自动为已付款的 Pre-Order 补齐交易记录 (customer_transactions)
-- 通过 NOT EXISTS 确保不会重复添加已经有记录的订单
INSERT INTO customer_transactions (tenant_id, customer_id, amount, remark, created_at)
SELECT 
  tenant_id, 
  customer_id, 
  amount_paid, 
  'Payment Received for Pre-Order ' || doc_no,
  created_at
FROM documents 
WHERE type = 'Pre-Order' 
  AND amount_paid > 0
  AND NOT EXISTS (
    SELECT 1 FROM customer_transactions ct 
    WHERE ct.remark = 'Payment Received for Pre-Order ' || documents.doc_no
  );

-- 2. 重新计算所有顾客的 CRM Balance 并更新到 customers 表
-- 这样可以确保手动添加的 balance 以及这次补齐的 balance 都完美同步
UPDATE customers c
SET balance = COALESCE(
  (
    SELECT SUM(amount) 
    FROM customer_transactions ct 
    WHERE ct.customer_id = c.id
  ), 
  0
);
