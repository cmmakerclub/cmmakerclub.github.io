cd color-wheel-mqtt;
git commit -am "some changes"
git pull --rebase;
git push -u origin master;
cd ..
git commit -am "update submodule"
git pull --rebase;
git push -u origin master

rsync -avz color-wheel-mqtt root@cmmc.xyz:/var/www/html/
