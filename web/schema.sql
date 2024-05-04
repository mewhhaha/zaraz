DROP TABLE IF EXISTS todos;
DROP TABLE IF EXISTS users;

CREATE TABLE IF NOT EXISTS users (
    id TEXT NOT NULL PRIMARY KEY,
    oauth_id TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    provider TEXT NOT NULL,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    UNIQUE (oauth_id, provider)
);

CREATE TABLE IF NOT EXISTS todos (
    id TEXT NOT NULL PRIMARY KEY,
    priority INTEGER NOT NULL,
    done BOOLEAN NOT NULL,
    done_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
