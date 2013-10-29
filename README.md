nor-restd
=========

This is a daemon and a development server which runs our modular REST API components.

Please note: It is an experimental development version. Things might be broken.

Modules
-------

* [nor-restd-auth-apikey](https://github.com/Sendanor/nor-restd-auth-apikey) -- implements HTTP Basic Auth support
* [nor-restd-viewer](https://github.com/Sendanor/nor-restd-viewer) -- implements HTML-based viewer for JSON REST APIs
* [nor-restd-db-mysql](https://github.com/Sendanor/nor-restd-db-mysql) -- implements MySQL Database REST API

Installation
------------

You can install the application from NPM:

```
npm install -g nor-restd nor-restd-auth-apikey nor-restd-db-mysql nor-restd-viewer
```

Configuration
-------------

Let's do some basic configurations:

```
$ nor-restd config set host 0.0.0.0
$ nor-restd config set port 8500
$ nor-restd config set use.auth nor-restd-auth-apikey
$ nor-restd config set resources.viewer 'nor-restd-viewer'
$ nor-restd config set resources.data 'nor-restd-db-mysql'
```

`nor-restd-auth-apikey` uses standard [crypt(3)](https://github.com/Sendanor/node-crypt3) hashes for passwords. 

In Debian-based systems (and probably other too) you may install a program called `makepasswd`:

```
$ makepasswd --crypt-md5 --chars 8
PYtrzdBC   $1$F0XGa8w6$4.RWFHXY0QTwh2ZOCnvTB/
```

```
$ nor-restd config set opts.auth.keys.demo.secret '$1$F0XGa8w6$4.RWFHXY0QTwh2ZOCnvTB/'
$ nor-restd config set opts.auth.keys.demo.access.read true
$ nor-restd config set opts.data.host localhost
$ nor-restd config set opts.data.user nor_restd_demo
$ nor-restd config set opts.data.database nor_restd_demo
$ nor-restd config set opts.data.password 12345678
```

Then start it: `nor-restd start`

Then point your browser to [http://demo:PYtrzdBC@localhost:8500/](http://demo:PYtrzdBC@localhost:8500/).

Or test it with `curl` on CLI: `curl -H "Accept: application/json" http://demo:PYtrzdBC@localhost:8500/`
