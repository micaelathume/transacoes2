import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable('transaction', function (table) {
        table.uuid('id').primary()
        table.uuid('session_id').index()
        table.string('title', 255).notNullable()
        table.decimal('amount', 10, 2).notNullable()
        table.datetime('created_at').defaultTo(knex.fn.now()).notNullable()
    })
}

export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTable('transaction')
}
