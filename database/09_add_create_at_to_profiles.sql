ALTER TABLE profiles 
ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

UPDATE profiles 
SET created_at = NOW() 
WHERE created_at IS NULL;