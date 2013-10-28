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

```
