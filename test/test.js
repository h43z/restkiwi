const server = require('../lib/restkiwi.js');
const request = require('request');
const assert = require('assert');
const localip = "192.168.1.101"

describe('server response', () => {
  before(function () {
    server.listen(8888);
  });

	it('should return error for object root', (done) => {
		request.get('http://localhost:8888', (err, res, body) => {
      assert.equal(res.headers['access-control-allow-origin'], '*');
      assert.equal(res.statusCode, 404);
      assert.equal('"error, key missing"', body);
			done();
		});
	});

	it('should return error non-existent key/path', (done) => {
		request.get('http://localhost:8888/key', (err, res, body) => {
      assert.equal(res.statusCode, 404);
      assert.equal('"error, non-existent key/path"', body);
			done();
		});
	});

	it('should return error for saving malformed json', (done) => {
		request.post({url: 'http://localhost:8888/key', body:'{a:2}'}, (err, res, body) => {
      assert.equal(res.statusCode, 404);
      assert.equal('"error, invalid json"', body);
			done();
		});
	});

	it('should return error for saving wrong type', (done) => {
		request.post({url: 'http://localhost:8888/key', body:'hi'}, (err, res, body) => {
      assert.equal('"error, invalid json"', body);
			done();
		});
	});

	it('should return yope for right type', (done) => {
		request.post({url: 'http://localhost:8888/key', body:'4'}, (err, res, body) => {
      assert.equal(res.statusCode, 200);
      assert.equal('"yope"', body);
			done();
		});
	});

	it('should return yope for saving json', (done) => {
		request.post({url: 'http://localhost:8888/key', body:'{"one":4}'}, (err, res, body) => {
      assert.equal('"yope"', body);
			done();
		});
	});

	it('should save deeply nested json object', (done) => {
		request.post({url: 'http://localhost:8888/key2', body:'{"one":{"two":[1,"a", {"t": 5}]}}'}, (err, res, body) => {
      assert.equal('"yope"', body);
			done();
		});
	});

	it('should retrieve nested json object via keys', (done) => {
		request.get('http://localhost:8888/key2/one/two/0', (err, res, body) => {
      assert.equal('1', body);
			done();
		});
	});

	it('should retrieve nested json object via keys', (done) => {
    request.get('http://localhost:8888/key2/one/two/1', (err, res, body) => {
      assert.equal('"a"', body);
			done();
		});
	});

	it('should retrieve nested json object via keys', (done) => {
    request.get('http://localhost:8888/key2/one/two/2/t', (err, res, body) => {
      assert.equal('5', body);
			done();
		});
	});

	it('should retrieve existing object', (done) => {
		request.get('http://localhost:8888/key', (err, res, body) => {
      assert.equal('{"one":4}', body);
			done();
		});
	});

	it('should delete key of ttl 1 after 1 sec', (done) => {
		request.post({url: 'http://localhost:8888/key?ttl=1', body:'5'}, (err, res, body) => {
      assert.equal('"yope"', body);
      setTimeout(()=>{
        request.get('http://localhost:8888/key', (err, res, body) => {
          assert.equal('"error, expired"', body);
          done();
          });
      }, 1000)
		});
	});

	it('should created locked kv entry with lock1', (done) => {
		request.post({url: 'http://localhost:8888/key?lock=1', body:'5'}, (err, res, body) => {
      assert.equal('"yope"', body);
			done();
		});
	});

	it('should retrieved locked kv entry with correct ip and lock1', (done) => {
		request.get('http://localhost:8888/key', (err, res, body) => {
      assert.equal('5', body);
			done();
		});
	});

	it('should retrieved locked kv entry with incorrect ip and lock1', (done) => {
		request.get('http://' + localip + ':8888/key', (err, res, body) => {
      assert.equal('5', body);
			done();
		});
	});

	it('should not be able to overwrite locked kv entry with incorrect ip', (done) => {
		request.post({url: 'http://' + localip + ':8888/key?lock=1', body:'10'}, (err, res, body) => {
      assert.equal('"error, locked"', body);
			done();
      });
  });

  it('should not have overwritten value', (done) => {
		request.get('http://' + localip + ':8888/key', (err, res, body) => {
      assert.equal('5', body);
			done();
		});
  });

  it('should be able to overwritte lock1 with correct ip', (done) => {
		request.post({url: 'http://localhost:8888/key?lock=2', body:'10'}, (err, res, body) => {
      assert.equal('"yope"', body);
      request.get('http://localhost:8888/key', (err, res, body) => {
        assert.equal('10', body);
        done();
      });
    });
  });

	it('should not retrieved locked kv entry with incorrect ip lock2', (done) => {
		request.get('http://' + localip + ':8888/key', (err, res, body) => {
      assert.equal('"error, locked"', body);
			done();
		});
	});





  after(() => {
    server.close();
  });
});
