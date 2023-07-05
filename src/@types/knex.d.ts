// eslint-disable-next-line
import 'knex'

declare module 'knex/types/tables' {
    export interface Tables {
        transaction: {
            id: string
            title: string
            amount: number
            created_at: string
            session_id?: string
        }
    }
}
