import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

const useLocalJSON = !process.env.DATABASE_URL;

// Path for fallback JSON database
const JSON_DB_PATH = path.join(__dirname, '../../database.json');

// Interface representing the structure of our JSON database fallback
interface JsonDbSchema {
  users: any[];
  refresh_tokens: any[];
  complaints: any[];
  complaint_flags: any[];
}

// Initialise JSON file if not exists
if (useLocalJSON && !fs.existsSync(JSON_DB_PATH)) {
  fs.writeFileSync(JSON_DB_PATH, JSON.stringify({ users: [], refresh_tokens: [], complaints: [], complaint_flags: [] }, null, 2));
}

let pool: Pool | null = null;

if (!useLocalJSON) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
  });
}

// Helper to interact with JSON DB
const readJsonDb = (): JsonDbSchema => {
  try {
    const data = fs.readFileSync(JSON_DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    return { users: [], refresh_tokens: [], complaints: [], complaint_flags: [] };
  }
};

const writeJsonDb = (data: JsonDbSchema) => {
  fs.writeFileSync(JSON_DB_PATH, JSON.stringify(data, null, 2));
};

export const db = {
  isPg: !useLocalJSON,

  readLocal(): JsonDbSchema {
    return readJsonDb();
  },

  writeLocal(data: JsonDbSchema) {
    writeJsonDb(data);
  },

  async query(text: string, params: any[] = []): Promise<{ rows: any[] }> {
    if (pool) {
      try {
        return await pool.query(text, params);
      } catch (err) {
        console.error('PostgreSQL query error, falling back to local storage if possible:', err);
        throw err;
      }
    } else {
      // Simulate simple SQL queries on our JSON database
      return this.simulateQuery(text, params);
    }
  },

  async init() {
    if (pool) {
      console.log('Connecting to PostgreSQL database...');
      // Create tables in PostgreSQL
      const createUsersTable = `
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          full_name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          phone VARCHAR(50) NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          city VARCHAR(100) NOT NULL,
          cnic VARCHAR(50),
          role VARCHAR(50) DEFAULT 'citizen',
          is_verified BOOLEAN DEFAULT FALSE,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `;

      const createTokensTable = `
        CREATE TABLE IF NOT EXISTS refresh_tokens (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          token VARCHAR(500) UNIQUE NOT NULL,
          expires_at TIMESTAMP NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          revoked BOOLEAN DEFAULT FALSE
        );
      `;

      const createComplaintsTable = `
        CREATE TABLE IF NOT EXISTS complaints (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          category VARCHAR(100) NOT NULL,
          severity INTEGER DEFAULT 5,
          status VARCHAR(50) DEFAULT 'reported',
          latitude DOUBLE PRECISION NOT NULL,
          longitude DOUBLE PRECISION NOT NULL,
          district VARCHAR(100),
          ward VARCHAR(100),
          street VARCHAR(255),
          image_url TEXT,
          blurhash TEXT,
          priority INTEGER DEFAULT 0,
          sla_deadline TIMESTAMP,
          flag_count INTEGER DEFAULT 0,
          admin_note TEXT,
          assigned_to VARCHAR(255),
          is_duplicate BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `;

      const createComplaintFlagsTable = `
        CREATE TABLE IF NOT EXISTS complaint_flags (
          id SERIAL PRIMARY KEY,
          complaint_id INTEGER REFERENCES complaints(id) ON DELETE CASCADE,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE (complaint_id, user_id)
        );
      `;

      try {
        await pool.query(createUsersTable);
        await pool.query(createTokensTable);
        await pool.query(createComplaintsTable);
        await pool.query(createComplaintFlagsTable);
        console.log('PostgreSQL tables initialized successfully.');
      } catch (err) {
        console.error('Error initializing PostgreSQL tables:', err);
        console.log('Falling back to local file database (database.json)...');
        pool = null; // Forces local fallback
      }
    } else {
      console.log('Using local file database (database.json) for hackathon prototype.');
    }
  },

  // A very basic SQL query simulator for local JSON file db (supporting select, insert, delete)
  async simulateQuery(text: string, params: any[]): Promise<{ rows: any[] }> {
    const data = readJsonDb();
    const queryLower = text.toLowerCase().trim();

    // 1. INSERT INTO users
    if (queryLower.startsWith('insert into users')) {
      const id = data.users.length + 1;
      const newUser = {
        id,
        full_name: params[0],
        email: params[1],
        phone: params[2],
        password_hash: params[3],
        city: params[4],
        cnic: params[5] || null,
        role: params[6] || 'citizen',
        is_verified: params[7] !== undefined ? params[7] : false,
        is_active: params[8] !== undefined ? params[8] : true,
        created_at: new Date(),
        updated_at: new Date()
      };
      data.users.push(newUser);
      writeJsonDb(data);
      return { rows: [newUser] };
    }

    // 2. INSERT INTO refresh_tokens
    if (queryLower.startsWith('insert into refresh_tokens')) {
      const id = data.refresh_tokens.length + 1;
      const newToken = {
        id,
        user_id: params[0],
        token: params[1],
        expires_at: params[2],
        created_at: new Date(),
        revoked: false
      };
      data.refresh_tokens.push(newToken);
      writeJsonDb(data);
      return { rows: [newToken] };
    }

    // 3. SELECT FROM users WHERE email
    if (queryLower.includes('select') && queryLower.includes('from users') && queryLower.includes('email =')) {
      const email = params[0];
      const user = data.users.find(u => u.email === email);
      return { rows: user ? [user] : [] };
    }

    // 4. SELECT FROM users WHERE id
    if (queryLower.includes('select') && queryLower.includes('from users') && queryLower.includes('id =')) {
      const id = Number(params[0]);
      const user = data.users.find(u => u.id === id);
      return { rows: user ? [user] : [] };
    }

    // 5. SELECT FROM refresh_tokens WHERE token =
    if (queryLower.includes('select') && queryLower.includes('from refresh_tokens') && queryLower.includes('token =')) {
      const token = params[0];
      const tokenRow = data.refresh_tokens.find(t => t.token === token && !t.revoked);
      return { rows: tokenRow ? [tokenRow] : [] };
    }

    // 6. UPDATE users (e.g. settings/profile/role)
    if (queryLower.startsWith('update users')) {
      // E.g. UPDATE users SET full_name = $1, phone = $2, city = $3, cnic = $4, updated_at = NOW() WHERE id = $5
      if (queryLower.includes('set full_name') && queryLower.includes('where id =')) {
        const id = Number(params[4]);
        const userIndex = data.users.findIndex(u => u.id === id);
        if (userIndex !== -1) {
          data.users[userIndex].full_name = params[0];
          data.users[userIndex].phone = params[1];
          data.users[userIndex].city = params[2];
          data.users[userIndex].cnic = params[3] || null;
          data.users[userIndex].updated_at = new Date();
          writeJsonDb(data);
          return { rows: [data.users[userIndex]] };
        }
      }
      // E.g. UPDATE users SET role = $1 WHERE id = $2
      if (queryLower.includes('set role =') && queryLower.includes('where id =')) {
        const role = params[0];
        const id = Number(params[1]);
        const userIndex = data.users.findIndex(u => u.id === id);
        if (userIndex !== -1) {
          data.users[userIndex].role = role;
          data.users[userIndex].updated_at = new Date();
          writeJsonDb(data);
          return { rows: [data.users[userIndex]] };
        }
      }
    }

    // 7. DELETE FROM users
    if (queryLower.startsWith('delete from users') && queryLower.includes('where id =')) {
      const id = Number(params[0]);
      const exists = data.users.some(u => u.id === id);
      data.users = data.users.filter(u => u.id !== id);
      data.refresh_tokens = data.refresh_tokens.filter(t => t.user_id !== id);
      writeJsonDb(data);
      return { rows: exists ? [{ id }] : [] };
    }

    // 8. UPDATE refresh_tokens SET revoked = true
    if (queryLower.includes('update refresh_tokens') && queryLower.includes('revoked = true')) {
      const token = params[0];
      data.refresh_tokens = data.refresh_tokens.map(t => {
        if (t.token === token) {
          return { ...t, revoked: true };
        }
        return t;
      });
      writeJsonDb(data);
      return { rows: [] };
    }

    // 9. SELECT ALL users
    if (queryLower.includes('select') && queryLower.includes('from users') && !queryLower.includes('where')) {
      return { rows: data.users };
    }

    return { rows: [] };
  }
};
