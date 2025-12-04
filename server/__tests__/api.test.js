import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import cors from 'cors';
import authRoutes from '../routes/auth.js';
import userRoutes from '../routes/users.js';
import taskRoutes from '../routes/tasks.js';
import { db } from '../database/init.js';

// Mock app setup for testing
const app = express();
app.use(cors());
app.use(express.json());

// Mock auth middleware
vi.mock('../middleware/auth.js', () => ({
    authenticateToken: (req, res, next) => {
        req.user = { id: 1, role: 'admin' };
        next();
    },
    canManageTasks: (req, res, next) => next(),
    requireRole: (roles) => (req, res, next) => next(),
    canAccessUser: (req, res, next) => next()
}));

// Apply routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);

describe('API Integration Tests', () => {

    describe('Auth Endpoints', () => {
        it('should register a new user', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'Test User',
                    email: `test${Date.now()}@example.com`,
                    password: 'password123'
                });

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('token');
        });

        it('should login an existing user', async () => {
            // First create a user
            const email = `login${Date.now()}@example.com`;
            await request(app).post('/api/auth/register').send({
                name: 'Login User',
                email,
                password: 'password123'
            });

            // Then try to login
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email,
                    password: 'password123'
                });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('token');
        });
    });

    describe('Task Endpoints', () => {
        it('should create a new task', async () => {
            const res = await request(app)
                .post('/api/tasks')
                .send({
                    title: 'Test Task',
                    description: 'Testing task creation',
                    category: 'Trabalho',
                    user_id: 1
                });

            expect(res.status).toBe(201);
            expect(res.body.task).toHaveProperty('id');
        });

        it('should get all tasks', async () => {
            const res = await request(app).get('/api/tasks');
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
        });
    });
});
