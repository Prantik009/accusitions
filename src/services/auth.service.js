import logger from '#config/logger.js';
import { db } from '#config/database.js';
import { users } from '#models/user.model.js';

import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';

export const hashPassword = async password => {
  try {
    return await bcrypt.hash(password, 10);
  } catch (e) {
    logger.error(`Error hashing password: ${e}`);
    throw new Error('Error Hashing.');
  }
};

export const comparePassword = async (password, hashedPassword) => {
  try {
    return await bcrypt.compare(password, hashedPassword);
  } catch (e) {
    logger.error(`Error comparing password: ${e}`);
    throw new Error('Error comparing password.');
  }
};

export const authenticateUser = async ({ email, password: _password }) => {
  try {
    // Find user by email
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!existingUser) {
      throw new Error('User not found');
    }

    // Validate password
    const isPasswordValid = await comparePassword(
      _password,
      existingUser.password
    );

    if (!isPasswordValid) {
      throw new Error('Invalid password');
    }

    // Return user without password
    const userWithoutPassword = { ...existingUser };
    delete userWithoutPassword.password;
    logger.info(`User ${email} authenticated successfully`);
    return userWithoutPassword;
  } catch (e) {
    logger.error(`Error authenticating user: ${e}`);
    throw e;
  }
};

export const createUser = async ({ name, email, password, role = 'user' }) => {
  try {
    //check user already exists or not
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    if (existingUser.length > 0)
      throw new Error('User with this email already exists');

    //if its a new user
    //hash the password
    const password_hash = await hashPassword(password);

    //create a new user out of it.
    const [newUser] = await db
      .insert(users)
      .values({
        name,
        email,
        password: password_hash,
        role,
      })
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.created_at,
      });

    logger.info(`User ${newUser.email} created successfully`);
    return newUser;
  } catch (e) {
    logger.error(`Error creating user: ${e}`);
    throw e;
  }
};
