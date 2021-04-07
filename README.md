## 浏览器监控播放 Surveillance Video in Browser
使用浏览器访问实现监控视频的直播和回放  
Use browser to visit live and playback of surveillance video.

### 实现方案 Implementation
利用海康 NVR 的 rtsp 视频流，用 Node.js 调用 fluent-ffmpeg（内核为 [FFmpeg][ffmpeg] 命令行工具），转化为 flv / mp4（回放）格式，通过 Express 输出 http，在前端使用 [flv.js][flv.js] / video 进行加载和播放  
Utilize rtsp video stream of hikvision NVR, use Node.js to invoke fluent-ffmpeg (wrapper of [FFmpeg][ffmpeg] terminal tool), translate to flv / mp4 (playback) format, and export http via Express, load and play with [flv.js][flv.js] / video in frontend.

### 安装与运行 Intall and Run
>npm i  
node app  

### 访问地址 Access Address
>http://localhost:4100  

[ffmpeg]: https://www.ffmpeg.org
[flv.js]: https://github.com/bilibili/flv.js