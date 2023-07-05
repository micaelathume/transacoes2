import { expect, describe, it, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import { execSync } from 'child_process'

import { app } from '../src/app'

describe('Transactions - ', () => {
    beforeAll(async () => {
        await app.ready()
        execSync('npx knex migrate:latest')
    })

    afterAll(async () => {
        await app.close()
        execSync('npx knex migrate:rollback --all')
    })

    it('should create a new transaction', async () => {
        const response = await request(app.server).post('/transactions').send({
            title: 'Nice freela',
            type: 'credit',
            amount: 1200,
        })

        expect(response.statusCode).toEqual(201)
    })

    it('should be able to list all transactions', async () => {
        const createTransactionResponse = await request(app.server)
            .post('/transactions')
            .send({
                title: 'Nice freela',
                type: 'credit',
                amount: 1200,
            })

        const cookies = createTransactionResponse.get('Set-Cookie')

        const response = await request(app.server)
            .get('/transactions')
            .set('Cookie', cookies)

        expect(response.statusCode).toEqual(200)
        expect(response.body.transactions).toEqual([
            expect.objectContaining({
                title: 'Nice freela',
                amount: 1200,
            }),
        ])
    })

    it('should be able to get a transaction', async () => {
        const createTransactionResponse = await request(app.server)
            .post('/transactions')
            .send({
                title: 'Transaction description',
                type: 'debit',
                amount: 20,
            })

        const cookies = createTransactionResponse.get('Set-Cookie')

        const getTransactionsResponse = await request(app.server)
            .get('/transactions')
            .set('Cookie', cookies)

        const response = await request(app.server)
            .get(
                `/transactions/${getTransactionsResponse.body.transactions[0].id}`,
            )
            .set('Cookie', cookies)

        expect(response.statusCode).toEqual(200)
        expect(response.body.transaction).toEqual(
            expect.objectContaining({
                title: 'Transaction description',
                amount: -20,
            }),
        )
    })

    it('should be able to get account summary', async () => {
        let cookies: string[] = []
        let i = 0

        for (const amount of [10, 20, -5]) {
            i++

            if (i === 1) {
                const createTransactionResponse = await request(app.server)
                    .post('/transactions')
                    .send({
                        title: 'Description ' + i,
                        type: amount < 0 ? 'debit' : 'credit',
                        amount: amount < 0 ? amount * -1 : amount,
                    })

                cookies = createTransactionResponse.get('Set-Cookie')
                continue
            }

            await request(app.server)
                .post('/transactions')
                .send({
                    title: 'Description ' + i,
                    type: amount < 0 ? 'debit' : 'credit',
                    amount: amount < 0 ? amount * -1 : amount,
                })
                .set('Cookie', cookies)
        }

        const response = await request(app.server)
            .get('/transactions/summary')
            .set('Cookie', cookies)

        expect(response.statusCode).toEqual(200)
        expect(response.body.summary).toEqual(
            expect.objectContaining({
                amount: 25,
            }),
        )
    })
})
