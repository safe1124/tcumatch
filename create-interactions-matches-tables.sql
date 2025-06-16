-- Create interactions table for storing likes and passes
CREATE TABLE IF NOT EXISTS interactions (
    id BIGSERIAL PRIMARY KEY,
    from_user_id TEXT NOT NULL,
    to_user_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('like', 'pass')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(from_user_id, to_user_id) -- Prevent duplicate interactions between same users
);

-- Create matches table for storing successful matches
CREATE TABLE IF NOT EXISTS matches (
    id BIGSERIAL PRIMARY KEY,
    user1_id TEXT NOT NULL,
    user2_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user1_id, user2_id), -- Prevent duplicate matches
    CONSTRAINT different_users CHECK (user1_id != user2_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_interactions_from_user ON interactions(from_user_id);
CREATE INDEX IF NOT EXISTS idx_interactions_to_user ON interactions(to_user_id);
CREATE INDEX IF NOT EXISTS idx_interactions_type ON interactions(type);
CREATE INDEX IF NOT EXISTS idx_matches_user1 ON matches(user1_id);
CREATE INDEX IF NOT EXISTS idx_matches_user2 ON matches(user2_id);

-- Grant permissions (adjust as needed for your setup)
-- Note: You may need to run these in Supabase dashboard or adjust for your RLS policies
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- Example RLS policies (you can customize these)
CREATE POLICY "Users can insert their own interactions" ON interactions
    FOR INSERT WITH CHECK (auth.uid()::text = from_user_id);

CREATE POLICY "Users can view interactions involving them" ON interactions
    FOR SELECT USING (auth.uid()::text = from_user_id OR auth.uid()::text = to_user_id);

CREATE POLICY "Users can insert matches they're part of" ON matches
    FOR INSERT WITH CHECK (auth.uid()::text = user1_id OR auth.uid()::text = user2_id);

CREATE POLICY "Users can view their own matches" ON matches
    FOR SELECT USING (auth.uid()::text = user1_id OR auth.uid()::text = user2_id);
