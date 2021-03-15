#!/usr/bin/env node
const ytdl = require("ytdl-core");
const FFmpeg = require("fluent-ffmpeg");
const { PassThrough } = require("stream");
const fs = require("fs");

module.exports = streamify;

function streamify(params, opt) {
  console.log("params", params);
  opt = {
    ...opt,
    videoFormat: "mp4",
    quality: "lowest",
    audioFormat: "mp3",
    filter(format) {
      return format.container === opt.videoFormat && format.audioBitrate;
    },
  };

  const video = ytdl("https://www.youtube.com/watch?v=" + params.id, opt);
  const { file, audioFormat } = opt;
  const stream = file ? fs.createWriteStream(file) : new PassThrough();
  const ffmpeg = new FFmpeg(video);

  process.nextTick(() => {
    setTimeout(() => {
      ffmpeg.on("progress", (data) => {
        // console.log(data);
        params.progress[params.id] = data.timemark;
      });

      ffmpeg.on("error", (error) => stream.emit("error", error));

      const output = ffmpeg.format(audioFormat).pipe(stream);
      output.on("error", (error) => {
        video.end();
        stream.emit("error", error);
      });
    });
  });

  stream.video = video;
  stream.ffmpeg = ffmpeg;

  return stream;
}
