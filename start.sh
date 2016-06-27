#!/bin/sh
#echo "Starting Data Export Server"
#forever -a -l $IMDB_LOG_PATH/server.log -e $IMDB_LOG_PATH/server_error.log -o $IMDB_LOG_PATH/server_out.log start diggit-imdb-server/server.js
echo "Starting Data Export Client"
cd data-export-client/
forever -a -l $LOG_PATH/client.log start node_modules/http-server/bin/http-server -a 0.0.0.0 -p $CLIENT_PORT
cd ..