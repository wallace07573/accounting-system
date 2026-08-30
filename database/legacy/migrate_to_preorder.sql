-- 1. Drop the old constraint
ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_type_check;

-- 2. Add the new constraint with 'Pre-Order' included
ALTER TABLE documents ADD CONSTRAINT documents_type_check 
CHECK (type IN ('Invoice', 'Quotation', 'Delivery Order', 'Pre-Order'));

-- 3. Update all Invoices to Pre-Order EXCEPT those belonging to a group named 'Sales Invoice'
UPDATE documents 
SET type = 'Pre-Order' 
WHERE type = 'Invoice' 
AND (
  group_id IS NULL 
  OR group_id NOT IN (
    SELECT id FROM invoice_groups WHERE name ILIKE '%Sales Invoice%'
  )
);
