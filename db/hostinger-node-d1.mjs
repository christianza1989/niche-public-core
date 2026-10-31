// D1 statement shape for the canonical portable lead SQL; no SQLite translation.
import mysql from 'mysql2/promise';

export function mysqlSettings(input) {
  let values = input;
  if (input.DATABASE_URL) {
    const url = new URL(input.DATABASE_URL);
    if (url.protocol !== 'mysql:') throw Error('node_database_protocol_invalid');
    values = {DB_HOST:url.hostname, DB_PORT:url.port, DB_USER:decodeURIComponent(url.username), DB_PASSWORD:decodeURIComponent(url.password), DB_NAME:decodeURIComponent(url.pathname.slice(1))};
  }
  if (!values.DB_NAME || !values.DB_USER || !values.DB_PASSWORD) throw Error('node_database_not_configured');
  if (!['localhost','127.0.0.1','::1'].includes(values.DB_HOST || 'localhost')) throw Error('node_database_must_be_local');
  const port = Number(values.DB_PORT || 3306);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw Error('node_database_port_invalid');
  const host=!values.DB_HOST||values.DB_HOST==='localhost'?'127.0.0.1':values.DB_HOST;
  return {host,port,user:values.DB_USER,password:values.DB_PASSWORD,database:values.DB_NAME,charset:'utf8mb4',connectionLimit:3,waitForConnections:true,queueLimit:100,connectTimeout:10000,multipleStatements:false};
}

function scalar(value) {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (value instanceof ArrayBuffer) return Buffer.from(value);
  if (ArrayBuffer.isView(value)) return Buffer.from(value.buffer,value.byteOffset,value.byteLength);
  throw Error('node_database_binding_invalid');
}

export function mysqlD1(pool) {
  const query = async (sql, args) => {
    try { return (await pool.execute(sql,args))[0]; }
    catch (error) {
      const code = /^[A-Z0-9_]{1,60}$/.test(error?.code || '') ? error.code : 'QUERY_FAILED';
      throw Error('node_database_'+code); // Never log a DSN, SQL parameters or inquiry text.
    }
  };
  function statement(sql,args=[]) {
    return {
      bind(...values) { return statement(sql,values.map(scalar)); },
      async run() {
        const rows = await query(sql,args);
        return {success:true,results:Array.isArray(rows)?rows:[],meta:{changes:rows.affectedRows || 0,last_row_id:rows.insertId || 0,rows_read:Array.isArray(rows)?rows.length:0,rows_written:rows.affectedRows || 0}};
      },
      async all() { const rows=await query(sql,args);return {success:true,results:Array.isArray(rows)?rows:[],meta:{rows_read:Array.isArray(rows)?rows.length:0}}; },
      async first(column) { const rows=await query(sql,args),row=Array.isArray(rows)?rows[0]:null;return row ? column===undefined?row:row[column]??null : null; },
    };
  }
  return {prepare(sql) { if(typeof sql!=='string'||!sql.trim()||sql.length>65536)throw Error('node_database_statement_invalid');return statement(sql); }};
}

export function createHostingerDatabase(input=process.env) {
  return mysqlD1(mysql.createPool(mysqlSettings(input)));
}
