-- Add encryption fields to messages table
ALTER TABLE messages 
ADD COLUMN is_encrypted BOOLEAN DEFAULT FALSE,
ADD COLUMN encrypted_content TEXT,
ADD COLUMN encryption_key_id VARCHAR(255),
ADD COLUMN iv VARCHAR(255),
ADD COLUMN tag VARCHAR(255),
ADD COLUMN key_exchange_id VARCHAR(255);

-- Create key_exchanges table
CREATE TABLE key_exchanges (
    id VARCHAR(255) PRIMARY KEY,
    conversation_id VARCHAR(255) NOT NULL,
    from_user_id VARCHAR(255) NOT NULL,
    to_user_id VARCHAR(255) NOT NULL,
    encrypted_aes_key TEXT NOT NULL,
    key_id VARCHAR(255) NOT NULL,
    public_key TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP,
    
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (from_user_id) REFERENCES users(id),
    FOREIGN KEY (to_user_id) REFERENCES users(id)
);

-- Create indexes for better performance
CREATE INDEX idx_key_exchanges_conversation ON key_exchanges(conversation_id);
CREATE INDEX idx_key_exchanges_to_user ON key_exchanges(to_user_id);
CREATE INDEX idx_key_exchanges_status ON key_exchanges(status);
CREATE INDEX idx_messages_encrypted ON messages(is_encrypted);
CREATE INDEX idx_messages_key_id ON messages(encryption_key_id);
