#!/bin/bash -xe
# This script is executed automatically when the server is first started.
# User: root.

# Install latest stable node.js
curl -sL https://deb.nodesource.com/setup | sudo bash -
apt-get install -y nodejs libfontconfig1 vim curl
npm i -g phantomjs casperjs

# Write our client code.
sudo -u ubuntu tee -a /home/ubuntu/client.js > /dev/null <<"EOF"
<%=client.js%>
EOF

# Write Upstart job.
cat > /etc/init/client.conf <<"EOF"
    start on runlevel [2345]

    respawn
    respawn limit 10 5 # max 10 times within 5 seconds

    setuid ubuntu
    chdir /home/ubuntu
    limit nofile 100000 100000

    exec node client.js
EOF

# The upstart job will launch our client and keep it alive.
# Output is written to /var/log/upstart/client.log
initctl reload-configuration
cd /home/ubuntu
mkdir /home/ubuntu/casper
chown ubuntu /home/ubuntu/casper
npm i request fstream tar
start client
