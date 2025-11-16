import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db from '../database';
import config from '../config';
import { User, CreateUserRequest, LoginResponse } from '../types';
import { AppError } from '../middleware/errorHandler';

class UserService {
  async createUser(data: CreateUserRequest): Promise<User> {
    const { username, email, password, firstName, lastName } = data;

    // Check if user already exists
    const existingUser = await db.query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (existingUser.rows.length > 0) {
      throw new AppError('Username or email already exists', 400);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, config.security.bcryptRounds);

    // Create user
    const result = await db.query(
      `INSERT INTO users (username, email, password_hash, first_name, last_name)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, username, email, first_name, last_name, is_active, created_at, updated_at`,
      [username, email, passwordHash, firstName || null, lastName || null]
    );

    const row = result.rows[0];

    return {
      id: row.id,
      username: row.username,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async login(username: string, password: string): Promise<LoginResponse> {
    // Get user with password hash
    const result = await db.query(
      'SELECT id, username, email, password_hash, first_name, last_name, is_active FROM users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      throw new AppError('Invalid credentials', 401);
    }

    const user = result.rows[0];

    if (!user.is_active) {
      throw new AppError('User account is inactive', 403);
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      throw new AppError('Invalid credentials', 401);
    }

    // Get user roles
    const rolesResult = await db.query(
      `SELECT r.name
       FROM user_roles ur
       JOIN roles r ON ur.role_id = r.id
       WHERE ur.user_id = $1 AND (ur.expires_at IS NULL OR ur.expires_at > NOW())`,
      [user.id]
    );

    const roles = rolesResult.rows.map((row) => row.name);

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        roles,
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    // Update last login
    await db.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        isActive: user.is_active,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      },
    };
  }

  async getUserById(id: string): Promise<User | null> {
    const result = await db.query(
      'SELECT id, username, email, first_name, last_name, is_active, created_at, updated_at, last_login FROM users WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];

    return {
      id: row.id,
      username: row.username,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      lastLogin: row.last_login,
    };
  }

  async assignRole(userId: string, roleId: string, grantedBy?: string): Promise<void> {
    await db.query(
      'INSERT INTO user_roles (user_id, role_id, scope, granted_by) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING',
      [userId, roleId, 'global', grantedBy || null]
    );
  }

  async getUserRoles(userId: string): Promise<string[]> {
    const result = await db.query(
      `SELECT r.name
       FROM user_roles ur
       JOIN roles r ON ur.role_id = r.id
       WHERE ur.user_id = $1 AND (ur.expires_at IS NULL OR ur.expires_at > NOW())`,
      [userId]
    );

    return result.rows.map((row) => row.name);
  }
}

export const userService = new UserService();
