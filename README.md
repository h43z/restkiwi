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
