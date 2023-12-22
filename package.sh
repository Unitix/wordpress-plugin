#!/usr/bin/env sh

rm -f merchi-wordpress-plugin.zip

zip -r merchi-wordpress-plugin.zip MerchiPlugin README.md assets images index.php merchi-plugin.php readme.txt templates uninstall.php composer.json composer.lock vendor -x '**/.git/*' -x '**/tests/*' -x '*.gitignore' -x '*.swp'
