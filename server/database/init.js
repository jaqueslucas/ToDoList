import sqlite3 from 'sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'todolist.db');

// Create database connection
export const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database');
  }
});

// Initialize database tables
export const initDatabase = async () => {
  return new Promise((resolve, reject) => {
    db.serialize(async () => {
      // Create users table
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'reader',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create tasks table (updated to include user_id)
      db.run(`
        CREATE TABLE IF NOT EXISTS tasks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          description TEXT,
          completed BOOLEAN DEFAULT FALSE,
          user_id INTEGER NOT NULL,
          category TEXT DEFAULT 'Geral',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id)
        )
      `);

      // Create categories table
      db.run(`
        CREATE TABLE IF NOT EXISTS categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          user_id INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id)
        )
      `);

      // Create default admin user
      const hashedPassword = await bcrypt.hash('admin123', 10);
      db.run(`
        INSERT OR IGNORE INTO users (name, email, password, role)
        VALUES ('Administrador', 'admin@todolist.com', ?, 'admin')
      `, [hashedPassword], function(err) {
        if (err) {
          console.error('Error creating admin user:', err);
        } else {
          console.log('Admin user created/verified');
        }
      });

      // Create test users
      const testUsers = [
        { name: 'João Silva', email: 'joao@test.com', password: '123456', role: 'manager' },
        { name: 'Maria Santos', email: 'maria@test.com', password: '123456', role: 'reader' },
        { name: 'Pedro Costa', email: 'pedro@test.com', password: '123456', role: 'reader' },
        { name: 'Ana Oliveira', email: 'ana@test.com', password: '123456', role: 'manager' }
      ];

      for (const user of testUsers) {
        const hashedUserPassword = await bcrypt.hash(user.password, 10);
        db.run(`
          INSERT OR IGNORE INTO users (name, email, password, role)
          VALUES (?, ?, ?, ?)
        `, [user.name, user.email, hashedUserPassword, user.role], function(err) {
          if (err) {
            console.error('Error creating test user:', err);
          } else {
            console.log(`Test user ${user.name} created/verified`);
          }
        });
      }

      // Create default categories
      const defaultCategories = ['Trabalho', 'Pessoal', 'Estudos', 'Casa'];
      defaultCategories.forEach(category => {
        db.run(`
          INSERT OR IGNORE INTO categories (name, user_id)
          VALUES (?, NULL)
        `, [category]);
      });

      console.log('Database initialized successfully');
      resolve();
    });
  });
};
