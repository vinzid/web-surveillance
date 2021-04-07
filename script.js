let buttons = document.getElementsByTagName("button");
let unsupported = document.getElementById('unsupported');

for(let i = 0; i < buttons.length; i++) {
  buttons[i].addEventListener("click", async () => {
    unsupported.classList.add('none');
    range.classList.add('none');
    let videos;
    videos = document.getElementsByTagName("video");
    if(videos) {
      for(let j = 0; j < videos.length; j++){
        videos[j].style.display = "none"
      }
    }
    let id = buttons[i].id.replace("Button", "");
    let video = document.getElementById(id);
    if(video) {
      if(video.getAttribute("unsupported")) {
        unsupported.classList.remove('none');
      } else {
        video.style.display = "block";
      }
      return;
    }
    video = document.createElement("video");
    video.id = id;
    if("back" === id){
      video.controls = true;
    }
    videoWrap.append(video);
    let search = new URL(location.href).searchParams;
    let startTime = search.get("starttime");
    let endTime = search.get("endtime");
    let channel = search.get("channel");
    let format = search.get("format");
    let sub = search.get("sub");
    let config = {
      url: `flv?type=${id}${format ? `&format=${format}` : ""}${startTime ? `&starttime=${startTime}` : ""}${endTime ? `&endtime=${endTime}` : ""}${channel ? `&channel=${channel}` : ""}${sub ? `&sub=${sub}` : ""}`
    };
    if("back" === id && startTime) {
      config = await fetch(`${config.url}&act=url`)
        .then(response => response.json());
    }
    if('mp4' === format) {
      let videoWrap = document.getElementById('videoWrap');
      let range = document.getElementById('range');
      video.autoplay = true;
      if(config.url) {
        video.src = config.url;
      } else if('object' === typeof config && Array.isArray(config.segments)) {
        let current = 0;
        let seeking = false;
        let timeFormat = 'YYYYMMDDtHHmmssz';
        let start = Number(moment(startTime, timeFormat).format('X'));
        let end = Number(moment(endTime, timeFormat).format('X'));
        let apiTimeFormat = 'YYYY-MM-DDTHH:mm:ss';
        let segments = config.segments.map((v, i) => {
          v.start = Number(moment(v.StartTime, apiTimeFormat).format('X'));
          v.end = Number(moment(v.EndTime, apiTimeFormat).format('X'));
          v.min = 0 === i ? 0 : config.segments[i - 1].max;
          v.max = v.min + v.end - v.start;
          return v;
        });
        range.setAttribute('max', end - start);
        range.addEventListener('mousedown', e=> {
          seeking = true;
        });
        range.addEventListener('mouseup', e=> {
          seeking = false;
        });
        range.addEventListener('change', e => {
          if(range.value > segments[current].max || range.value < segments[current].min) {
            for(let i = segments.length - 1; i >=0; i--) {
              if(segments[i].min <= range.value) {
                current = i;
                break;
              }
            }
            video.src = segments[current].url;
          }
          video.currentTime = range.value - segments[current].min;
        });
        video.controls = false;
        video.src = segments[current].url;
        if(start > segments[current].start) {
          video.currentTime = start - segments[current].start;
        }
        video.addEventListener('timeupdate', e => {
          if(segments[current].start + video.currentTime >= end) {
            video.pause();
          }
          if(!seeking) {
            range.value = segments[current].min + video.currentTime;
          }
        });
        video.addEventListener('ended', e => {
          if(current < segments.length) {
            current++;
          }
          video.src = segments[current].url;
        });
        video.addEventListener('loadedmetadata', e => {
          range.classList.remove('none');
          videoWrap.style.height = video.offsetHeight + 'px';
        });
        window.addEventListener('resize', e => {
          videoWrap.style.height = video.offsetHeight + 'px';
        });
      }
    } else if (flvjs.isSupported()) {
      let flvPlayer = flvjs.createPlayer({
        type: 'flv',
        isLive: "back" === id ? false : true,
        ...config
      });
      flvPlayer.attachMediaElement(video);
      flvPlayer.load();
      flvPlayer.play();
    } else {
      video.style.display = 'none';
      video.setAttribute("unsupported", true);
      unsupported.classList.remove('none');
    }
  });
}