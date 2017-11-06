#!/bin/bash

rsync --exclude=.git --delete -av src/netpie-client-basic/ netpie/client/ 
rsync --exclude=.git --delete -av src/hivemq-mqtt-web-client/ mqtt/client/ 
ln -s netpie/client netpie-client
ln -s src/espnow-sensor-node-graph/public sensor-nodes
git commit -am 'update static files' 

