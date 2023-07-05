import { randomUUID } from 'node:crypto'
import { FastifyInstance } from 'fastify'
import { z } from 'zod'

import { knex } from '../database'
import { checkSessionIdExists } from '../middlewares/checkSessionIdExists'

export async function transactionsRoutes(app: FastifyInstance) {
    // another way of setting a middleware for the route context
    app.addHook('preHandler', async (req, res) => {
        if (req.method === 'GET') {
            checkSessionIdExists(req, res)
        }
    })

    app.get('/', async (req, res) => {
        const transactions = await knex('transaction').select().where({
            session_id: req.cookies.sessionId,
        })

        const response = {
            transactions,
        }

        return res.send(response)
    })

    app.get('/:id', async (req, res) => {
        const parseParamsTransaction = z.object({
            id: z.string().uuid(),
        })

        const { id } = parseParamsTransaction.parse(req.params)

        const transaction = await knex('transaction')
            .first()
            .where({ id, session_id: req.cookies.sessionId })

        if (!transaction) {
            return res.status(404).send({ error: 'Transaction not found' })
        }

        return res.send({ transaction })
    })

    app.get('/summary', async (req, res) => {
        const summary = await knex('transaction')
            .where({
                session_id: req.cookies.sessionId,
            })
            .sum('amount', { as: 'amount' })
            .first()

        return res.send({ summary })
    })

    app.post('/', async (req, res) => {
        const parseBodyTransaction = z.object({
            title: z.string(),
            amount: z.number(),
            type: z.enum(['credit', 'debit']),
        })

        const { title, amount, type } = parseBodyTransaction.parse(req.body)

        // hadle sessionId using cookie
        let sessionId = req.cookies.sessionId

        if (!sessionId) {
            sessionId = randomUUID()

            res.setCookie('sessionId', sessionId, {
                path: '/',
                maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
            })
        }

        await knex('transaction').insert({
            id: randomUUID(),
            title,
            amount: type === 'credit' ? amount : amount * -1,
            session_id: sessionId,
        })

        return res.status(201).send()
    })
}
