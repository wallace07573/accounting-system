ALTER TABLE public.customers
ADD COLUMN is_verified BOOLEAN DEFAULT false,
ADD COLUMN bank_name TEXT,
ADD COLUMN bank_account_name TEXT,
ADD COLUMN bank_account_number TEXT;
