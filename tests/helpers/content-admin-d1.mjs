import { DatabaseSync } from 'node:sqlite';import fs from'node:fs';
export function testD1(filename=':memory:'){
 const sql=new DatabaseSync(filename);sql.exec(fs.readFileSync(new URL('../../db/content-admin.sql',import.meta.url),'utf8'));
 const wrap=(query,values=[])=>({bind(...v){return wrap(query,v)},async first(){return sql.prepare(query).get(...values)||null},async all(){return {results:sql.prepare(query).all(...values)}},async run(){return this._run()},_run(){const r=sql.prepare(query).run(...values);return {success:true,meta:{changes:Number(r.changes)}}}});
 return {prepare:wrap,async batch(statements){sql.exec('BEGIN');try{const r=statements.map(s=>s._run());sql.exec('COMMIT');return r}catch(e){sql.exec('ROLLBACK');throw e}},close(){sql.close()}};
}
