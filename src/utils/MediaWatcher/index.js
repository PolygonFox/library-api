import chokidar from 'chokidar'
import checksum from 'checksum'
import Media, { MediaTypes } from '../../models/media'
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
        const relativePath = path.substr(this.watchFolder.length + 1);
        path = relativePath.split('.')
        const ext = path.pop()

        const tags = path[0].split('\\');
        const name = tags.pop()

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
          Media.create({
            name,
            checksum: hash,
            path: relativePath,
            tags: tags.map(tag => ({ name: tag })),
            type: mediaType
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
