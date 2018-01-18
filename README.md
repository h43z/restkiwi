### restkiwi

A simple kv store you can write/read via http requests.

```sh
$ curl --data '{"foo": "bar", "blub": [1,2,"hello"]}' localhost:8888/mykey
  "yope"

$ curl localhost:8888/mykey
  {
    "foo": "bar",
    "blub": [1, 2, "hello"]
  }

$ curl localhost:8888/mykey/foo
  "bar"

$ curl localhost:8888/mykey/blub/2
  "hello"

```

Let the key expire after 100 seconds (default 70).
Set to 0 if it should never expire.
```sh
$ curl localhost:8888/myotherkey?ttl=100
  "yope"

```

Allow the key to be read and written by the current IP only.
```sh
$ curl localhost:8888/key?lock=2
  "yope"
```

Let other IP's read the key but not write.
```sh
$ curl localhost:8888/key?lock=1
  "yope"
```

Run tests
```
$ npm test

> restkiwi@1.0.0 test /home/rich/projects/restkiwi
> NODE_ENV=test ./node_modules/.bin/mocha -R spec

loaded kv from file


  server response
    ✓ should return error for object root
    ✓ should return error non-existent key/path
    ✓ should return error for saving malformed json
    ✓ should return error for saving wrong type
    ✓ should return yope for right type
    ✓ should return yope for saving json
    ✓ should save deeply nested json object
    ✓ should retrieve nested json object via keys
    ✓ should retrieve nested json object via keys
    ✓ should retrieve nested json object via keys
    ✓ should retrieve existing object
    ✓ should delete key of ttl 1 after 1 sec (1007ms)
    ✓ should created locked kv entry with lock1
    ✓ should retrieved locked kv entry with correct ip and lock1
    ✓ should retrieved locked kv entry with incorrect ip and lock1
    ✓ should not be able to overwrite locked kv entry with incorrect ip
    ✓ should not have overwritten value
    ✓ should be able to overwritte lock1 with correct ip
    ✓ should not retrieved locked kv entry with incorrect ip lock2


  19 passing (1s)
```
