#!/bin/bash

rsync --delete -av src/netpie-client-basic/ netpie/client/ 
rsync --delete -av src/hivemq-mqtt-web-client/ mqtt/client/ 
git commit -am 'update static files' 

