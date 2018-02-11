import chokidar from 'graceful-chokidar'
import sharp from 'sharp'
import checksum from 'checksum'
import Media, { MediaTypes } from '../../models/media'
import { relative } from 'path';
import fs from 'fs'
import ffmpeg from 'fluent-ffmpeg'
import Config from '../../../config'

var walkSync = function(dir, filelist) {
  var path = path || require('path');
  var fs = fs || require('fs'),
      files = fs.readdirSync(dir);
  filelist = filelist || [];
  files.forEach(function(file) {
      if (dir.split('\\').pop() !== 'thumbs') {
        if (fs.statSync(path.join(dir, file)).isDirectory() ){
            filelist = walkSync(path.join(dir, file), filelist);
        }
        else {
            filelist.push(path.join(dir, file));
        }
      }
  });
  return filelist;
};


// This watcher doesn't actually watch anymore ;)
class MediaWatcher {

  constructor({ watchFolder }) {
    this.watchFolder = watchFolder;
    this.startWatching(watchFolder)
  }

  startWatching(watchFolder) {
    const filelist = [];
    console.info('Fetching all files to be checked..');
    walkSync(watchFolder, filelist)
    console.log(`Fetching complete, ${filelist.length} files to check.`)

    const checkFiles = setInterval(() => {
      const filesToCheck = filelist.splice(0, 1000)
      console.log(filesToCheck.length)
      filesToCheck.forEach(this.handleFileAdded.bind(this))

      console.log(filelist.length + ' to go..')

      if(filesToCheck.length === 0) {
        clearInterval(checkFiles)
        console.log('Checking done!');
      }
    }, 5000)
  }

  handleFileAdded(path) {

    checksum.file(path, (error, hash) => {

      if (!error) {
        const absolutePath = path;
        const relativePath = path.substr(this.watchFolder.length + 1);
        path = relativePath.split('.')
        const ext = path.pop()

        const tags = path[0].split('\\');
        const name = tags.pop()

        path = tags.join('\\');

        // Media type
        let mediaType = MediaTypes.FILE;
        if (ext.match(/(jpg|jpeg|png|gif)/)) {
          mediaType = MediaTypes.PHOTO
        } else if (ext.match(/(webm)/)) {
          mediaType = MediaTypes.VIDEO
        }


        this.mediaExists(hash).then(() => {
          console.log(`Checksum '${hash}' already exists. Media not created.`);
        }).catch(() => {

          const thumbFolderPath = `${this.watchFolder}${path.length ? `\\${path}` : ''}\\thumbs`
          const thumbnailPath = thumbFolderPath + `\\${name}.webp`;
          const relativeThumbnailFolder = (`${path.length ? `${path}\\` : ''}thumbs\\`)
          const relativeThumbnailPath = `${relativeThumbnailFolder}\\${name}.webp`;

          // Create thumbs folder if it doesn't exist
          if (!fs.existsSync(thumbFolderPath)) {
            fs.mkdirSync(thumbFolderPath);
          }

          if (mediaType === MediaTypes.PHOTO) {
            sharp(absolutePath).metadata()
              .then(info => {

                // Create media
                Media.create({
                  name,
                  checksum: hash,
                  path: relativePath,
                  width: info.width,
                  height: info.height,
                  thumbnail: relativeThumbnailPath,
                  tags: tags.map(tag => ({ name: tag })),
                  type: mediaType
                })

                console.log('Photo media created.')

                sharp(absolutePath).resize(360, null, {
                  fastShrinkOnLoad: true
                }).webp().toFile(thumbnailPath, (err, info) => {
                  if (err) {
                    console.log('Failed to generate thumbnail', err)
                  } else {
                    console.log('Thumbnail generated.');
                  }
                })
              })
          } else if (mediaType === MediaTypes.VIDEO) {

            ffmpeg(absolutePath)
              .setFfmpegPath(Config.FfmpegPath)
              .on('error', function (err) {
                console.log('testerr')
              }).on('end', function (info) {
                console.log(info)
              })
              .ffprobe(0, function (err, data) {
                if (err) {
                  console.log(err);
                } else {

                  const { width, height } = data.streams[0]

                  // Create screenshots
                  ffmpeg(absolutePath)
                  .screenshots({
                    folder: thumbFolderPath,
                    filename: `${name}.webp`,
                    count: 4,
                    size: '360x' + Math.ceil((height / width * 360))
                  }).on('error', function(err) {
                    console.log(err);
                  })


                  // Create media
                  Media.create({
                    name,
                    checksum: hash,
                    path: relativePath,
                    width,
                    height,
                    thumbnail: relativeThumbnailFolder,
                    tags: tags.map(tag => ({ name: tag })),
                    type: mediaType
                  })

                  console.log('Video media created.')
                }

              })
          }
        })
      } else {
        console.log('Checksum failed for: ' + path)
      }
    })
  }

  mediaExists(checksum) {
    return new Promise((resolve, reject) => {

      Media.findOne({ checksum }, (err, res) => {
        if (err) {
          console.log(err)
        }

        if (!res) {
          reject()
        } else {
          resolve()
        }
      })
    });
  }
}


export default MediaWatcher
