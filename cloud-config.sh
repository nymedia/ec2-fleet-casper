#!/bin/bash -xe
# This script is executed automatically when the server is first started.
# User: root.

# Install latest stable node.js
curl -sL https://deb.nodesource.com/setup_8.x | sudo bash -
apt-get install -y nodejs libfontconfig1 vim curl
mkdir /home/ubuntu/casper
# Write our client code.
sudo -u ubuntu tee -a /home/ubuntu/client.js > /dev/null <<"EOF"
<%=client.js%>
EOF

# Write Upstart job.
mkdir /var/log/upstart
cat > /etc/systemd/system/client.service <<"EOF"
[Service]
ExecStart=/bin/bash -ce "exec /usr/bin/node /home/ubuntu/client.js >> /home/ubuntu/casper/client.log 2>&1"
Restart=always
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=node
User=ubuntu
Group=ubuntu
Environment=NODE_ENV=production
WorkingDirectory=/home/ubuntu

[Install]
WantedBy=multi-user.target
EOF

# Output is written to /var/log/upstart/client.log
systemctl daemon-reload
cd /home/ubuntu
chown ubuntu /home/ubuntu/casper
npm i request fstream tar phantomjs-prebuilt casperjs
echo 'PATH=$PATH:/home/ubuntu/node_modules/.bin' >> .bashrc 
service client start