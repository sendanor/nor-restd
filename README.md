nor-restd
=========

This is a daemon and a development server which runs our modular REST API components.

Please note: It is an experimental development version. Things might be broken.

Installation
------------

You can install the application from NPM:

```
npm install -g nor-restd nor-restd-auth-apikey nor-restd-db-mysql nor-restd-viewer
```

Let's do some basic configurations:

```
$ nor-restd config set host 0.0.0.0
Set host from '127.0.0.1' to '0.0.0.0'

$ nor-restd config set port 8500
Set port from 3000 to 8500

$ nor-restd config set use.auth nor-restd-auth-apikey
Set use.auth from undefined to 'nor-restd-auth-apikey'

$ nor-restd config set resources.viewer 'nor-restd-viewer'
Set resources.viewer from undefined to 'nor-restd-viewer'

$ nor-restd config set resources.data 'nor-restd-db-mysql'
Set resources.data from undefined to 'nor-restd-db-mysql'

$ makepasswd --crypt-md5 --chars 8
PYtrzdBC   $1$F0XGa8w6$4.RWFHXY0QTwh2ZOCnvTB/

$ nor-restd config set opts.auth.keys.demo.secret '$1$F0XGa8w6$4.RWFHXY0QTwh2ZOCnvTB/'
Set opts.auth.keys.demo.secret from undefined to '$1$F0XGa8w6$4.RWFHXY0QTwh2ZOCnvTB/'

$ nor-restd config set opts.auth.keys.demo.access.read true
Set opts.auth.keys.demo.access.read from undefined to 'true'

$ nor-restd config set opts.data.host localhost
Set opts.data.host from undefined to 'localhost'

$ nor-restd config set opts.data.user nor_restd_demo
Set opts.data.user from undefined to 'nor_restd_demo'

$ nor-restd config set opts.data.database nor_restd_demo
Set opts.data.database from undefined to 'nor_restd_demo'

$ nor-restd config set opts.data.password 12345678
Set opts.data.password from undefined to '12345678'
```

Then start it: `nor-restd start`

Then point your browser to http://demo:PYtrzdBC@localhost:8500/.

Or test with CLI: `curl -H "Accept: application/json" http://demo:PYtrzdBC@localhost:8500/`
