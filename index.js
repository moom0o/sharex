const express = require('express');
const app = express();

const mime = require('mime-types');
const upload = require('express-fileupload');
const rand = require('random-id');
let cooldown = new Set();

const auth = 'PASS';

app.use(upload({ preserveExtension: true, safeFileNames: true, limits: { fileSize: 100 * 1024 * 1024 } }));
app.use(express.json());
app.get('/', async (req, res) => {
  res.sendFile(__dirname + "/images/index.html")
})
app.get('/:image', async (req, res) => {
  // let colors = ["ff0000","ff4000","ffa000","00a000","0080ff","8000ff"]
  // let result = Math.floor((Math.random() * colors.length))
  if (!require('fs').existsSync('/home/1b1t/image/images/' + req.params.image)) return res.status(404).send('Image not found.');
  var myString = req.params.image
  var myRegexp = /^([^ ]*)\.([^ ]*)$/g
  var match = myRegexp.exec(myString);
  if(!match){
    return res.status(500).send("no extension")
  }
  console.log(match[2])
  var image = require('fs').readFileSync(`/home/1b1t/image/images/${req.params.image}`);  ;
  if(match[2] != "png" || !req.params.image.startsWith("!")){
    console.log(match[2] + "  equal png")
    res.sendFile(__dirname + '/images/' + req.params.image);
    return
  }
  if(req.query.embed != "true"){
    res.sendFile(__dirname + '/images/' + req.params.image);
    return
  }
  console.log(match[2])
  var ColorThief = require('color-thief'),  
  colorThief     = new ColorThief(),  
  fs             = require('fs');  
  var rgb = colorThief.getColor(image);  
  var onecolor = require('onecolor');  
  if(rgb){
    var rgbCode = 'rgb( ' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ')'; // 'rgb(r, g, b)'
    var hex = onecolor(rgbCode).hex();  
  } else {
    var hex = '0'
  }
  

  res.send(`<img src="/i/${req.params.image}" alt="Image"> <meta name="viewport" content="width=device-width, minimum-scale=0.1"><meta property="twitter:card" content="summary_large_image"><meta name="description" content="moomoo's image server <3"><meta property="og:image" content="https://read-my-man.ga/i/${req.params.image}"><meta property="og:title" content="moomoo's image server"><meta name="theme-color" content="${hex}"><meta property="og:image:type" content="image/png" />  <script>window.location = "/i/${req.params.image}"</script>`)
})
app.get('/i/:image', async (req, res) => { 
    if (!require('fs').existsSync('/home/1b1t/image/images/' + req.params.image)) return res.status(404).send('Image not found.');
    res.sendFile(__dirname + '/images/' + req.params.image);

});
app.get('/api/gen', async (req, res) => {
  const fs = require("fs")
  if(req.query.key === "SECRET"){
  let keys = JSON.parse(fs.readFileSync(`/home/1b1t/image/data/keys.json`, 'utf-8'))
  var crypto = require("crypto");
  const id = crypto.randomBytes(30).toString('hex');
  keys.push(id)
  fs.writeFileSync (`/home/1b1t/image/data/keys.json`, JSON.stringify (keys, null, 4), err => {
    if (err) throw err;
  })
  if(req.query.info){
    fs.appendFile('/home/1b1t/image/data/keyinfo.txt', `${id} | ${req.query.info}` + '\n', (err) => {
      if (err) throw err;
  })
  }
  res.send(id)
  } else {
    res.status(403).send("wrong key fag")
  }
})
app.post('/image', async (req, res) => {
const fs = require("fs")
    // if (!req.headers.authorization || req.headers.authorization !== auth) return res.sendStatus(401);
    let keys = JSON.parse(fs.readFileSync(`/home/1b1t/image/data/keys.json`, 'utf-8'))
    if(keys.includes(req.headers.authorization)){
      if(cooldown.has(req.headers.authorization)){
        return res.status(429).send("You can only send an image every 5 seconds. (Abuse will result in removal of all images and api key revoked.)")
      }
      const file = req.files.file;

      const id = rand(6, 'aA0');
      const ext = mime.extension(file.mimetype);
      let exts = ["png", "jpg", "jpeg", "jpe", "jfif", "exif", "bmp", "dib", "rle", "tiff", "tif", "gif", "tga", "dds", "jxr", "wdp", "wmp", "heic", "webp", "mp4", "avi", "mpeg", "mp3"]
      if(!exts.includes(ext)){
        return res.status(403).send("Not a valid type")
      }
      console.log(ext)
      const fileName = id + '.' + ext;
      file.mv('/home/1b1t/image/images/' + fileName);
  
      res.send(`${req.query.url}/${fileName}`);

      cooldown.add(req.headers.authorization)
      setTimeout(() => {
        cooldown.delete(req.headers.authorization)
      }, 15 * 1000)
      fs.appendFile('/home/1b1t/image/data/log.txt', `${fileName} | ${req.headers.authorization} | ${req.headers['x-forwarded-for']} | ${req.connection.remoteAddress}` + '\n', (err) => {
        if (err) throw err;
    })

    } else {
      res.status(401).send("Not authorized. Contact moomoo#7300 for an api key if interested!")
    }


});

// listen for requests :)
app.listen(3000)
