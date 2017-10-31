#!/bin/bash

rsync --delete -av src/netpie-client-basic/ netpie/client/ 
git add  -am 'update static files' 

