import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { createUser, findUserByEmail, findUserById, updateUserStreak } from '../models/userModel.js';

function generateToken(user) {
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, config.jwtSecret, {
    expiresIn: '7d',
  });
}

export async function register(req, res) {
  const { name, email, password } = req.body;

  if (!email.includes('@') || password.length < 6) {
    return res.status(400).json({ message: 'Use a valid email and password with at least 6 characters.' });
  }

  const existing = await findUserByEmail(email.toLowerCase());
  if (existing) {
    return res.status(409).json({ message: 'Email already in use.' });
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const user = await createUser({ name: name.trim(), email: email.toLowerCase(), passwordHash });
  const token = generateToken(user);

  return res.status(201).json({ user, token });
}

export async function login(req, res) {
  const { email, password } = req.body;

  const user = await findUserByEmail(email.toLowerCase());
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials.' });
  }

  const isMatch = bcrypt.compareSync(password, user.password_hash);
  if (!isMatch) {
    return res.status(401).json({ message: 'Invalid credentials.' });
  }

  await updateUserStreak(user.id);

  const safeUser = await findUserById(user.id);
  const token = generateToken(user);

  return res.json({ user: safeUser, token });
}

export async function me(req, res) {
  const user = await findUserById(req.user.id);
  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }

  return res.json({ user });
}
