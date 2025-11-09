import { Pool } from "pg";
import { env } from "../utils/env";

const pool = new Pool({ connectionString: env.DATABASE_URL });

export const repo = {
  async insertOrder(o: { id: string; type: string; base_mint: string; quote_mint: string; side: string; amount_in: number; }) {
    await pool.query(
      `INSERT INTO orders (id,type,base_mint,quote_mint,side,amount_in,status)
       VALUES ($1,$2,$3,$4,$5,$6,'pending')`,
      [o.id, o.type, o.base_mint, o.quote_mint, o.side, o.amount_in]
    );
  },
  async updateOrderStatus(id: string, status: string, error: string | null = null, tx_hash: string | null = null) {
    await pool.query(
      `UPDATE orders SET status=$2, error=$3, tx_hash=COALESCE($4, tx_hash), updated_at=now() WHERE id=$1`,
      [id, status, error, tx_hash]
    );
    await pool.query(
      `INSERT INTO order_events (order_id,status,detail) VALUES ($1,$2,$3)`,
      [id, status, null]
    );
  },
  async updateChosenDex(id: string, dex: string) {
    await pool.query(`UPDATE orders SET chosen_dex=$2, updated_at=now() WHERE id=$1`, [id, dex]);
    await pool.query(`INSERT INTO order_events (order_id,status,detail) VALUES ($1,$2,$3)`, [id, "routing", { chosen_dex: dex } as any]);
  },
  async getOrder(id: string) {
    const r = await pool.query(`SELECT * FROM orders WHERE id=$1`, [id]);
    return r.rows[0] || null;
  }
};
