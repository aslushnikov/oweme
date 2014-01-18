# WIP

## MySQL setup

MySQL should use UTF-8 all over the place; this should be placed in `~/.my.cnf` file to achieve this.

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

## Important tests to write

- test utf-8 support
- test impossibility to create two users with the same email

