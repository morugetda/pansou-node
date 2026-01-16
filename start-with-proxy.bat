@echo off
echo Starting PanSou with proxy...
set PROXY=socks5://127.0.0.1:1080
set PORT=8080
cd /d "C:\Users\Administrator\Desktop\Everything\新建文件夹\紫薇\go\pansou-node"
npm start
pause