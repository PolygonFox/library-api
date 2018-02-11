import chokidar from 'chokidar'
import sharp from 'sharp'
import checksum from 'checksum'
import Media, { MediaTypes } from '../../models/media'
import { relative } from 'path';
import fs from 'fs'
class MediaWatcher {

  constructor({ watchFolder }) {

    this.startWatching(watchFolder);
    this.watchFolder = watchFolder;
  }

  startWatching(watchFolder) {
    const watcher = chokidar.watch(watchFolder, {
      persistent: true,
      ignored: '**/thumbs/**'
    })

    watcher.on('add', this.handleFileAdded.bind(this))
  }

  handleFileAdded(path, stats) {

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

          // Create media
          // Media.create({
          //   name,
          //   checksum: hash,
          //   path: relativePath,
          //   tags: tags.map(tag => ({ name: tag })),
          //   type: mediaType
          // })

          const thumbFolderPath = `${this.watchFolder}${ path.length ? `\\${path}` : '' }\\thumbs`

          // Create thumbs folder if it doesn't exist
          if (!fs.existsSync(thumbFolderPath)){
              fs.mkdirSync(thumbFolderPath);
          }

          sharp(absolutePath).resize(360, null, {
            fastShrinkOnLoad: true
          }).webp().toFile(thumbFolderPath + `\\${name}.webp`, (err, info) => {
            console.log(err, info)
          })

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
