const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');
const { signToken } = require('../utils/jwt');
const { COOKIE_NAME } = require('../middleware/auth');

const isProd = process.env.NODE_ENV === 'production';

function cookieOptions() {
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  };
}

function toPublicUser(user) {
  return { id: user.id, name: user.name, email: user.email };
}

async function signup(req, res) {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'name, email and password are required' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) {
    return res.status(409).json({ error: 'An account with that email already exists' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, email: email.toLowerCase(), passwordHash },
  });

  const token = signToken({ sub: user.id, email: user.email, name: user.name });
  res.cookie(COOKIE_NAME, token, cookieOptions());
  res.status(201).json({ user: toPublicUser(user), token });
}

async function signin(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = signToken({ sub: user.id, email: user.email, name: user.name });
  res.cookie(COOKIE_NAME, token, cookieOptions());
  res.json({ user: toPublicUser(user), token });
}

async function logout(req, res) {
  res.clearCookie(COOKIE_NAME, { ...cookieOptions(), maxAge: 0 });
  res.json({ message: 'Logged out' });
}

async function me(req, res) {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user: toPublicUser(user) });
}

module.exports = { signup, signin, logout, me };
