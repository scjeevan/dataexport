#
# Setting Up Environment Variables for imdb
#
#LOG_PATH=/opt/data-export/logs
#DATAEXPORT_CLIENT_PORT=80
#DATAEXPORT_SERVER_PORT=3808

DATAEXPORT_CLIENT_PORT=4141
DATAEXPORT_SERVER_PORT=80

#DATAEXPORT_MYSQL_HOST='104.197.152.119'
#DATAEXPORT_MYSQL_USER=torrentsappusr
#DATAEXPORT_MYSQL_PASSWORD=torrentsadmin@77654
DATAEXPORT_MYSQL_HOST='104.197.169.170'
DATAEXPORT_MYSQL_USER=dataupload
DATAEXPORT_MYSQL_PASSWORD=upload@admin467
DATAEXPORT_MYSQL_DBNAME=torrents
DATAEXPORT_CSV_SAVE_PATH=/home/jeevan/data/
DATAEXPORT_LOG_PATH=/opt/jeevan/logs/
DATAEXPORT_FTP_HOST='104.197.10.155'
DATAEXPORT_FTP_PORT=22
DATAEXPORT_FTP_LOCATION=/
DATAEXPORT_FTP_PROTOCOL=SFTP
DATAEXPORT_FTP_SERVER_KEY=/opt/jeevan/keys/Hydra_jeevan.pem
DATAEXPORT_GQ_PROJECT_ID=devdiggit-1
DATAEXPORT_GQ_KEY_PATH=/opt/jeevan/json/DevDiggit-2f271ead8f6e.json
DATAEXPORT_GQ_SCRIPT_PATH=/opt/Rajnish/Script/ExportDataFromBigQuery.sh
#MANAGEMENT_API_URL=http://dev.management.diggit.com/public/api/
#AUTH_API_BASE_URL=http://dev.management.diggit.com/

export DATAEXPORT_CLIENT_PORT DATAEXPORT_SERVER_PORT DATAEXPORT_MYSQL_HOST DATAEXPORT_MYSQL_USER DATAEXPORT_MYSQL_PASSWORD DATAEXPORT_MYSQL_DBNAME DATAEXPORT_CSV_SAVE_PATH DATAEXPORT_FTP_LOCATION DATAEXPORT_GQ_PROJECT_ID DATAEXPORT_GQ_KEY_PATH DATAEXPORT_GQ_SCRIPT_PATH DATAEXPORT_FTP_HOST DATAEXPORT_FTP_PORT DATAEXPORT_FTP_PROTOCOL DATAEXPORT_FTP_SERVER_KEY