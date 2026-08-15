-- Update all Invoices to Pre-Order EXCEPT those belonging to a group named 'Sales Invoice'
UPDATE documents 
SET type = 'Pre-Order' 
WHERE type = 'Invoice' 
AND (
  group_id IS NULL 
  OR group_id NOT IN (
    SELECT id FROM invoice_groups WHERE name ILIKE '%Sales Invoice%'
  )
);
