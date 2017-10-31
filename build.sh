#!/bin/bash

rsync --delete -av src/netpie-client-basic/ netpie/client/ 
git commit -am 'update static files' 

