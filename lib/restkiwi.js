"use strict"

const http = require('http')
const url = require('url')
const fs = require('fs')

let store = {}
let meta = {}

let stateSaved = true

const server = http.createServer((req, res) => {

  const ip = req.headers['x-real-ip'] || req.connection.remoteAddress

  function response(payload, code){
    res.writeHead(code || 404, {
      'content-type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    })

    return res.end(JSON.stringify(payload))
  }

  function insertValue(k, chunk){
    let v
    try{
      v = JSON.parse(chunk.toString())
    }catch(e){
      return response('error, invalid json')
    }

    if(store[k] && locked(k, ip, req.method))
      return response('error, locked')

    store[k] = v
    const ttl = parseInt(uri.query.ttl) || 70
    const lock = parseInt(uri.query.lock) || null
    let expire = Date.now() + (ttl * 1000)

    if(uri.query.ttl == 0){
      expire = false
    }

    meta[k] = {
      ip: ip,
      lock: lock,
      inserted: Date.now(),
      expire: expire
    }

    stateSaved = false
    response('yope', 200)
  }

  function readValue(keys){
    let k = keys[0]
    let s = store

    for(let k of keys){
      if(s.hasOwnProperty(k)){
        s = s[k]
      }else{
        return response('error, non-existent key/path')
      }
    }

    if(locked(k, ip, req.method))
      return response('error, locked')

    if(expired(k))
      return response('error, expired')

    response(s, 200)
  }


  if(process.env.NODE_ENV !== 'test'){
    console.log(Date(), ip, req.method, req.url)
  }

  const uri = url.parse(req.url, true)
  const keys = uri.pathname.split('/').filter(Boolean)

  if(!keys.length){
    if(process.env.NODE_ENV === 'dev')
      return response(store, 200)

    return response('error, key missing')
  }

  if(req.method === 'POST'){
    req.on('data', chunk => insertValue(keys[0], chunk))
  }else if(req.method === 'GET'){
    readValue(keys)
  }else{
    response('error, unsupported method')
  }
})

function locked(k ,remoteip, method){
  const lock = meta[k].lock
  const ip = meta[k].ip

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
  const m = meta[k]

  if(!m.expire)
    return false

  const isexpired = m.expire < Date.now()

  if(isexpired){
    delete store[k]
    delete meta[k]
  }

  return isexpired
}

function savekv(){
  if(stateSaved)
    return

  const kv = {
    store,
    meta
  }

  fs.writeFile("kv.json", JSON.stringify(kv), (err) => {
    if(err)
      return console.error("could not save kv to disk")

    console.log("kv was saved to disk")
    stateSaved = true
  })
}

function readkv(){
  try{
    fs.accessSync('kv.json', fs.R_OK)
  }catch(e){
    console.log('could not read kv.json')
    return
  }

  let kv = fs.readFileSync('kv.json')

  try{
    kv = JSON.parse(kv)
  }catch(e){
    console.log('could not parse kv.json')
    return
  }

  store = kv.store
  meta = kv.meta
  console.log('loaded kv from file')
}

setInterval(() => {
  savekv()
}, 1000)


readkv()

module.exports = server
