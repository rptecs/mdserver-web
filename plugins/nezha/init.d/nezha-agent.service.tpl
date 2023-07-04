[Unit]
Description=Nezha Agent
After=syslog.target
#After=network.target
#After=nezha-dashboard.service

[Service]
# Modify these two values and uncomment them if you have
# repos with lots of files and get an HTTP error 500 because
# of that
###
#LimitMEMLOCK=infinity
#LimitNOFILE=65535
Type=simple
User=root
Group=root
WorkingDirectory={$SERVER_PATH}/nezha/agent/
ExecStart={$SERVER_PATH}/nezha/agent/nezha-agent -s {$APP_HOST} -p {$APP_SECRET}
Restart=always
#Environment=DEBUG=true

# Some distributions may not support these hardening directives. If you cannot start the service due
# to an unknown option, comment out the ones not supported by your version of systemd.
#ProtectSystem=full
#PrivateDevices=yes
#PrivateTmp=yes
#NoNewPrivileges=true

[Install]
WantedBy=multi-user.target