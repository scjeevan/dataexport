#
# Setting Up Environment Variables for imdb
#
#LOG_PATH=/opt/data-export/logs
DATAEXPORT_CLIENT_PORT=3808
DATAEXPORT_SERVER_PORT=80

#DATAEXPORT_CLIENT_PORT=4141
#DATAEXPORT_SERVER_PORT=4142

#DATAEXPORT_MYSQL_HOST='10.128.0.2'
DATAEXPORT_MYSQL_HOST='104.197.152.119'
DATAEXPORT_MYSQL_USER=torrentsappusr
DATAEXPORT_MYSQL_PASSWORD=torrentsadmin@77654
DATAEXPORT_MYSQL_DBNAME=torrents
DATAEXPORT_CSV_SAVE_PATH=/home/jeevan/data/
DATAEXPORT_FTP_LOCATION=/dataexport_sftp/
DATAEXPORT_GQ_PROJECT_ID=devdiggit-1
DATAEXPORT_GQ_KEY_PATH=/home/jeevan/gcloud.key/DevDiggit-2f271ead8f6e.json
#MANAGEMENT_API_URL=http://dev.management.diggit.com/public/api/
#AUTH_API_BASE_URL=http://dev.management.diggit.com/

export DATAEXPORT_CLIENT_PORT DATAEXPORT_SERVER_PORT DATAEXPORT_MYSQL_HOST DATAEXPORT_MYSQL_USER DATAEXPORT_MYSQL_PASSWORD DATAEXPORT_MYSQL_DBNAME DATAEXPORT_CSV_SAVE_PATH DATAEXPORT_FTP_LOCATION DATAEXPORT_GQ_PROJECT_ID DATAEXPORT_GQ_KEY_PATH