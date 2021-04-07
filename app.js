const fs = require("fs");
const express = require("express");
const ffmpeg = require("fluent-ffmpeg");
const { exec } = require("child_process");
const moment = require("moment");
const app = express();
process.setMaxListeners(0);

app.use(express.static(__dirname));
app.use("/flv", async (req, res) => {
  let urlPath = "back" === req.query.type ? "tracks" : "Channels";
  let format = req.query.format || "flv";
  let startTime = req.query.starttime;
  let endTime = req.query.endtime;
  let sub = req.query.sub;
  let url = `rtsp://${process.env.NVR_USERNAME}:${process.env.NVR_PASSWORD}@${process.env.NVR_IP}:${process.env.NVR_PORT}/Streaming/${urlPath}/${req.query.channel || 4}0${'1' === sub ? '2' : '1'}${startTime ? `?starttime=${startTime}` : ""}${endTime ? `&endtime=${endTime}` : ""}`;
  let file;
  if(startTime) {
    file = `./${startTime}-${endTime}.${format}`;
  } else {
    file = `./cache.${format}`;
  }
  let command = ffmpeg(url);
  if("mp4" !== format) {
    command = command.format(format)
  }
  command = command.videoCodec("copy")
    .noAudio()
    .on("error", err => {
      fs.unlink(file, () => {});
      if(!err.toString().match(/(SIGKILL|closed)/)){
        console.log("ffmpeg error", err);
      }
    })
    .on('end', () => {
      console.log('ffmpeg finished');
    });
  res.on("close", () => {
    command && command.kill();
  });
  process.on('SIGINT', () => {
    command && command.kill();
    process.exit();
  });
  if("back" === req.query.type) {
    if("url" === req.query.act) {
      let timeFormat = "YYYYMMDDtHHmmssz";
      let start = moment(startTime, timeFormat);
      let startHour = start.hour();
      let end = moment(endTime, timeFormat);
      let endHour = end.hour();
      if(endHour - startHour <= 1) {
        res.json({url: req.url.replace(/&act=url/, "").replace(/^\/\?/, "flv?")});
        return;
      }
      let segments = [];
      apiTimeFormat = 'YYYY-MM-DDTHH:mm:ss'
      for(let i = startHour; i < endHour; i++) {
        end = start.clone().add(1, "h");
        let file = `${start.format(timeFormat)}z-${end.format(timeFormat)}z.${format}`;
        let stat;
        try{
          stat = fs.statSync(file);
        }catch(e) {
          break;
        }
        segments.push(
          {
            duration: 3600000,
            filesize: stat.size,
            url: file,
            StartTime: start.format(apiTimeFormat),
            EndTime: end.format(apiTimeFormat),
          }
        );
        start = end;
      }
      res.json({segments});
      return;
    }
    if(fs.existsSync(file)) {
      res.redirect(file);
      return;
    } else if("1" === req.query.cache) {
      if("flv" === format) {
        command = command.outputOption("-flvflags", "add_keyframe_index")
      }
      command.save(file);
      res.end("caching");
      return;
    }
  }
  command.inputOption("-rtsp_transport", "tcp", "-buffer_size", "102400")
    .pipe(res);
});
app.listen(process.env.FE_FLV_PORT || 4100);