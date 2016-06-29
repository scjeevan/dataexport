echo "Stoping all"
forever stopall
echo "Starting DataExport Server"
forever -a -l start data-export-server/server.js
echo "Starting DataExport Client"
cd data-export-client/
forever -a -l client.log start node_modules/http-server/bin/http-server -a 0.0.0.0 -p 4141

cd ..