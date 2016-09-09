echo "Stoping all"
forever stopall
echo "Starting DataExport Server"
forever -a -l $DATAEXPORT_LOG_PATH/server.log -e $DATAEXPORT_LOG_PATH/server_error.log -o $DATAEXPORT_LOG_PATH/server_out.log start data-export-server/server.js
echo "Starting DataExport Client"
cd data-export-client/
forever -a -l $DATAEXPORT_LOG_PATH/client.log start node_modules/http-server/bin/http-server -a 0.0.0.0 -p $DATAEXPORT_CLIENT_PORT
cd ..