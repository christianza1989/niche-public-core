import tls from 'node:tls';
import {Readable,Writable} from 'node:stream';

// The existing SMTP protocol uses TLS-on-connect (465), never plaintext/STARTTLS.
export function connect(address,options={}) {
  if(options.secureTransport!=='on'||!address?.hostname||!Number.isInteger(address.port))throw Error('node_socket_requires_tls');
  const socket=tls.connect({host:address.hostname,port:address.port,servername:address.hostname,rejectUnauthorized:true,minVersion:'TLSv1.2',allowHalfOpen:false});
  const closed=new Promise((resolve,reject)=>{socket.once('close',resolve);socket.once('error',reject);});
  closed.catch(()=>{});
  return {readable:Readable.toWeb(socket),writable:Writable.toWeb(socket),closed,async close(){socket.destroy();await closed.catch(()=>{});}};
}
