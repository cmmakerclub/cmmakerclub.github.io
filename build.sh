#!/bin/bash

rsync --exclude=.git --delete -av src/netpie-client-basic/ netpie/client/ 
rsync --exclude=.git --delete -av src/hivemq-mqtt-web-client/ mqtt/client/ 
git commit -am 'update static files' 

