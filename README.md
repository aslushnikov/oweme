# WIP

## MySQL setup

MySQL should use UTF-8 all over the place; this should be placed in `my.cnf` file to achieve this.

```
[client]
default-character-set=utf8

[mysql]
default-character-set=utf8

[mysqld]
collation-server = utf8_unicode_ci
init-connect='SET NAMES utf8'
character-set-server = utf8
```

