"use strict"
const http = require('http');
const url = require('url');
const fs = require('fs');
let store = {};
let meta = {};

const server = http.createServer((req, res) => {

  function send(payload, code){
    res.writeHead(code || 404, {
      'content-type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    return res.end(JSON.stringify(payload));
  }

  if(process.env.NODE_ENV !== 'test'){
    console.log(Date(), req.connection.remoteAddress, req.method, req.url)
  }

  const uri = url.parse(req.url, true);
  const keys = uri.pathname.split('/').filter(Boolean)

  if(!keys.length){
    if(process.env.NODE_ENV === 'dev')
      return send(store, 200);

    return send('error, key missing');
  }

  let k = keys[0]

  if(req.method === 'POST'){
    req.on('data', chunk => {
      try{
        const v = JSON.parse(chunk.toString());
        const ip = req.connection.remoteAddress

        if(store[k] && locked(k, ip, req.method))
          return send('error, locked');

        store[k] = v;
        const ttl = parseInt(uri.query.ttl) || 70;
        const lock = parseInt(uri.query.lock) || null;
        let expire = Date.now() + ttl * 1000;

        if(uri.query.ttl == 0){
          expire = false;
        }

        meta[k] = {
          ip: ip,
          lock: lock,
          expire: expire
        };

        send('yope', 200);
      }catch(e){
        send('error, invalid json');
      }
    });
  }else if(req.method === 'GET'){
    let s = store;

    for(let k of keys){
      if(s.hasOwnProperty(k)){
        s = s[k];
      }else{
        return send('error, non-existent key/path');
      }
    }

    if(locked(k, req.connection.remoteAddress, req.method))
      return send('error, locked');

    if(expired(k))
      return send('error, expired');

    send(s, 200);
  }else{
    send('error, unsupported method');
  }
});

function locked(k ,remoteip, method){
  const lock = meta[k].lock;
  const ip = meta[k].ip;

  if(lock != 1 && lock != 2)
    return false

  if(method === "GET"){
    if(lock === 1)
      return false

    if(lock === 2)
      return !(ip === remoteip)
  }

  if(method === "POST")
    return !(ip === remoteip)

}

function expired(k){
  const m = meta[k];

  if(!m.expire)
    return false

  const isexpired = m.expire < Date.now();

  if(isexpired){
    delete store[k];
    delete meta[k];
  }
    return isexpired;
}

function savekv(){
  const kv = {
    store: store,
    meta: meta
  };

  fs.writeFile("kv.json", JSON.stringify(kv), (err) => {
    if(err)
      return console.error("could not save kv to disk");

    console.log("kv was saved to disk");
  });
}

function readkv(){
  try{
    fs.accessSync('kv.json', fs.R_OK);
  }catch(e){return}

  let kv = fs.readFileSync('kv.json');

  try{
    kv = JSON.parse(kv);
  }catch(e){return}

  store = kv.store;
  meta = kv.meta;
  console.log('loaded kv from file')
}

setInterval(() => {
  for(const k in store){
    expired(k)
  }
  savekv();
}, 1000 * 60);


readkv();
module.exports = server;
